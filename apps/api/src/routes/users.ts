import { randomInt } from "node:crypto";
import { hash } from "bcryptjs";
import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import {
	getCurrentGroupIdsForStudent,
	getCurrentGroupIdsForTeacher,
} from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const usersRouter = new Hono();

const MAX_AVATAR_BYTES = 300 * 1024;
// Excludes visually-ambiguous characters (0/O, 1/l/I) since this is read off
// a screen and typed/copied by hand during an admin-to-user handoff.
const TEMP_PASSWORD_CHARSET =
	"ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generateTemporaryPassword(length = 10): string {
	let result = "";
	for (let i = 0; i < length; i++) {
		result += TEMP_PASSWORD_CHARSET[randomInt(TEMP_PASSWORD_CHARSET.length)];
	}
	return result;
}
const AVATAR_DATA_URL_PATTERN =
	/^data:image\/(png|jpe?g|webp|gif);base64,([a-zA-Z0-9+/]+=*)$/;

function isValidAvatarDataUrl(value: string): boolean {
	const match = AVATAR_DATA_URL_PATTERN.exec(value);
	if (!match) return false;
	const base64 = match[2];
	const approxBytes = (base64.length * 3) / 4;
	return approxBytes <= MAX_AVATAR_BYTES;
}

async function serializeUser(user: {
	id: string;
	name: string;
	email: string;
	role: "ADMIN" | "TEACHER" | "STUDENT";
	gender: "MALE" | "FEMALE" | null;
	isActive: boolean;
	avatarUrl: string | null;
}) {
	let teacherId: string | null = null;
	let studentId: string | null = null;
	let studentNumber: number | null = null;
	let subjectIds: { subjectId: string; subjectName: string }[] = [];
	let groupIds: { groupId: string; groupName: string }[] = [];

	if (user.role === "TEACHER") {
		const teacher = await prisma.teacher.findUnique({
			where: { userId: user.id },
			include: { subjects: { include: { subject: true } } },
		});
		teacherId = teacher?.id ?? null;
		subjectIds =
			teacher?.subjects.map((ts) => ({
				subjectId: ts.subject.id,
				subjectName: ts.subject.name,
			})) ?? [];
		if (teacher) {
			const teachingGroupIds = await getCurrentGroupIdsForTeacher(teacher.id);
			const groups = await prisma.group.findMany({
				where: { id: { in: teachingGroupIds } },
			});
			groupIds = groups.map((g) => ({ groupId: g.id, groupName: g.name }));
		}
	}

	if (user.role === "STUDENT") {
		const student = await prisma.student.findUnique({
			where: { userId: user.id },
		});
		studentId = student?.id ?? null;
		studentNumber = student?.studentNumber ?? null;
		if (student) {
			const enrolledGroupIds = await getCurrentGroupIdsForStudent(student.id);
			const groups = await prisma.group.findMany({
				where: { id: { in: enrolledGroupIds } },
				include: { subject: true },
			});
			groupIds = groups.map((g) => ({ groupId: g.id, groupName: g.name }));
			const seen = new Set<string>();
			for (const g of groups) {
				if (!seen.has(g.subject.id)) {
					seen.add(g.subject.id);
					subjectIds.push({
						subjectId: g.subject.id,
						subjectName: g.subject.name,
					});
				}
			}
		}
	}

	return {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role.toLowerCase(),
		gender: user.gender?.toLowerCase() ?? null,
		teacherId,
		studentId,
		studentNumber,
		subjectIds,
		groupIds,
		isActive: user.isActive,
		avatarUrl: user.avatarUrl,
	};
}

usersRouter.get("/users", requireAuth, requireRole("ADMIN"), async (c) => {
	const users = await prisma.user.findMany({
		where: { role: { not: "ADMIN" } },
		orderBy: { name: "asc" },
	});
	const data = await Promise.all(users.map(serializeUser));
	return c.json({ success: true, data });
});

usersRouter.post("/users", requireAuth, requireRole("ADMIN"), async (c) => {
	const body = (await c.req.json()) as {
		name?: string;
		email?: string;
		password?: string;
		role?: "teacher" | "student";
		gender?: "male" | "female";
		avatarUrl?: string | null;
	};

	if (
		!body.name ||
		!body.email ||
		!body.password ||
		!body.role ||
		!body.gender
	) {
		return c.json(
			{
				success: false,
				message: "name, email, password, role, and gender are required.",
			},
			400,
		);
	}

	if (body.avatarUrl && !isValidAvatarDataUrl(body.avatarUrl)) {
		return c.json(
			{
				success: false,
				message: "Avatar must be a PNG, JPEG, WEBP, or GIF under 300KB.",
			},
			400,
		);
	}

	try {
		const hashedPassword = await hash(body.password, 10);
		const user = await prisma.user.create({
			data: {
				name: body.name,
				email: body.email.toLowerCase(),
				password: hashedPassword,
				role: body.role.toUpperCase() as "TEACHER" | "STUDENT",
				gender: body.gender.toUpperCase() as "MALE" | "FEMALE",
				avatarUrl: body.avatarUrl ?? null,
			},
		});

		if (body.role === "teacher") {
			await prisma.teacher.create({ data: { userId: user.id } });
		} else {
			await prisma.student.create({ data: { userId: user.id } });
		}

		return c.json({ success: true, data: await serializeUser(user) }, 201);
	} catch (error: any) {
		if (error.code === "P2002") {
			return c.json(
				{ success: false, message: "This email already exists." },
				400,
			);
		}
		return c.json({ success: false, message: "Internal server error." }, 500);
	}
});

