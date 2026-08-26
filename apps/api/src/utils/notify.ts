import { prisma } from "./prisma";

type NotificationType = "REPORT" | "ASSIGNMENT" | "GROUP_ASSIGNMENT";

export async function notifyUser(params: {
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	link?: string;
}) {
	await prisma.notification.create({
		data: {
			userId: params.userId,
			type: params.type,
			title: params.title,
			message: params.message,
			link: params.link ?? null,
		},
	});
}
