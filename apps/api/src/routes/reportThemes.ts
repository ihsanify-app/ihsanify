import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const reportThemesRouter = new Hono();

reportThemesRouter.get(
	"/report-themes",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const themes = await prisma.reportTheme.findMany({
			orderBy: { name: "asc" },
		});
		return c.json({
			success: true,
			data: themes.map((t) => ({
				reportThemeId: t.id,
				name: t.name,
				primaryColor: t.primaryColor,
			})),
		});
	},
);
