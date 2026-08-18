import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const subjectsRouter = new Hono();

subjectsRouter.post(
	"/subjects",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			name?: string;
			reportThemeId?: string | null;
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

		try {
			const subject = await prisma.subject.create({
				data: { name: body.name, reportThemeId: body.reportThemeId ?? null },
				include: { reportTheme: true },
			});
			return c.json(
				{
					success: true,
					data: {
						subjectId: subject.id,
						subjectName: subject.name,
						reportThemeId: subject.reportThemeId,
						reportThemeName: subject.reportTheme?.name ?? null,
					},
				},
				201,
			);
		} catch (error: any) {
			if (error.code === "P2002") {
				return c.json(
					{
						success: false,
						message: "A subject with this name already exists.",
					},
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
		const body = (await c.req.json()) as { reportThemeId?: string | null };

		if (body.reportThemeId === undefined) {
			return c.json(
				{ success: false, message: "reportThemeId is required." },
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

		try {
			const subject = await prisma.subject.update({
				where: { id: subjectId },
				data: { reportThemeId: body.reportThemeId },
				include: { reportTheme: true },
			});
			return c.json({
				success: true,
				data: {
					subjectId: subject.id,
					subjectName: subject.name,
					reportThemeId: subject.reportThemeId,
					reportThemeName: subject.reportTheme?.name ?? null,
				},
			});
		} catch (error: any) {
			if (error.code === "P2025") {
				return c.json({ success: false, message: "Subject not found." }, 404);
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
		} catch (error: any) {
			if (error.code === "P2025") {
				return c.json({ success: false, message: "Subject not found." }, 404);
			}
			if (error.code === "P2003") {
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
