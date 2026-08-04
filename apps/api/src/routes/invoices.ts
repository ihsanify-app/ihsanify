import { Hono } from "hono";
import { requireAuth } from "../utils/auth";
import { canManageGroup, canUserAccessGroup } from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const invoicesRouter = new Hono();

function serializeInvoice(invoice: {
	id: string;
	groupId: string;
	title: string;
	description: string;
	status: "DRAFT" | "FINISHED";
}) {
	return {
		invoiceId: invoice.id,
		groupId: invoice.groupId,
		title: invoice.title,
		description: invoice.description,
		status: invoice.status.toLowerCase(),
	};
}

invoicesRouter.get("/groups/:id/invoices", requireAuth, async (c) => {
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

	const invoices = await prisma.invoice.findMany({
		where: { groupId },
		orderBy: { createdAt: "desc" },
	});
	return c.json({ success: true, data: invoices.map(serializeInvoice) });
});

invoicesRouter.post("/groups/:id/invoices", requireAuth, async (c) => {
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
					"Only an admin or this group's current teacher can add an invoice.",
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

	const invoice = await prisma.invoice.create({
		data: {
			groupId,
			title: body.title,
			description: body.description,
			status: body.status === "finished" ? "FINISHED" : "DRAFT",
		},
	});
	return c.json({ success: true, data: serializeInvoice(invoice) }, 201);
});

invoicesRouter.patch(
	"/groups/:id/invoices/:invoiceId",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		const groupId = c.req.param("id");
		const invoiceId = c.req.param("invoiceId");

		const existing = await prisma.invoice.findUnique({
			where: { id: invoiceId },
		});
		if (!existing || existing.groupId !== groupId) {
			return c.json({ success: false, message: "Invoice not found." }, 404);
		}
		if (!(await canManageGroup(authUser, groupId))) {
			return c.json(
				{
					success: false,
					message:
						"Only an admin or this group's current teacher can edit an invoice.",
				},
				403,
			);
		}

		const body = (await c.req.json()) as {
			title?: string;
			description?: string;
			status?: "draft" | "finished";
		};

		const invoice = await prisma.invoice.update({
			where: { id: invoiceId },
			data: {
				...(body.title !== undefined && { title: body.title }),
				...(body.description !== undefined && {
					description: body.description,
				}),
				...(body.status !== undefined && {
					status: body.status === "finished" ? "FINISHED" : "DRAFT",
				}),
			},
		});
		return c.json({ success: true, data: serializeInvoice(invoice) });
	},
);

invoicesRouter.delete(
	"/groups/:id/invoices/:invoiceId",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		const groupId = c.req.param("id");
		const invoiceId = c.req.param("invoiceId");

		const existing = await prisma.invoice.findUnique({
			where: { id: invoiceId },
		});
		if (!existing || existing.groupId !== groupId) {
			return c.json({ success: false, message: "Invoice not found." }, 404);
		}
		if (!(await canManageGroup(authUser, groupId))) {
			return c.json(
				{
					success: false,
					message:
						"Only an admin or this group's current teacher can delete an invoice.",
				},
				403,
			);
		}

		await prisma.invoice.delete({ where: { id: invoiceId } });
		return c.json({ success: true });
	},
);
