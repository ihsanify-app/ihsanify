import { Hono } from "hono";
import { requireAuth } from "../utils/auth";
import { canManageGroup, canUserAccessGroup } from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const reportsRouter = new Hono();

function serializeReport(report: {
	id: string;
	groupId: string;
	title: string;
	description: string;
	status: "DRAFT" | "FINISHED";
}) {
	return {
		reportId: report.id,
		groupId: report.groupId,
		title: report.title,
		description: report.description,
		status: report.status.toLowerCase(),
	};
}

reportsRouter.get("/groups/:id/reports", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const groupId = c.req.param("id");

	const group = await prisma.group.findUnique({ where: { id: groupId } });
	if (!group) {
		return c.json({ success: false, message: "Group not found." }, 404);
	}
	if (!(await canUserAccessGroup(authUser, groupId))) {
		return c.json(
			{ success: false, message: "You don't have access to this group." },
			403,
		);
	}

	const reports = await prisma.report.findMany({
		where: { groupId },
		orderBy: { createdAt: "desc" },
	});
	return c.json({ success: true, data: reports.map(serializeReport) });
});

reportsRouter.post("/groups/:id/reports", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const groupId = c.req.param("id");

	const group = await prisma.group.findUnique({ where: { id: groupId } });
	if (!group) {
		return c.json({ success: false, message: "Group not found." }, 404);
	}
	if (!(await canManageGroup(authUser, groupId))) {
		return c.json(
			{
				success: false,
				message:
					"Only an admin or this group's current teacher can add a report.",
			},
			403,
		);
	}

	const body = (await c.req.json()) as {
		title?: string;
		description?: string;
		status?: "draft" | "finished";
	};
	if (!body.title || !body.description) {
		return c.json(
			{ success: false, message: "title and description are required." },
			400,
		);
	}

	const report = await prisma.report.create({
		data: {
			groupId,
			title: body.title,
			description: body.description,
			status: body.status === "finished" ? "FINISHED" : "DRAFT",
		},
	});
	return c.json({ success: true, data: serializeReport(report) }, 201);
});

reportsRouter.patch("/groups/:id/reports/:reportId", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const groupId = c.req.param("id");
	const reportId = c.req.param("reportId");

	const existing = await prisma.report.findUnique({ where: { id: reportId } });
	if (!existing || existing.groupId !== groupId) {
		return c.json({ success: false, message: "Report not found." }, 404);
	}
	if (!(await canManageGroup(authUser, groupId))) {
		return c.json(
			{
				success: false,
				message:
					"Only an admin or this group's current teacher can edit a report.",
			},
			403,
		);
	}

	const body = (await c.req.json()) as {
		title?: string;
		description?: string;
		status?: "draft" | "finished";
	};

	const report = await prisma.report.update({
		where: { id: reportId },
		data: {
			...(body.title !== undefined && { title: body.title }),
			...(body.description !== undefined && { description: body.description }),
			...(body.status !== undefined && {
				status: body.status === "finished" ? "FINISHED" : "DRAFT",
			}),
		},
	});
	return c.json({ success: true, data: serializeReport(report) });
});

reportsRouter.delete(
	"/groups/:id/reports/:reportId",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		const groupId = c.req.param("id");
		const reportId = c.req.param("reportId");

		const existing = await prisma.report.findUnique({
			where: { id: reportId },
		});
		if (!existing || existing.groupId !== groupId) {
			return c.json({ success: false, message: "Report not found." }, 404);
		}
		if (!(await canManageGroup(authUser, groupId))) {
			return c.json(
				{
					success: false,
					message:
						"Only an admin or this group's current teacher can delete a report.",
				},
				403,
			);
		}

		await prisma.report.delete({ where: { id: reportId } });
		return c.json({ success: true });
	},
);
