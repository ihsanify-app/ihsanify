import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const invoiceSettingsRouter = new Hono();

function serializeInvoiceSettings(settings: {
	id: string;
	bankName: string | null;
	bankAccount: string | null;
	receiverName: string | null;
}) {
	return {
		invoiceSettingsId: settings.id,
		bankName: settings.bankName,
		bankAccount: settings.bankAccount,
		receiverName: settings.receiverName,
	};
}

invoiceSettingsRouter.get(
	"/invoice-settings",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const settings = await prisma.invoiceSettings.findFirst();
		if (!settings) {
			return c.json({
				success: true,
				data: serializeInvoiceSettings({
					id: "",
					bankName: null,
					bankAccount: null,
					receiverName: null,
				}),
			});
		}
		return c.json({ success: true, data: serializeInvoiceSettings(settings) });
	},
);

invoiceSettingsRouter.patch(
	"/invoice-settings",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			bankName?: string | null;
			bankAccount?: string | null;
			receiverName?: string | null;
		};

		const data = {
			...(body.bankName !== undefined && { bankName: body.bankName }),
			...(body.bankAccount !== undefined && { bankAccount: body.bankAccount }),
			...(body.receiverName !== undefined && {
				receiverName: body.receiverName,
			}),
		};

		const existing = await prisma.invoiceSettings.findFirst();
		const settings = existing
			? await prisma.invoiceSettings.update({
					where: { id: existing.id },
					data,
				})
			: await prisma.invoiceSettings.create({ data });

		return c.json({ success: true, data: serializeInvoiceSettings(settings) });
	},
);
