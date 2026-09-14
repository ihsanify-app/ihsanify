import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { isValidImageDataUrl } from "../utils/imageValidation";
import { prisma } from "../utils/prisma";
import { isPrismaErrorCode } from "../utils/prismaErrors";

export const almaMatersRouter = new Hono();

function serializeAlmaMater(a: { id: string; name: string; logoUrl: string }) {
	return {
		almaMaterId: a.id,
		name: a.name,
		logoUrl: a.logoUrl,
	};
}

almaMatersRouter.post(
	"/alma-maters",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			name?: string;
			logoUrl?: string;
		};
		if (!body.name?.trim() || !body.logoUrl) {
			return c.json(
				{ success: false, message: "name and logoUrl are required." },
				400,
			);
		}
		if (!isValidImageDataUrl(body.logoUrl)) {
			return c.json(
				{
					success: false,
					message: "Logo must be a PNG, JPEG, WEBP, or GIF under 300KB.",
				},
				400,
			);
		}

		const almaMater = await prisma.almaMater.create({
			data: { name: body.name.trim(), logoUrl: body.logoUrl },
		});
		return c.json({ success: true, data: serializeAlmaMater(almaMater) }, 201);
	},
);

almaMatersRouter.patch(
	"/alma-maters/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			name?: string;
			logoUrl?: string;
		};
		if (body.logoUrl !== undefined && !isValidImageDataUrl(body.logoUrl)) {
			return c.json(
				{
					success: false,
					message: "Logo must be a PNG, JPEG, WEBP, or GIF under 300KB.",
				},
				400,
			);
		}

		try {
			const almaMater = await prisma.almaMater.update({
				where: { id: c.req.param("id") },
				data: {
					...(body.name !== undefined && { name: body.name.trim() }),
					...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
				},
			});
			return c.json({ success: true, data: serializeAlmaMater(almaMater) });
		} catch (error) {
			if (isPrismaErrorCode(error, "P2025")) {
				return c.json(
					{ success: false, message: "Alma mater not found." },
					404,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);

almaMatersRouter.delete(
	"/alma-maters/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		try {
			await prisma.almaMater.delete({ where: { id: c.req.param("id") } });
			return c.json({ success: true });
		} catch (error) {
			if (isPrismaErrorCode(error, "P2025")) {
				return c.json(
					{ success: false, message: "Alma mater not found." },
					404,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);
