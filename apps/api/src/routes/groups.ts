import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import {
	getCurrentGroupIdsForStudent,
	getCurrentGroupIdsForTeacher,
	getCurrentStudentIds,
	getCurrentTeacherId,
} from "../utils/groupState";
import { notifyUser } from "../utils/notify";
import { prisma } from "../utils/prisma";

export const groupsRouter = new Hono();

async function notifyGroupAssignment(
	role: "teacher" | "student",
	id: string,
	groupName: string,
) {
	const record =
		role === "teacher"
			? await prisma.teacher.findUnique({ where: { id } })
			: await prisma.student.findUnique({ where: { id } });
	if (!record) return;
	await notifyUser({
		userId: record.userId,
		type: "GROUP_ASSIGNMENT",
		title:
			role === "teacher"
				? "Assigned to a new group"
				: "Enrolled in a new group",
		message: `You've been ${role === "teacher" ? "assigned to teach" : "enrolled in"} ${groupName}.`,
		link: "/groups",
	});
}

const DAYS_OF_WEEK = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
] as const;
type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

function isDayOfWeek(value: unknown): value is DayOfWeek {
	return (
		typeof value === "string" &&
		(DAYS_OF_WEEK as readonly string[]).includes(value.toUpperCase())
	);
}

type DbGroupType = "GROUP" | "PRIVATE" | "SEMI_PRIVATE";
type ApiGroupType = "group" | "private" | "semi-private";

// SEMI_PRIVATE <-> semi-private isn't a plain case-convert, hence a helper
// rather than the toUpperCase/toLowerCase used for other enums here.
function toApiGroupType(groupType: DbGroupType): ApiGroupType {
	return groupType === "SEMI_PRIVATE"
		? "semi-private"
		: (groupType.toLowerCase() as "group" | "private");
}

function toDbGroupType(groupType: ApiGroupType): DbGroupType {
	return groupType === "semi-private"
		? "SEMI_PRIVATE"
		: (groupType.toUpperCase() as "GROUP" | "PRIVATE");
}

// A period is "current" for a group when the group was live at any point
// during that month: it started on or before the period's end, and (if it
// has an endDate) ended on or after the period's start. A period selector
// on the card grid uses this to hide groups that didn't exist yet — or had
// already finished — in the chosen month.
function isGroupLiveInPeriod(
	group: { startDate: Date; endDate: Date | null },
	period: { year: number; month: number },
) {
	const periodStart = new Date(period.year, period.month - 1, 1);
	const periodEnd = new Date(period.year, period.month, 0, 23, 59, 59, 999);
	if (group.startDate > periodEnd) return false;
	if (group.endDate && group.endDate < periodStart) return false;
	return true;
}

async function serializeGroup(
	group: {
		id: string;
		name: string;
		subjectId: string;
		isActive: boolean;
		startDate: Date;
		endDate: Date | null;
		cardColor: string | null;
		groupType: DbGroupType;
	},
	// Which month the "sessions held so far" circles describe, and the
	// `asOf` for roster replay. Defaults to the current month, so callers
	// that don't care keep today's view.
	period: { year: number; month: number } = (() => {
		const now = new Date();
		return { year: now.getFullYear(), month: now.getMonth() + 1 };
	})(),
) {
	const asOf = new Date(period.year, period.month, 0, 23, 59, 59, 999);
	const subject = await prisma.subject.findUnique({
		where: { id: group.subjectId },
	});
	const teacherId = await getCurrentTeacherId(group.id, asOf);
	const teacher = teacherId
		? await prisma.teacher.findUnique({
				where: { id: teacherId },
				include: { user: true },
			})
		: null;
	const studentIds = await getCurrentStudentIds(group.id, asOf);
	const students = await prisma.student.findMany({
		where: { id: { in: studentIds } },
		include: { user: true },
	});
	const teacherAvatarUrl = teacher?.user.avatarUrl ?? null;
	const plannedSessions = await prisma.plannedSession.findMany({
		where: { groupId: group.id },
	});

	// Which days of the selected period already have a logged session —
	// surfaced on the group card as a quick "sessions held" indicator,
	// distinct from plannedSessions (the recurring weekly template, not
	// what's actually happened).
	const monthStart = new Date(period.year, period.month - 1, 1);
	const monthEnd = new Date(period.year, period.month, 1);
	const sessionsThisMonth = await prisma.session.findMany({
		where: { groupId: group.id, date: { gte: monthStart, lt: monthEnd } },
		orderBy: { date: "asc" },
	});

	return {
		groupId: group.id,
		groupName: group.name,
		subjectId: group.subjectId,
		subjectName: subject?.name ?? null,
		teacherId,
		teacherName: teacher?.user.name ?? null,
		teacherAvatarUrl,
		isActive: group.isActive,
		startDate: group.startDate.toISOString(),
		endDate: group.endDate ? group.endDate.toISOString() : null,
		cardColor: group.cardColor,
		groupType: toApiGroupType(group.groupType),
		studentIds: students.map((s) => ({
			studentId: s.id,
			studentName: s.user.name,
			avatarUrl: s.user.avatarUrl,
		})),
		plannedSessions: plannedSessions.map((p) => ({
			plannedSessionId: p.id,
			dayOfWeek: p.dayOfWeek.toLowerCase(),
			time: p.time,
		})),
		currentMonthSessionDays: sessionsThisMonth.map((s) => s.date.getDate()),
	};
}

