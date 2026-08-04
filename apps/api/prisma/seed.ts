import { hash } from "bcryptjs";
import { prisma } from "../src/utils/prisma";

const SEED_PASSWORD = "password123";

async function main() {
	const password = await hash(SEED_PASSWORD, 10);

	const subjectNames = [
		"Tahsin",
		"Tahfizh",
		"Bahasa Inggris",
		"Bahasa Arab",
		"Calistung",
	];
	const subjects: Record<string, { id: string }> = {};
	for (const name of subjectNames) {
		subjects[name] = await prisma.subject.upsert({
			where: { name },
			update: {},
			create: { name },
		});
	}

	const adminAvatarUrl = "https://i.pravatar.cc/150?u=admin@ihsanify.com";
	await prisma.user.upsert({
		where: { email: "admin@ihsanify.com" },
		update: { avatarUrl: adminAvatarUrl },
		create: {
			email: "admin@ihsanify.com",
			password,
			name: "Admin",
			role: "ADMIN",
			avatarUrl: adminAvatarUrl,
		},
	});

	const teacherSeeds = [
		{
			email: "lisna@ihsanify.com",
			name: "Ustadzah Lisna",
			gender: "FEMALE" as const,
			subjects: ["Tahsin", "Calistung"],
			isActive: true,
		},
		{
			email: "mulki@ihsanify.com",
			name: "Mister Mulki",
			gender: "MALE" as const,
			subjects: ["Bahasa Inggris"],
			isActive: true,
		},
		{
			email: "siska@ihsanify.com",
			name: "Ustadzah Siska",
			gender: "FEMALE" as const,
			subjects: ["Tahfizh"],
			isActive: true,
		},
		{
			email: "afifah@ihsanify.com",
			name: "Ustadzah Afifah",
			gender: "FEMALE" as const,
			subjects: ["Bahasa Arab"],
			isActive: true,
		},
		{
			email: "ghalda@ihsanify.com",
			name: "Ustadzah Ghalda",
			gender: "FEMALE" as const,
			subjects: ["Calistung"],
			isActive: false,
		},
	];

	const teachers: Record<string, { id: string; userId: string }> = {};
	for (const t of teacherSeeds) {
		const avatarUrl = `https://i.pravatar.cc/150?u=${t.email}`;
		const user = await prisma.user.upsert({
			where: { email: t.email },
			update: { avatarUrl },
			create: {
				email: t.email,
				password,
				name: t.name,
				role: "TEACHER",
				gender: t.gender,
				isActive: t.isActive,
				avatarUrl,
			},
		});
		const teacher = await prisma.teacher.upsert({
			where: { userId: user.id },
			update: {},
			create: { userId: user.id },
		});
		teachers[t.name] = teacher;

		for (const subjectName of t.subjects) {
			await prisma.teacherSubject.upsert({
				where: {
					teacherId_subjectId: {
						teacherId: teacher.id,
						subjectId: subjects[subjectName].id,
					},
				},
				update: {},
				create: {
					teacherId: teacher.id,
					subjectId: subjects[subjectName].id,
				},
			});
		}
	}

	const studentSeeds = [
		{
			email: "maryam@ihsanify.com",
			name: "Maryam",
			gender: "FEMALE" as const,
			isActive: true,
		},
		{
			email: "ibrahim@ihsanify.com",
			name: "Ibrahim",
			gender: "MALE" as const,
			isActive: true,
		},
		{
			email: "ahmad@ihsanify.com",
			name: "Ahmad",
			gender: "MALE" as const,
			isActive: true,
		},
		{
			email: "dawud@ihsanify.com",
			name: "Dawud",
			gender: "MALE" as const,
			isActive: true,
		},
		{
			email: "ilyas@ihsanify.com",
			name: "Ilyas",
			gender: "MALE" as const,
			isActive: false,
		},
	];

	const students: Record<string, { id: string; userId: string }> = {};
	for (const s of studentSeeds) {
		const user = await prisma.user.upsert({
			where: { email: s.email },
			update: {},
			create: {
				email: s.email,
				password,
				name: s.name,
				role: "STUDENT",
				gender: s.gender,
				isActive: s.isActive,
			},
		});
		const student = await prisma.student.upsert({
			where: { userId: user.id },
			update: {},
			create: { userId: user.id },
		});
		students[s.name] = student;
	}

	const groupSeeds = [
		{
			name: "Tahsin Dasar - 01",
			subject: "Tahsin",
			teacher: "Ustadzah Lisna",
			students: ["Maryam", "Ibrahim"],
			isActive: true,
			startDate: new Date("2026-01-05"),
			endDate: null as Date | null,
			plannedSessions: [
				{ dayOfWeek: "MONDAY" as const, time: "16:00" },
				{ dayOfWeek: "WEDNESDAY" as const, time: "16:00" },
			],
		},
		{
			name: "Tahfizh Dasar - 01",
			subject: "Tahfizh",
			teacher: "Ustadzah Siska",
			students: ["Maryam", "Ibrahim"],
			isActive: true,
			startDate: new Date("2026-01-05"),
			endDate: null as Date | null,
			plannedSessions: [
				{ dayOfWeek: "TUESDAY" as const, time: "20:00" },
				{ dayOfWeek: "THURSDAY" as const, time: "21:00" },
			],
		},
		{
			name: "Bahasa Inggris Dasar - 01",
			subject: "Bahasa Inggris",
			teacher: "Mister Mulki",
			students: ["Ahmad"],
			isActive: true,
			startDate: new Date("2026-02-01"),
			endDate: null as Date | null,
			plannedSessions: [{ dayOfWeek: "WEDNESDAY" as const, time: "15:00" }],
		},
		{
			name: "Bahasa Arab Dasar - 01",
			subject: "Bahasa Arab",
			teacher: "Ustadzah Afifah",
			students: ["Dawud"],
			isActive: true,
			startDate: new Date("2026-02-01"),
			endDate: null as Date | null,
			plannedSessions: [{ dayOfWeek: "FRIDAY" as const, time: "16:00" }],
		},
		{
			name: "Calistung Dasar - 01",
			subject: "Calistung",
			teacher: "Ustadzah Lisna",
			students: ["Ilyas"],
			isActive: false,
			startDate: new Date("2026-01-05"),
			endDate: new Date("2026-06-30") as Date | null,
			plannedSessions: [{ dayOfWeek: "SATURDAY" as const, time: "10:00" }],
		},
	];

	for (const g of groupSeeds) {
		const existing = await prisma.group.findFirst({ where: { name: g.name } });
		const group = existing
			? await prisma.group.update({
					where: { id: existing.id },
					data: { startDate: g.startDate, endDate: g.endDate },
				})
			: await prisma.group.create({
					data: {
						name: g.name,
						subjectId: subjects[g.subject].id,
						isActive: g.isActive,
						startDate: g.startDate,
						endDate: g.endDate,
					},
				});

		const existingPlannedSessionCount = await prisma.plannedSession.count({
			where: { groupId: group.id },
		});
		if (existingPlannedSessionCount === 0) {
			for (const planned of g.plannedSessions) {
				await prisma.plannedSession.create({
					data: {
						groupId: group.id,
						dayOfWeek: planned.dayOfWeek,
						time: planned.time,
					},
				});
			}
		}

		const teacherAssigned = await prisma.groupTeacher.findFirst({
			where: { groupId: group.id, teacherId: teachers[g.teacher].id },
		});
		if (!teacherAssigned) {
			await prisma.groupTeacher.create({
				data: {
					groupId: group.id,
					teacherId: teachers[g.teacher].id,
					action: "ASSIGN",
				},
			});
		}

		for (const studentName of g.students) {
			const enrolled = await prisma.groupEnrollment.findFirst({
				where: { groupId: group.id, studentId: students[studentName].id },
			});
			if (!enrolled) {
				await prisma.groupEnrollment.create({
					data: {
						groupId: group.id,
						studentId: students[studentName].id,
						action: "JOIN",
					},
				});
			}
		}

		const existingSessionCount = await prisma.session.count({
			where: { groupId: group.id },
		});
		if (existingSessionCount === 0) {
			const now = new Date();
			const sampleSessions = [
				{ daysAgo: 21, durationMinutes: 60, status: "FINISHED" as const },
				{ daysAgo: 14, durationMinutes: 60, status: "FINISHED" as const },
				{ daysAgo: 7, durationMinutes: 45, status: "FINISHED" as const },
				{ daysAgo: 0, durationMinutes: 60, status: "DRAFT" as const },
			];
			for (const s of sampleSessions) {
				const date = new Date(now);
				date.setDate(date.getDate() - s.daysAgo);
				await prisma.session.create({
					data: {
						groupId: group.id,
						date,
						durationMinutes: s.durationMinutes,
						status: s.status,
					},
				});
			}
		}
	}

	console.log(
		`Seed complete. All seeded users share the password: ${SEED_PASSWORD}`,
	);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
