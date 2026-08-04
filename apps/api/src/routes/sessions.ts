import { Hono } from "hono";
import { requireAuth } from "../utils/auth";
import {
	canUserAccessGroup,
	getCurrentStudentIds,
	getCurrentTeacherId,
	isUserCurrentTeacherOfGroup,
} from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const sessionsRouter = new Hono();

async function canManageGroupSessions(
	authUser: Parameters<typeof isUserCurrentTeacherOfGroup>[0],
	groupId: string,
) {
	if (authUser.role === "ADMIN") return true;
	return isUserCurrentTeacherOfGroup(authUser, groupId);
}

function serializeSession(
	session: {
		id: string;
		date: Date;
		durationMinutes: number;
		status: "DRAFT" | "FINISHED";
	},
	teacherId: string | null,
	teacherName: string | null,
	subjectId: string,
	subjectName: string,
	attendees: { studentId: string; studentName: string }[],
) {
	return {
		sessionId: session.id,
		year: session.date.getFullYear(),
		month: session.date.getMonth() + 1,
		day: session.date.getDate(),
		date: session.date.toISOString(),
		teacherId,
		teacherName,
		subjectId,
		subjectName,
		studentIds: attendees,
		status: session.status.toLowerCase(),
		durationMinutes: session.durationMinutes,
	};
}

sessionsRouter.get("/groups/:id/sessions", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const groupId = c.req.param("id");

	const group = await prisma.group.findUnique({
		where: { id: groupId },
		include: { subject: true },
	});
	if (!group) {
		return c.json({ success: false, message: "Group not found." }, 404);
	}

	if (!(await canUserAccessGroup(authUser, groupId))) {
		return c.json(
			{ success: false, message: "You don't have access to this group." },
			403,
		);
	}

	const teacherId = await getCurrentTeacherId(groupId);
	const teacher = teacherId
		? await prisma.teacher.findUnique({
				where: { id: teacherId },
				include: { user: true },
			})
		: null;
	const rosterStudentIds = await getCurrentStudentIds(groupId);
	const rosterStudents = await prisma.student.findMany({
		where: { id: { in: rosterStudentIds } },
		include: { user: true },
	});
	const roster = rosterStudents.map((st) => ({
		studentId: st.id,
		studentName: st.user.name,
	}));

	const sessions = await prisma.session.findMany({
		where: { groupId },
		orderBy: { date: "desc" },
		include: {
			attendance: { include: { student: { include: { user: true } } } },
		},
	});

	const data = sessions.map((s) => {
		const attendees =
			s.attendance.length > 0
				? s.attendance.map((a) => ({
						studentId: a.studentId,
						studentName: a.student.user.name,
					}))
				: roster;
		return serializeSession(
			s,
			teacherId,
			teacher?.user.name ?? null,
			group.subjectId,
			group.subject.name,
			attendees,
		);
	});

	return c.json({ success: true, roster, data });
});

sessionsRouter.post("/groups/:id/sessions", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const groupId = c.req.param("id");

	const group = await prisma.group.findUnique({ where: { id: groupId } });
	if (!group) {
		return c.json({ success: false, message: "Group not found." }, 404);
	}

	if (!(await canManageGroupSessions(authUser, groupId))) {
		return c.json(
			{
				success: false,
				message:
					"Only an admin or this group's current teacher can log a session.",
			},
			403,
		);
	}

	const body = (await c.req.json()) as {
		date?: string;
		durationMinutes?: number;
		status?: "draft" | "finished";
	};

	if (!body.date || !body.durationMinutes) {
		return c.json(
			{ success: false, message: "date and durationMinutes are required." },
			400,
		);
	}

	const session = await prisma.session.create({
		data: {
			groupId,
			date: new Date(body.date),
			durationMinutes: body.durationMinutes,
			status: body.status === "finished" ? "FINISHED" : "DRAFT",
		},
	});

	return c.json(
		{
			success: true,
			data: {
				sessionId: session.id,
				year: session.date.getFullYear(),
				month: session.date.getMonth() + 1,
				day: session.date.getDate(),
				date: session.date.toISOString(),
				status: session.status.toLowerCase(),
				durationMinutes: session.durationMinutes,
			},
		},
		201,
	);
});

sessionsRouter.patch(
	"/groups/:id/sessions/:sessionId",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		const groupId = c.req.param("id");
		const sessionId = c.req.param("sessionId");

		const group = await prisma.group.findUnique({
			where: { id: groupId },
			include: { subject: true },
		});
		if (!group) {
			return c.json({ success: false, message: "Group not found." }, 404);
		}
		const existing = await prisma.session.findUnique({
			where: { id: sessionId },
		});
		if (!existing || existing.groupId !== groupId) {
			return c.json({ success: false, message: "Session not found." }, 404);
		}

		if (!(await canManageGroupSessions(authUser, groupId))) {
			return c.json(
				{
					success: false,
					message:
						"Only an admin or this group's current teacher can edit a session.",
				},
				403,
			);
		}

		const body = (await c.req.json()) as {
			date?: string;
			durationMinutes?: number;
			status?: "draft" | "finished";
			studentIds?: string[];
		};

		const session = await prisma.session.update({
			where: { id: sessionId },
			data: {
				...(body.date !== undefined && { date: new Date(body.date) }),
				...(body.durationMinutes !== undefined && {
					durationMinutes: body.durationMinutes,
				}),
				...(body.status !== undefined && {
					status: body.status === "finished" ? "FINISHED" : "DRAFT",
				}),
			},
		});

		if (body.studentIds !== undefined) {
			const rosterStudentIds = await getCurrentStudentIds(groupId);
			const validStudentIds = body.studentIds.filter((id) =>
				rosterStudentIds.includes(id),
			);
			await prisma.sessionAttendance.deleteMany({ where: { sessionId } });
			for (const studentId of validStudentIds) {
				await prisma.sessionAttendance.create({
					data: { sessionId, studentId },
				});
			}
		}

		const teacherId = await getCurrentTeacherId(groupId);
		const teacher = teacherId
			? await prisma.teacher.findUnique({
					where: { id: teacherId },
					include: { user: true },
				})
			: null;
		const attendance = await prisma.sessionAttendance.findMany({
			where: { sessionId },
			include: { student: { include: { user: true } } },
		});
		const rosterStudentIds = await getCurrentStudentIds(groupId);
		const rosterStudents = await prisma.student.findMany({
			where: { id: { in: rosterStudentIds } },
			include: { user: true },
		});
		const attendees =
			attendance.length > 0
				? attendance.map((a) => ({
						studentId: a.studentId,
						studentName: a.student.user.name,
					}))
				: rosterStudents.map((st) => ({
						studentId: st.id,
						studentName: st.user.name,
					}));

		return c.json({
			success: true,
			data: serializeSession(
				session,
				teacherId,
				teacher?.user.name ?? null,
				group.subjectId,
				group.subject.name,
				attendees,
			),
		});
	},
);

sessionsRouter.delete(
	"/groups/:id/sessions/:sessionId",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		const groupId = c.req.param("id");
		const sessionId = c.req.param("sessionId");

		const existing = await prisma.session.findUnique({
			where: { id: sessionId },
		});
		if (!existing || existing.groupId !== groupId) {
			return c.json({ success: false, message: "Session not found." }, 404);
		}

		if (!(await canManageGroupSessions(authUser, groupId))) {
			return c.json(
				{
					success: false,
					message:
						"Only an admin or this group's current teacher can delete a session.",
				},
				403,
			);
		}

		await prisma.session.delete({ where: { id: sessionId } });
		return c.json({ success: true });
	},
);
