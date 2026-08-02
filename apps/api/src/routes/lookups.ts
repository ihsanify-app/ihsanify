import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const lookupsRouter = new Hono();

lookupsRouter.get("/subjects", requireAuth, requireRole("ADMIN"), async (c) => {
	const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
	return c.json({
		success: true,
		data: subjects.map((s) => ({ subjectId: s.id, subjectName: s.name })),
	});
});

lookupsRouter.get("/teachers", requireAuth, requireRole("ADMIN"), async (c) => {
	const teachers = await prisma.teacher.findMany({ include: { user: true } });
	return c.json({
		success: true,
		data: teachers.map((t) => ({ teacherId: t.id, teacherName: t.user.name })),
	});
});

lookupsRouter.get("/students", requireAuth, requireRole("ADMIN"), async (c) => {
	const students = await prisma.student.findMany({ include: { user: true } });
	return c.json({
		success: true,
		data: students.map((s) => ({ studentId: s.id, studentName: s.user.name })),
	});
});