groupsRouter.get("/groups", requireAuth, async (c) => {
	const authUser = c.get("authUser");

	// Optional period filter — defaults to the current running month so the
	// card grid's session-day circles describe "this month" out of the box.
	const monthParam = Number(c.req.query("month"));
	const yearParam = Number(c.req.query("year"));
	const now = new Date();
	const hasPeriod =
		c.req.query("month") !== undefined || c.req.query("year") !== undefined;
	const periodValid =
		Number.isInteger(monthParam) &&
		monthParam >= 1 &&
		monthParam <= 12 &&
		Number.isInteger(yearParam) &&
		yearParam >= 2000;
	if (hasPeriod && !periodValid) {
		return c.json(
			{ success: false, message: "month and year must be valid." },
			400,
		);
	}
	const period = hasPeriod
		? { month: monthParam, year: yearParam }
		: { month: now.getMonth() + 1, year: now.getFullYear() };
	const asOf = new Date(period.year, period.month, 0, 23, 59, 59, 999);

	let groups: {
		id: string;
		name: string;
		subjectId: string;
		isActive: boolean;
		startDate: Date;
		endDate: Date | null;
		cardColor: string | null;
		groupType: DbGroupType;
	}[];

	if (authUser.role === "ADMIN") {
		groups = await prisma.group.findMany({ orderBy: { name: "asc" } });
	} else if (authUser.role === "TEACHER") {
		const teacher = await prisma.teacher.findUnique({
			where: { userId: authUser.id },
		});
		const groupIds = teacher
			? await getCurrentGroupIdsForTeacher(teacher.id, asOf)
			: [];
		groups = await prisma.group.findMany({ where: { id: { in: groupIds } } });
	} else {
		const student = await prisma.student.findUnique({
			where: { userId: authUser.id },
		});
		const groupIds = student
			? await getCurrentGroupIdsForStudent(student.id, asOf)
			: [];
		groups = await prisma.group.findMany({ where: { id: { in: groupIds } } });
	}

	// Hide groups that weren't live at any point in the selected period —
	// started after it ended, or ended before it started.
	const liveGroups = groups.filter((g) => isGroupLiveInPeriod(g, period));

	const data = await Promise.all(
		liveGroups.map((group) => serializeGroup(group, period)),
	);
	return c.json({ success: true, data });
});

groupsRouter.post("/groups", requireAuth, requireRole("ADMIN"), async (c) => {
	const body = (await c.req.json()) as {
		groupName?: string;
		subjectId?: string;
		teacherId?: string;
		studentIds?: string[];
		startDate?: string;
		endDate?: string | null;
		plannedSessions?: { dayOfWeek: string; time: string }[];
	};

	if (!body.groupName || !body.subjectId || !body.startDate) {
		return c.json(
			{
				success: false,
				message: "groupName, subjectId, and startDate are required.",
			},
			400,
		);
	}

	const group = await prisma.group.create({
		data: {
			name: body.groupName,
			subjectId: body.subjectId,
			startDate: new Date(body.startDate),
			endDate: body.endDate ? new Date(body.endDate) : null,
		},
	});

	if (body.teacherId) {
		await prisma.groupTeacher.create({
			data: { groupId: group.id, teacherId: body.teacherId, action: "ASSIGN" },
		});
		await notifyGroupAssignment("teacher", body.teacherId, group.name);
	}
	for (const studentId of body.studentIds ?? []) {
		await prisma.groupEnrollment.create({
			data: { groupId: group.id, studentId, action: "JOIN" },
		});
		await notifyGroupAssignment("student", studentId, group.name);
	}
	for (const planned of body.plannedSessions ?? []) {
		if (!isDayOfWeek(planned.dayOfWeek) || !planned.time) continue;
		await prisma.plannedSession.create({
			data: {
				groupId: group.id,
				dayOfWeek: planned.dayOfWeek.toUpperCase() as DayOfWeek,
				time: planned.time,
			},
		});
	}

	return c.json({ success: true, data: await serializeGroup(group) }, 201);
});

