import type { AuthedUser } from "./auth";
import { prisma } from "./prisma";

export async function getCurrentTeacherId(
	groupId: string,
	asOf: Date = new Date(),
) {
	const latest = await prisma.groupTeacher.findFirst({
		where: { groupId, date: { lte: asOf } },
		orderBy: { date: "desc" },
	});
	return latest?.action === "ASSIGN" ? latest.teacherId : null;
}

// `asOf` defaults to now, so every existing caller keeps its original
// "current roster" behavior unchanged — pass an explicit date (e.g. end of
// a past payroll month) to replay the enrollment log only up to that point,
// for historically-accurate reporting instead of today's roster.
export async function getCurrentStudentIds(
	groupId: string,
	asOf: Date = new Date(),
) {
	const events = await prisma.groupEnrollment.findMany({
		where: { groupId, date: { lte: asOf } },
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

// See getCurrentStudentIds' comment — `asOf` defaults to now.
export async function getCurrentGroupIdsForStudent(
	studentId: string,
	asOf: Date = new Date(),
) {
	const events = await prisma.groupEnrollment.findMany({
		where: { studentId, date: { lte: asOf } },
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

// See getCurrentStudentIds' comment — `asOf` defaults to now.
export async function getCurrentGroupIdsForTeacher(
	teacherId: string,
	asOf: Date = new Date(),
) {
	const events = await prisma.groupTeacher.findMany({
		where: { teacherId, date: { lte: asOf } },
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

export async function canManageGroup(authUser: AuthedUser, groupId: string) {
	if (authUser.role === "ADMIN") return true;
	return isUserCurrentTeacherOfGroup(authUser, groupId);
}

// Bulk version of getCurrentGroupIdsForStudent — one query for every
// student's current groups instead of one query per student, for
// admin-facing pages (e.g. Settings → Assignment) that need all of them.
export async function getCurrentGroupIdsByStudent(asOf: Date = new Date()) {
	const events = await prisma.groupEnrollment.findMany({
		where: { date: { lte: asOf } },
		orderBy: { date: "asc" },
	});
	const lastActionByStudentGroup = new Map<string, "JOIN" | "LEAVE">();
	for (const event of events) {
		lastActionByStudentGroup.set(
			`${event.studentId}:${event.groupId}`,
			event.action,
		);
	}
	const groupIdsByStudent = new Map<string, string[]>();
	for (const [key, action] of lastActionByStudentGroup) {
		if (action !== "JOIN") continue;
		const [studentId, groupId] = key.split(":");
		const existing = groupIdsByStudent.get(studentId) ?? [];
		existing.push(groupId);
		groupIdsByStudent.set(studentId, existing);
	}
	return groupIdsByStudent;
}

// Bulk version of getCurrentTeacherId — one query for every group's current
// teacher instead of one query per group.
export async function getCurrentTeacherIdByGroup(asOf: Date = new Date()) {
	const events = await prisma.groupTeacher.findMany({
		where: { date: { lte: asOf } },
		orderBy: { date: "asc" },
	});
	const lastEventByGroup = new Map<
		string,
		{ action: "ASSIGN" | "REMOVED"; teacherId: string }
	>();
	for (const event of events) {
		lastEventByGroup.set(event.groupId, {
			action: event.action,
			teacherId: event.teacherId,
		});
	}
	const teacherIdByGroup = new Map<string, string>();
	for (const [groupId, event] of lastEventByGroup) {
		if (event.action === "ASSIGN")
			teacherIdByGroup.set(groupId, event.teacherId);
	}
	return teacherIdByGroup;
}

// For each of a student's currently active groups, the (subjectId,
// teacherId) pair taught there — the primitive the Assignment question-bank
// feature's visibility rule is built from. Ended groups (isActive: false)
// are excluded even if no clean LEAVE event exists for them.
export async function getCurrentSubjectTeacherPairsForStudent(
	studentId: string,
) {
	const groupIds = await getCurrentGroupIdsForStudent(studentId);
	if (groupIds.length === 0) return [];
	const groups = await prisma.group.findMany({
		where: { id: { in: groupIds }, isActive: true },
	});
	const pairs: { subjectId: string; teacherId: string }[] = [];
	for (const group of groups) {
		const teacherId = await getCurrentTeacherId(group.id);
		if (teacherId) pairs.push({ subjectId: group.subjectId, teacherId });
	}
	return pairs;
}
