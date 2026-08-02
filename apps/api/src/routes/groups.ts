import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import {
	getCurrentGroupIdsForStudent,
	getCurrentGroupIdsForTeacher,
	getCurrentStudentIds,
	getCurrentTeacherId,
} from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const groupsRouter = new Hono();

async function serializeGroup(group: {
	id: string;
	name: string;
	subjectId: string;
	isActive: boolean;
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

	return {
		groupId: group.id,
		groupName: group.name,
		subjectId: group.subjectId,
		subjectName: subject?.name ?? null,
		teacherId,
		teacherName: teacher?.user.name ?? null,
		isActive: group.isActive,
		studentIds: students.map((s) => ({
			studentId: s.id,
			studentName: s.user.name,
		})),
	};
}

groupsRouter.get("/groups", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	let groups: {
		id: string;
		name: string;
		subjectId: string;
		isActive: boolean;
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
	};

	if (!body.groupName || !body.subjectId) {
		return c.json(
			{ success: false, message: "groupName and subjectId are required." },
			400,
		);
	}

	const group = await prisma.group.create({
		data: { name: body.groupName, subjectId: body.subjectId },
	});

	if (body.teacherId) {
		await prisma.groupTeacher.create({
			data: { groupId: group.id, teacherId: body.teacherId, action: "ASSIGN" },
		});
	}
	for (const studentId of body.studentIds ?? []) {
		await prisma.groupEnrollment.create({
			data: { groupId: group.id, studentId, action: "JOIN" },
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
