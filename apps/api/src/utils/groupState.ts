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
