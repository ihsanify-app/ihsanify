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

async function serializeGroup(group: {
	id: string;
	name: string;
	subjectId: string;
	isActive: boolean;
	startDate: Date;
	endDate: Date | null;
	cardColor: string | null;
	groupType: DbGroupType;
}) {
	const subject = await prisma.subject.findUnique({
		where: { id: group.subjectId },
	});
	const teacherId = await getCurrentTeacherId(group.id);
	const teacher = teacherId
		? await prisma.teacher.findUnique({
				where: { id: teacherId },
				include: { user: true },
			})
		: null;
	const studentIds = await getCurrentStudentIds(group.id);
	const students = await prisma.student.findMany({
		where: { id: { in: studentIds } },
		include: { user: true },
	});
	const teacherAvatarUrl = teacher?.user.avatarUrl ?? null;
	const plannedSessions = await prisma.plannedSession.findMany({
		where: { groupId: group.id },
	});

	// Which days this month already have a logged session — surfaced on the
	// group card as a quick "sessions held so far" indicator, distinct from
	// plannedSessions (the recurring weekly template, not what's actually
	// happened).
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
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
			? await getCurrentGroupIdsForTeacher(teacher.id)
			: [];
		groups = await prisma.group.findMany({ where: { id: { in: groupIds } } });
	} else {
		const student = await prisma.student.findUnique({
			where: { userId: authUser.id },
		});
		const groupIds = student
			? await getCurrentGroupIdsForStudent(student.id)
			: [];
		groups = await prisma.group.findMany({ where: { id: { in: groupIds } } });
	}

	const data = await Promise.all(groups.map(serializeGroup));
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
