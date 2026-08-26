import { Hono } from "hono";
import { requireAuth } from "../utils/auth";
import {
	canManageGroup,
	canUserAccessGroup,
	getCurrentStudentIds,
} from "../utils/groupState";
import { notifyUser } from "../utils/notify";
import { prisma } from "../utils/prisma";

export const assignmentsRouter = new Hono();

function serializeAssignment(assignment: {
	id: string;
	groupId: string;
	title: string;
	description: string;
	status: "DRAFT" | "FINISHED";
}) {
	return {
		assignmentId: assignment.id,
		groupId: assignment.groupId,
		title: assignment.title,
		description: assignment.description,
		status: assignment.status.toLowerCase(),
	};
}

assignmentsRouter.get("/groups/:id/assignments", requireAuth, async (c) => {
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

	const assignments = await prisma.assignment.findMany({
		where: { groupId },
		orderBy: { createdAt: "desc" },
	});
	return c.json({ success: true, data: assignments.map(serializeAssignment) });
});

assignmentsRouter.post("/groups/:id/assignments", requireAuth, async (c) => {
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
					"Only an admin or this group's current teacher can add an assignment.",
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

	const assignment = await prisma.assignment.create({
		data: {
			groupId,
			title: body.title,
			description: body.description,
			status: body.status === "finished" ? "FINISHED" : "DRAFT",
		},
	});

	const studentIds = await getCurrentStudentIds(groupId);
	const students = await prisma.student.findMany({
		where: { id: { in: studentIds } },
	});
	await Promise.all(
		students.map((student) =>
			notifyUser({
				userId: student.userId,
				type: "ASSIGNMENT",
				title: "New assignment posted",
				message: `"${assignment.title}" was added to ${group.name}.`,
				link: `/groups/${groupId}/assignments`,
			}),
		),
	);

	return c.json({ success: true, data: serializeAssignment(assignment) }, 201);
});

assignmentsRouter.patch(
	"/groups/:id/assignments/:assignmentId",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		const groupId = c.req.param("id");
		const assignmentId = c.req.param("assignmentId");

		const existing = await prisma.assignment.findUnique({
			where: { id: assignmentId },
		});
		if (!existing || existing.groupId !== groupId) {
			return c.json({ success: false, message: "Assignment not found." }, 404);
		}
		if (!(await canManageGroup(authUser, groupId))) {
			return c.json(
				{
					success: false,
					message:
						"Only an admin or this group's current teacher can edit an assignment.",
				},
				403,
			);
		}

		const body = (await c.req.json()) as {
			title?: string;
			description?: string;
			status?: "draft" | "finished";
		};

		const assignment = await prisma.assignment.update({
			where: { id: assignmentId },
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
		return c.json({ success: true, data: serializeAssignment(assignment) });
	},
);

assignmentsRouter.delete(
	"/groups/:id/assignments/:assignmentId",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		const groupId = c.req.param("id");
		const assignmentId = c.req.param("assignmentId");

		const existing = await prisma.assignment.findUnique({
			where: { id: assignmentId },
		});
		if (!existing || existing.groupId !== groupId) {
			return c.json({ success: false, message: "Assignment not found." }, 404);
		}
		if (!(await canManageGroup(authUser, groupId))) {
			return c.json(
				{
					success: false,
					message:
						"Only an admin or this group's current teacher can delete an assignment.",
				},
				403,
			);
		}

		await prisma.assignment.delete({ where: { id: assignmentId } });
		return c.json({ success: true });
	},
);
