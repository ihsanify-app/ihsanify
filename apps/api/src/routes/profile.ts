import { Hono } from "hono";
import { requireAuth } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const profileRouter = new Hono();

const MAX_AVATAR_BYTES = 300 * 1024;
const AVATAR_DATA_URL_PATTERN =
	/^data:image\/(png|jpe?g|webp|gif);base64,([a-zA-Z0-9+/]+=*)$/;
const MAX_BIO_WORDS = 300;

const SCHOOLS = [
	"medina_international_school",
	"al_wildan_international_islamic_school",
] as const;
const TITLES = ["s_pd", "s_t", "lc"] as const;

function isValidAvatarDataUrl(value: string): boolean {
	const match = AVATAR_DATA_URL_PATTERN.exec(value);
	if (!match) return false;
	const base64 = match[2];
	const approxBytes = (base64.length * 3) / 4;
	return approxBytes <= MAX_AVATAR_BYTES;
}

function countWords(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

async function serializeProfile(userId: string) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) return null;

	let school: string | null = null;
	let title: string | null = null;
	let teachingHistory: {
		id: string;
		startYear: number;
		endYear: number;
		organization: string;
	}[] = [];

	if (user.role === "STUDENT") {
		const student = await prisma.student.findUnique({ where: { userId } });
		school = student?.school?.toLowerCase() ?? null;
	}

	if (user.role === "TEACHER") {
		const teacher = await prisma.teacher.findUnique({
			where: { userId },
			include: { teachingHistory: { orderBy: { startYear: "desc" } } },
		});
		title = teacher?.title?.toLowerCase() ?? null;
		teachingHistory =
			teacher?.teachingHistory.map((h) => ({
				id: h.id,
				startYear: h.startYear,
				endYear: h.endYear,
				organization: h.organization,
			})) ?? [];
	}

	return {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role.toLowerCase(),
		gender: user.gender?.toLowerCase() ?? null,
		avatarUrl: user.avatarUrl,
		bio: user.bio,
		address: user.address,
		phone: user.phone,
		school,
		title,
		teachingHistory,
	};
}

profileRouter.get("/profile", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const data = await serializeProfile(authUser.id);
	if (!data) {
		return c.json({ success: false, message: "User not found." }, 404);
	}
	return c.json({ success: true, data });
});

profileRouter.patch("/profile", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const body = (await c.req.json()) as {
		avatarUrl?: string | null;
		bio?: string | null;
		address?: string | null;
		gender?: "male" | "female" | null;
		phone?: string | null;
		school?: string | null;
		title?: string | null;
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

	if (body.bio && countWords(body.bio) > MAX_BIO_WORDS) {
		return c.json(
			{
				success: false,
				message: `Status must be ${MAX_BIO_WORDS} words or fewer.`,
			},
			400,
		);
	}

	if (
		body.school !== undefined &&
		body.school !== null &&
		!SCHOOLS.includes(body.school as (typeof SCHOOLS)[number])
	) {
		return c.json(
			{ success: false, message: "Invalid school selection." },
			400,
		);
	}

	if (
		body.title !== undefined &&
		body.title !== null &&
		!TITLES.includes(body.title as (typeof TITLES)[number])
	) {
		return c.json({ success: false, message: "Invalid title selection." }, 400);
	}

	if (body.school !== undefined && authUser.role !== "STUDENT") {
		return c.json(
			{ success: false, message: "Only students can set a school." },
			400,
		);
	}

	if (body.title !== undefined && authUser.role !== "TEACHER") {
		return c.json(
			{ success: false, message: "Only teachers can set a title." },
			400,
		);
	}

	await prisma.user.update({
		where: { id: authUser.id },
		data: {
			...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
			...(body.bio !== undefined && { bio: body.bio }),
			...(body.address !== undefined && { address: body.address }),
			...(body.gender !== undefined && {
				gender: body.gender
					? (body.gender.toUpperCase() as "MALE" | "FEMALE")
					: null,
			}),
			...(body.phone !== undefined && { phone: body.phone }),
		},
	});

	if (body.school !== undefined) {
		await prisma.student.update({
			where: { userId: authUser.id },
			data: {
				school: body.school
					? (body.school.toUpperCase() as
							| "MEDINA_INTERNATIONAL_SCHOOL"
							| "AL_WILDAN_INTERNATIONAL_ISLAMIC_SCHOOL")
					: null,
			},
		});
	}

	if (body.title !== undefined) {
		await prisma.teacher.update({
			where: { userId: authUser.id },
			data: {
				title: body.title
					? (body.title.toUpperCase() as "S_PD" | "S_T" | "LC")
					: null,
			},
		});
	}

	const data = await serializeProfile(authUser.id);
	return c.json({ success: true, data });
});

profileRouter.post("/profile/teaching-history", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	if (authUser.role !== "TEACHER") {
		return c.json(
			{ success: false, message: "Only teachers can add teaching history." },
			403,
		);
	}

	const body = (await c.req.json()) as {
		startYear?: number;
		endYear?: number;
		organization?: string;
	};

	if (
		!Number.isInteger(body.startYear) ||
		!Number.isInteger(body.endYear) ||
		!body.organization?.trim()
	) {
		return c.json(
			{
				success: false,
				message: "startYear, endYear, and organization are required.",
			},
			400,
		);
	}

	if ((body.endYear as number) < (body.startYear as number)) {
		return c.json(
			{ success: false, message: "endYear cannot be before startYear." },
			400,
		);
	}

	const teacher = await prisma.teacher.findUnique({
		where: { userId: authUser.id },
	});
	if (!teacher) {
		return c.json({ success: false, message: "Teacher not found." }, 404);
	}

	const entry = await prisma.teachingHistory.create({
		data: {
			teacherId: teacher.id,
			startYear: body.startYear as number,
			endYear: body.endYear as number,
			organization: body.organization.trim(),
		},
	});

	return c.json({ success: true, data: entry }, 201);
});

profileRouter.delete(
	"/profile/teaching-history/:id",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		if (authUser.role !== "TEACHER") {
			return c.json(
				{ success: false, message: "Only teachers can edit teaching history." },
				403,
			);
		}

		const teacher = await prisma.teacher.findUnique({
			where: { userId: authUser.id },
		});
		if (!teacher) {
			return c.json({ success: false, message: "Teacher not found." }, 404);
		}

		const entry = await prisma.teachingHistory.findUnique({
			where: { id: c.req.param("id") },
		});
		if (!entry || entry.teacherId !== teacher.id) {
			return c.json(
				{ success: false, message: "Teaching history entry not found." },
				404,
			);
		}

		await prisma.teachingHistory.delete({ where: { id: entry.id } });
		return c.json({ success: true });
	},
);
