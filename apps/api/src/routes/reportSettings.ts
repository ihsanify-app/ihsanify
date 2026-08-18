import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const reportSettingsRouter = new Hono();

const MAX_COVER_IMAGE_BYTES = 800 * 1024;
const COVER_IMAGE_DATA_URL_PATTERN =
	/^data:image\/(png|jpe?g|webp|gif);base64,([a-zA-Z0-9+/]+=*)$/;

function isValidCoverImageDataUrl(value: string): boolean {
	const match = COVER_IMAGE_DATA_URL_PATTERN.exec(value);
	if (!match) return false;
	const base64 = match[2];
	const approxBytes = (base64.length * 3) / 4;
	return approxBytes <= MAX_COVER_IMAGE_BYTES;
}

function serializeReportSettings(settings: {
	id: string;
	title: string;
	organizationName: string;
	footerPhone: string | null;
	footerEmail: string | null;
	footerInstagram: string | null;
	font: string;
	headerPattern: string;
	coverImageUrl: string | null;
}) {
	return {
		reportSettingsId: settings.id,
		title: settings.title,
		organizationName: settings.organizationName,
		footerPhone: settings.footerPhone,
		footerEmail: settings.footerEmail,
		footerInstagram: settings.footerInstagram,
		font: settings.font.toLowerCase(),
		headerPattern: settings.headerPattern.toLowerCase(),
		coverImageUrl: settings.coverImageUrl,
	};
}

reportSettingsRouter.get(
	"/report-settings",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const settings = await prisma.reportSettings.findFirst();
		if (!settings) {
			return c.json({
				success: true,
				data: serializeReportSettings({
					id: "",
					title: "Laporan Belajar",
					organizationName: "Ihsanify",
					footerPhone: null,
					footerEmail: null,
					footerInstagram: null,
					font: "HELVETICA",
					headerPattern: "NONE",
					coverImageUrl: null,
				}),
			});
		}
		return c.json({ success: true, data: serializeReportSettings(settings) });
	},
);

reportSettingsRouter.patch(
	"/report-settings",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			title?: string;
			organizationName?: string;
			footerPhone?: string | null;
			footerEmail?: string | null;
			footerInstagram?: string | null;
			font?: "helvetica" | "poppins" | "pt_serif";
			headerPattern?: "none" | "lines" | "dots" | "blocks" | "swirl";
			coverImageUrl?: string | null;
		};

		if (body.coverImageUrl && !isValidCoverImageDataUrl(body.coverImageUrl)) {
			return c.json(
				{
					success: false,
					message: "Cover image must be a PNG, JPEG, WEBP, or GIF under 800KB.",
				},
				400,
			);
		}

		const data = {
			...(body.title !== undefined && { title: body.title }),
			...(body.organizationName !== undefined && {
				organizationName: body.organizationName,
			}),
			...(body.footerPhone !== undefined && { footerPhone: body.footerPhone }),
			...(body.footerEmail !== undefined && { footerEmail: body.footerEmail }),
			...(body.footerInstagram !== undefined && {
				footerInstagram: body.footerInstagram,
			}),
			...(body.font !== undefined && {
				font: body.font.toUpperCase() as "HELVETICA" | "POPPINS" | "PT_SERIF",
			}),
			...(body.headerPattern !== undefined && {
				headerPattern: body.headerPattern.toUpperCase() as
					| "NONE"
					| "LINES"
					| "DOTS"
					| "BLOCKS"
					| "SWIRL",
			}),
			...(body.coverImageUrl !== undefined && {
				coverImageUrl: body.coverImageUrl,
			}),
		};

		const existing = await prisma.reportSettings.findFirst();
		const settings = existing
			? await prisma.reportSettings.update({
					where: { id: existing.id },
					data,
				})
			: await prisma.reportSettings.create({ data });

		return c.json({ success: true, data: serializeReportSettings(settings) });
	},
);
