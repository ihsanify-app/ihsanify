import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const landingStatsRouter = new Hono();

function serializeLandingStats(stats: {
	id: string;
	historicalSessionHours: number;
}) {
	return {
		landingStatsId: stats.id,
		historicalSessionHours: stats.historicalSessionHours,
	};
}

landingStatsRouter.get(
	"/landing-stats",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const stats = await prisma.landingStats.findFirst();
		if (!stats) {
			return c.json({
				success: true,
				data: serializeLandingStats({ id: "", historicalSessionHours: 0 }),
			});
		}
		return c.json({ success: true, data: serializeLandingStats(stats) });
	},
);

landingStatsRouter.patch(
	"/landing-stats",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as { historicalSessionHours?: number };
		if (
			body.historicalSessionHours !== undefined &&
			(!Number.isInteger(body.historicalSessionHours) ||
				body.historicalSessionHours < 0)
		) {
			return c.json(
				{
					success: false,
					message: "historicalSessionHours must be a non-negative integer.",
				},
				400,
			);
		}

		const data = {
			...(body.historicalSessionHours !== undefined && {
				historicalSessionHours: body.historicalSessionHours,
			}),
		};

		const existing = await prisma.landingStats.findFirst();
		const stats = existing
			? await prisma.landingStats.update({
					where: { id: existing.id },
					data,
				})
			: await prisma.landingStats.create({ data });

		return c.json({ success: true, data: serializeLandingStats(stats) });
	},
);
