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
	const studentIds = await getCurrentStudentIds(groupId);
	const students = await prisma.student.findMany({
		where: { id: { in: studentIds } },
		include: { user: true },
	});

	const sessions = await prisma.session.findMany({
		where: { groupId },
		orderBy: { date: "desc" },
	});

	const data = sessions.map((s) => ({
		sessionId: s.id,
		year: s.date.getFullYear(),
		month: s.date.getMonth() + 1,
		day: s.date.getDate(),
		date: s.date.toISOString(),
		teacherId,
		teacherName: teacher?.user.name ?? null,
		subjectId: group.subjectId,
		subjectName: group.subject.name,
		studentIds: students.map((st) => ({
			studentId: st.id,
			studentName: st.user.name,
		})),
		status: s.status.toLowerCase(),
		durationMinutes: s.durationMinutes,
	}));

	return c.json({ success: true, data });
});

sessionsRouter.post("/groups/:id/sessions", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const groupId = c.req.param("id");

	const group = await prisma.group.findUnique({ where: { id: groupId } });
	if (!group) {
		return c.json({ success: false, message: "Group not found." }, 404);
	}

	const isAdmin = authUser.role === "ADMIN";
	const isAssignedTeacher = await isUserCurrentTeacherOfGroup(
		authUser,
		groupId,
	);
	if (!isAdmin && !isAssignedTeacher) {
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