groupsRouter.patch(
	"/groups/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const groupId = c.req.param("id");
		const body = (await c.req.json()) as {
			groupName?: string;
			subjectId?: string;
			isActive?: boolean;
			teacherId?: string | null;
			studentIds?: string[];
			startDate?: string;
			endDate?: string | null;
			plannedSessions?: { dayOfWeek: string; time: string }[];
			cardColor?: string | null;
			groupType?: ApiGroupType;
		};

		const existing = await prisma.group.findUnique({ where: { id: groupId } });
		if (!existing) {
			return c.json({ success: false, message: "Group not found." }, 404);
		}

		const group = await prisma.group.update({
			where: { id: groupId },
			data: {
				...(body.groupName !== undefined && { name: body.groupName }),
				...(body.subjectId !== undefined && { subjectId: body.subjectId }),
				...(body.isActive !== undefined && { isActive: body.isActive }),
				...(body.cardColor !== undefined && { cardColor: body.cardColor }),
				...(body.groupType !== undefined && {
					groupType: toDbGroupType(body.groupType),
				}),
				...(body.startDate !== undefined && {
					startDate: new Date(body.startDate),
				}),
				...(body.endDate !== undefined && {
					endDate: body.endDate ? new Date(body.endDate) : null,
				}),
			},
		});

		if (body.teacherId !== undefined) {
			const currentTeacherId = await getCurrentTeacherId(groupId);
			if (currentTeacherId !== body.teacherId) {
				if (currentTeacherId) {
					await prisma.groupTeacher.create({
						data: { groupId, teacherId: currentTeacherId, action: "REMOVED" },
					});
				}
				if (body.teacherId) {
					await prisma.groupTeacher.create({
						data: { groupId, teacherId: body.teacherId, action: "ASSIGN" },
					});
					await notifyGroupAssignment("teacher", body.teacherId, group.name);
				}
			}
		}

		if (body.studentIds !== undefined) {
			const currentStudentIds = await getCurrentStudentIds(groupId);
			const nextStudentIds = body.studentIds;
			const toRemove = currentStudentIds.filter(
				(id) => !nextStudentIds.includes(id),
			);
			const toAdd = nextStudentIds.filter(
				(id) => !currentStudentIds.includes(id),
			);
			for (const studentId of toRemove) {
				await prisma.groupEnrollment.create({
					data: { groupId, studentId, action: "LEAVE" },
				});
			}
			for (const studentId of toAdd) {
				await prisma.groupEnrollment.create({
					data: { groupId, studentId, action: "JOIN" },
				});
				await notifyGroupAssignment("student", studentId, group.name);
			}
		}

		if (body.plannedSessions !== undefined) {
			await prisma.plannedSession.deleteMany({ where: { groupId } });
			for (const planned of body.plannedSessions) {
				if (!isDayOfWeek(planned.dayOfWeek) || !planned.time) continue;
				await prisma.plannedSession.create({
					data: {
						groupId,
						dayOfWeek: planned.dayOfWeek.toUpperCase() as DayOfWeek,
						time: planned.time,
					},
				});
			}
		}

		return c.json({ success: true, data: await serializeGroup(group) });
	},
);

groupsRouter.delete(
	"/groups/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const groupId = c.req.param("id");
		try {
			await prisma.group.delete({ where: { id: groupId } });
			return c.json({ success: true });
		} catch (error: any) {
			if (error.code === "P2025") {
				return c.json({ success: false, message: "Group not found." }, 404);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);
