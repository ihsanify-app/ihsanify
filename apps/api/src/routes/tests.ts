import { Hono } from "hono";
import { requireAuth } from "../utils/auth";
import { canManageGroup, canUserAccessGroup } from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const testsRouter = new Hono();

function serializeTest(test: {
	id: string;
	groupId: string;
	title: string;
	description: string;
	status: "DRAFT" | "FINISHED";
}) {
	return {
		testId: test.id,
		groupId: test.groupId,
		title: test.title,
		description: test.description,
		status: test.status.toLowerCase(),
	};
}

testsRouter.get("/groups/:id/tests", requireAuth, async (c) => {
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

	const tests = await prisma.test.findMany({
		where: { groupId },
		orderBy: { createdAt: "desc" },
	});
	return c.json({ success: true, data: tests.map(serializeTest) });
});

testsRouter.post("/groups/:id/tests", requireAuth, async (c) => {
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
					"Only an admin or this group's current teacher can add a test.",
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

	const test = await prisma.test.create({
		data: {
			groupId,
			title: body.title,
			description: body.description,
			status: body.status === "finished" ? "FINISHED" : "DRAFT",
		},
	});
	return c.json({ success: true, data: serializeTest(test) }, 201);
});

testsRouter.patch("/groups/:id/tests/:testId", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const groupId = c.req.param("id");
	const testId = c.req.param("testId");

	const existing = await prisma.test.findUnique({ where: { id: testId } });
	if (!existing || existing.groupId !== groupId) {
		return c.json({ success: false, message: "Test not found." }, 404);
	}
	if (!(await canManageGroup(authUser, groupId))) {
		return c.json(
			{
				success: false,
				message:
					"Only an admin or this group's current teacher can edit a test.",
			},
			403,
		);
	}

	const body = (await c.req.json()) as {
		title?: string;
		description?: string;
		status?: "draft" | "finished";
	};

	const test = await prisma.test.update({
		where: { id: testId },
		data: {
			...(body.title !== undefined && { title: body.title }),
			...(body.description !== undefined && { description: body.description }),
			...(body.status !== undefined && {
				status: body.status === "finished" ? "FINISHED" : "DRAFT",
			}),
		},
	});
	return c.json({ success: true, data: serializeTest(test) });
});

testsRouter.delete("/groups/:id/tests/:testId", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const groupId = c.req.param("id");
	const testId = c.req.param("testId");

	const existing = await prisma.test.findUnique({ where: { id: testId } });
	if (!existing || existing.groupId !== groupId) {
		return c.json({ success: false, message: "Test not found." }, 404);
	}
	if (!(await canManageGroup(authUser, groupId))) {
		return c.json(
			{
				success: false,
				message:
					"Only an admin or this group's current teacher can delete a test.",
			},
			403,
		);
	}

	await prisma.test.delete({ where: { id: testId } });
	return c.json({ success: true });
});
