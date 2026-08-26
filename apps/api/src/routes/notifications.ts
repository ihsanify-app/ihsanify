import { Hono } from "hono";
import { requireAuth } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const notificationsRouter = new Hono();

notificationsRouter.get("/notifications", requireAuth, async (c) => {
	const authUser = c.get("authUser");

	const notifications = await prisma.notification.findMany({
		where: { userId: authUser.id },
		orderBy: { createdAt: "desc" },
		take: 30,
	});

	const unreadCount = await prisma.notification.count({
		where: { userId: authUser.id, readAt: null },
	});

	return c.json({
		success: true,
		data: {
			unreadCount,
			notifications: notifications.map((n) => ({
				notificationId: n.id,
				type: n.type.toLowerCase(),
				title: n.title,
				message: n.message,
				link: n.link,
				read: n.readAt !== null,
				createdAt: n.createdAt.toISOString(),
			})),
		},
	});
});

notificationsRouter.post("/notifications/:id/read", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const notification = await prisma.notification.findUnique({
		where: { id: c.req.param("id") },
	});
	if (!notification || notification.userId !== authUser.id) {
		return c.json({ success: false, message: "Notification not found." }, 404);
	}
	if (!notification.readAt) {
		await prisma.notification.update({
			where: { id: notification.id },
			data: { readAt: new Date() },
		});
	}
	return c.json({ success: true });
});

notificationsRouter.post("/notifications/read-all", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	await prisma.notification.updateMany({
		where: { userId: authUser.id, readAt: null },
		data: { readAt: new Date() },
	});
	return c.json({ success: true });
});
