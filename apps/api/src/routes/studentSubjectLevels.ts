import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { isApiLevel, toApiLevel, toDbLevel } from "../utils/difficultyLevel";
import { getCurrentGroupIdsByStudent } from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const studentSubjectLevelsRouter = new Hono();

studentSubjectLevelsRouter.get(
	"/student-subject-levels",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const [students, groups, levels, groupIdsByStudent] = await Promise.all([
			prisma.student.findMany({
				where: { user: { isActive: true } },
				include: { user: true },
				orderBy: { user: { name: "asc" } },
			}),
			prisma.group.findMany(),
			prisma.studentSubjectLevel.findMany(),
			getCurrentGroupIdsByStudent(),
		]);
		const subjectIdByGroupId = new Map(groups.map((g) => [g.id, g.subjectId]));
		const subjects = await prisma.subject.findMany();
		const subjectById = new Map(subjects.map((s) => [s.id, s]));
		const levelByStudentSubject = new Map(
			levels.map((l) => [`${l.studentId}:${l.subjectId}`, l.level]),
		);

		const rows: {
			studentId: string;
			studentName: string;
			subjectId: string | null;
			subjectName: string | null;
			level: "beginner" | "intermediate" | "advanced" | null;
		}[] = [];

		for (const student of students) {
			const groupIds = groupIdsByStudent.get(student.id) ?? [];
			const subjectIds = [
				...new Set(
					groupIds
						.map((gId) => subjectIdByGroupId.get(gId))
						.filter((sId): sId is string => !!sId),
				),
			];
			if (subjectIds.length === 0) {
				rows.push({
					studentId: student.id,
					studentName: student.user.name,
					subjectId: null,
					subjectName: null,
					level: null,
				});
				continue;
			}
			for (const subjectId of subjectIds) {
				const dbLevel = levelByStudentSubject.get(`${student.id}:${subjectId}`);
				rows.push({
					studentId: student.id,
					studentName: student.user.name,
					subjectId,
					subjectName: subjectById.get(subjectId)?.name ?? "",
					level: dbLevel ? toApiLevel(dbLevel) : null,
				});
			}
		}

		return c.json({ success: true, data: rows });
	},
);

studentSubjectLevelsRouter.put(
	"/students/:studentId/subject-levels/:subjectId",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const studentId = c.req.param("studentId");
		const subjectId = c.req.param("subjectId");
		const body = (await c.req.json()) as { level?: string | null };

		const student = await prisma.student.findUnique({
			where: { id: studentId },
		});
		if (!student) {
			return c.json({ success: false, message: "Student not found." }, 404);
		}
		const subject = await prisma.subject.findUnique({
			where: { id: subjectId },
		});
		if (!subject) {
			return c.json({ success: false, message: "Subject not found." }, 404);
		}

		if (body.level === null || body.level === undefined) {
			await prisma.studentSubjectLevel
				.delete({ where: { studentId_subjectId: { studentId, subjectId } } })
				.catch(() => {});
			return c.json({
				success: true,
				data: { studentId, subjectId, level: null },
			});
		}

		if (!isApiLevel(body.level)) {
			return c.json(
				{
					success: false,
					message: "level must be beginner, intermediate, advanced, or null.",
				},
				400,
			);
		}

		const dbLevel = toDbLevel(body.level);
		await prisma.studentSubjectLevel.upsert({
			where: { studentId_subjectId: { studentId, subjectId } },
			create: { studentId, subjectId, level: dbLevel },
			update: { level: dbLevel },
		});

		return c.json({
			success: true,
			data: { studentId, subjectId, level: toApiLevel(dbLevel) },
		});
	},
);
