import type { AuthedUser } from "./auth";
import { prisma } from "./prisma";

export async function getCurrentTeacherId(groupId: string) {
	const latest = await prisma.groupTeacher.findFirst({
		where: { groupId },
		orderBy: { date: "desc" },
	});
	return latest?.action === "ASSIGN" ? latest.teacherId : null;
}

export async function getCurrentStudentIds(groupId: string) {
	const events = await prisma.groupEnrollment.findMany({
		where: { groupId },
		orderBy: { date: "asc" },
	});
	const lastActionByStudent = new Map<string, "JOIN" | "LEAVE">();
	for (const event of events) {
		lastActionByStudent.set(event.studentId, event.action);
	}
	return [...lastActionByStudent.entries()]
		.filter(([, action]) => action === "JOIN")
		.map(([studentId]) => studentId);
}

export async function getCurrentGroupIdsForStudent(studentId: string) {
	const events = await prisma.groupEnrollment.findMany({
		where: { studentId },
		orderBy: { date: "asc" },
	});
	const lastActionByGroup = new Map<string, "JOIN" | "LEAVE">();
	for (const event of events) {
		lastActionByGroup.set(event.groupId, event.action);
	}
	return [...lastActionByGroup.entries()]
		.filter(([, action]) => action === "JOIN")
		.map(([groupId]) => groupId);
}

export async function getCurrentGroupIdsForTeacher(teacherId: string) {
	const events = await prisma.groupTeacher.findMany({
		where: { teacherId },
		orderBy: { date: "asc" },
	});
	const lastActionByGroup = new Map<string, "ASSIGN" | "REMOVED">();
	for (const event of events) {
		lastActionByGroup.set(event.groupId, event.action);
	}
	return [...lastActionByGroup.entries()]
		.filter(([, action]) => action === "ASSIGN")
		.map(([groupId]) => groupId);
}

export async function isUserCurrentTeacherOfGroup(
	authUser: AuthedUser,
	groupId: string,
) {
	if (authUser.role !== "TEACHER") return false;
	const teacher = await prisma.teacher.findUnique({
		where: { userId: authUser.id },
	});
	if (!teacher) return false;
	return (await getCurrentTeacherId(groupId)) === teacher.id;
}

export async function canUserAccessGroup(
	authUser: AuthedUser,
	groupId: string,
) {
	if (authUser.role === "ADMIN") return true;
	if (authUser.role === "TEACHER") {
		return isUserCurrentTeacherOfGroup(authUser, groupId);
	}
	const student = await prisma.student.findUnique({
		where: { userId: authUser.id },
	});
	if (!student) return false;
	return (await getCurrentStudentIds(groupId)).includes(student.id);
}