usersRouter.patch(
	"/users/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const userId = c.req.param("id");
		const body = (await c.req.json()) as {
			name?: string;
			email?: string;
			gender?: "male" | "female";
			isActive?: boolean;
			avatarUrl?: string | null;
			studentNumber?: number | null;
		};

		if (body.avatarUrl && !isValidAvatarDataUrl(body.avatarUrl)) {
			return c.json(
				{
					success: false,
					message: "Avatar must be a PNG, JPEG, WEBP, or GIF under 300KB.",
				},
				400,
			);
		}

		if (
			body.studentNumber != null &&
			(body.studentNumber < 0 || body.studentNumber > 999)
		) {
			return c.json(
				{
					success: false,
					message: "studentNumber must be a 3-digit number between 0 and 999.",
				},
				400,
			);
		}

		try {
			const existing = await prisma.user.findUnique({ where: { id: userId } });
			if (!existing) {
				return c.json({ success: false, message: "User not found." }, 404);
			}
			if (body.studentNumber !== undefined && existing.role !== "STUDENT") {
				return c.json(
					{
						success: false,
						message: "studentNumber only applies to students.",
					},
					400,
				);
			}

			const user = await prisma.user.update({
				where: { id: userId },
				data: {
					...(body.name !== undefined && { name: body.name }),
					...(body.email !== undefined && { email: body.email.toLowerCase() }),
					...(body.gender !== undefined && {
						gender: body.gender.toUpperCase() as "MALE" | "FEMALE",
					}),
					...(body.isActive !== undefined && { isActive: body.isActive }),
					...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
				},
			});

			// Two students can't hold the same number at once (unique constraint),
			// so re-numbering one to a value another already has would otherwise
			// fail outright. Detect that case and swap the two numbers instead —
			// via a temporary null step, since neither target update can run
			// first without momentarily colliding with the other's current value.
			let swappedUser: Awaited<ReturnType<typeof serializeUser>> | null = null;
			if (body.studentNumber !== undefined) {
				const currentStudent = await prisma.student.findUnique({
					where: { userId },
				});
				if (!currentStudent) {
					return c.json(
						{ success: false, message: "Student record not found." },
						404,
					);
				}

				const conflicting =
					body.studentNumber === null
						? null
						: await prisma.student.findFirst({
								where: {
									studentNumber: body.studentNumber,
									userId: { not: userId },
								},
							});

				if (conflicting) {
					await prisma.$transaction([
						prisma.student.update({
							where: { id: conflicting.id },
							data: { studentNumber: null },
						}),
						prisma.student.update({
							where: { userId },
							data: { studentNumber: body.studentNumber },
						}),
						prisma.student.update({
							where: { id: conflicting.id },
							data: { studentNumber: currentStudent.studentNumber },
						}),
					]);
					const conflictingUser = await prisma.user.findUnique({
						where: { id: conflicting.userId },
					});
					swappedUser = conflictingUser
						? await serializeUser(conflictingUser)
						: null;
				} else {
					await prisma.student.update({
						where: { userId },
						data: { studentNumber: body.studentNumber },
					});
				}
			}

			return c.json({
				success: true,
				data: await serializeUser(user),
				swappedUser,
			});
		} catch (error: any) {
			if (error.code === "P2025") {
				return c.json({ success: false, message: "User not found." }, 404);
			}
			if (error.code === "P2002") {
				return c.json(
					{
						success: false,
						message: "This student number is already assigned to someone else.",
					},
					400,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);

// Admin-initiated reset for a user who forgot their password — generates a
// fresh one server-side rather than letting the admin pick it, so a weak or
// guessable password never enters the system. The plaintext is returned
// exactly once here for the admin to relay out-of-band (e.g. WhatsApp); it is
// never stored, logged, or retrievable again after this response.
usersRouter.post(
	"/users/:id/reset-password",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const userId = c.req.param("id");
		const existing = await prisma.user.findUnique({ where: { id: userId } });
		if (!existing) {
			return c.json({ success: false, message: "User not found." }, 404);
		}

		const temporaryPassword = generateTemporaryPassword();
		await prisma.user.update({
			where: { id: userId },
			data: { password: await hash(temporaryPassword, 10) },
		});

		return c.json({ success: true, data: { temporaryPassword } });
	},
);
