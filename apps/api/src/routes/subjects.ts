import { Hono } from "hono";
import type { Prisma } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../utils/auth";
import { isValidImageDataUrl } from "../utils/imageValidation";
import { prisma } from "../utils/prisma";
import { isPrismaErrorCode } from "../utils/prismaErrors";

export const subjectsRouter = new Hono();

function duplicateFieldMessage(error: Prisma.PrismaClientKnownRequestError) {
	const target = error.meta?.target;
	if (Array.isArray(target) && target.includes("subjectCode")) {
		return "A subject with this code already exists.";
	}
	return "A subject with this name already exists.";
}

subjectsRouter.post(
	"/subjects",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			name?: string;
			subjectCode?: string | null;
			reportThemeId?: string | null;
			description?: string | null;
			iconUrl?: string | null;
			videoUrl?: string | null;
		};
		if (!body.name) {
			return c.json({ success: false, message: "name is required." }, 400);
		}

		if (body.reportThemeId) {
			const theme = await prisma.reportTheme.findUnique({
				where: { id: body.reportThemeId },
			});
			if (!theme) {
				return c.json(
					{ success: false, message: "Report theme not found." },
					400,
				);
			}
		}

		if (body.iconUrl && !isValidImageDataUrl(body.iconUrl)) {
			return c.json(
				{
					success: false,
					message: "Icon must be a PNG, JPEG, WEBP, or GIF under 300KB.",
				},
				400,
			);
		}

		try {
			const subject = await prisma.subject.create({
				data: {
					name: body.name,
					subjectCode: body.subjectCode || null,
					reportThemeId: body.reportThemeId ?? null,
					description: body.description?.trim() || null,
					iconUrl: body.iconUrl || null,
					videoUrl: body.videoUrl?.trim() || null,
				},
				include: { reportTheme: true },
			});
			return c.json(
				{
					success: true,
					data: {
						subjectId: subject.id,
						subjectName: subject.name,
						subjectCode: subject.subjectCode,
						reportThemeId: subject.reportThemeId,
						reportThemeName: subject.reportTheme?.name ?? null,
						description: subject.description,
						iconUrl: subject.iconUrl,
						videoUrl: subject.videoUrl,
					},
				},
				201,
			);
		} catch (error) {
			if (isPrismaErrorCode(error, "P2002")) {
				return c.json(
					{ success: false, message: duplicateFieldMessage(error) },
					400,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);

subjectsRouter.patch(
	"/subjects/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const subjectId = c.req.param("id");
		const body = (await c.req.json()) as {
			subjectCode?: string | null;
			reportThemeId?: string | null;
			description?: string | null;
			iconUrl?: string | null;
			videoUrl?: string | null;
		};

		if (
			body.reportThemeId === undefined &&
			body.subjectCode === undefined &&
			body.description === undefined &&
			body.iconUrl === undefined &&
			body.videoUrl === undefined
		) {
			return c.json(
				{
					success: false,
					message:
						"reportThemeId, subjectCode, description, iconUrl, or videoUrl is required.",
				},
				400,
			);
		}

		if (body.reportThemeId) {
			const theme = await prisma.reportTheme.findUnique({
				where: { id: body.reportThemeId },
			});
			if (!theme) {
				return c.json(
					{ success: false, message: "Report theme not found." },
					400,
				);
			}
		}

		if (body.iconUrl && !isValidImageDataUrl(body.iconUrl)) {
			return c.json(
				{
					success: false,
					message: "Icon must be a PNG, JPEG, WEBP, or GIF under 300KB.",
				},
				400,
			);
		}

		try {
			const subject = await prisma.subject.update({
				where: { id: subjectId },
				data: {
					...(body.reportThemeId !== undefined && {
						reportThemeId: body.reportThemeId,
					}),
					...(body.subjectCode !== undefined && {
						subjectCode: body.subjectCode || null,
					}),
					...(body.description !== undefined && {
						description: body.description?.trim() || null,
					}),
					...(body.iconUrl !== undefined && {
						iconUrl: body.iconUrl || null,
					}),
					...(body.videoUrl !== undefined && {
						videoUrl: body.videoUrl?.trim() || null,
					}),
				},
				include: { reportTheme: true },
			});
			return c.json({
				success: true,
				data: {
					subjectId: subject.id,
					subjectName: subject.name,
					subjectCode: subject.subjectCode,
					reportThemeId: subject.reportThemeId,
					reportThemeName: subject.reportTheme?.name ?? null,
					description: subject.description,
					iconUrl: subject.iconUrl,
					videoUrl: subject.videoUrl,
				},
			});
		} catch (error) {
			if (isPrismaErrorCode(error, "P2025")) {
				return c.json({ success: false, message: "Subject not found." }, 404);
			}
			if (isPrismaErrorCode(error, "P2002")) {
				return c.json(
					{ success: false, message: duplicateFieldMessage(error) },
					400,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);

subjectsRouter.delete(
	"/subjects/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const subjectId = c.req.param("id");

		try {
			await prisma.subject.delete({ where: { id: subjectId } });
			return c.json({ success: true });
		} catch (error) {
			if (isPrismaErrorCode(error, "P2025")) {
				return c.json({ success: false, message: "Subject not found." }, 404);
			}
			if (isPrismaErrorCode(error, "P2003")) {
				return c.json(
					{
						success: false,
						message:
							"This subject is still used by one or more groups or teacher assignments — remove those first.",
					},
					400,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);
