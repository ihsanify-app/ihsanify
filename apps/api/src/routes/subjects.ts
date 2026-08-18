import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const subjectsRouter = new Hono();

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
