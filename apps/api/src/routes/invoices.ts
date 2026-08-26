import { Hono } from "hono";
import { renderInvoicePdf } from "../pdf/InvoiceDocument";
import { DEFAULT_THEME_COLOR } from "../pdf/shared";
import { requireAuth, requireRole } from "../utils/auth";
import {
	getCurrentGroupIdsForStudent,
	getCurrentTeacherId,
} from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const invoicesRouter = new Hono();

type InvoiceLineRecord = {
	id: string;
	groupId: string;
	teacherId: string;
	invoiceNo: string;
	price: number;
	sessions: { id: string; date: Date; durationMinutes: number }[];
};

function groupTypeLabel(
	groupType: "GROUP" | "PRIVATE" | "SEMI_PRIVATE" | undefined,
) {
	if (groupType === "PRIVATE") return "Privat";
	if (groupType === "SEMI_PRIVATE") return "Semi Privat";
	return "Kelompok";
}

// e.g. buildInvoiceNo("AR", 2026, 8, 1) -> "AR-2026-08-001". Computed once
// at InvoiceLine creation time and stored — see that model's doc comment.
function buildInvoiceNo(
	subjectCode: string,
	year: number,
	month: number,
	studentNumber: number,
) {
	return `${subjectCode}-${year}-${String(month).padStart(2, "0")}-${String(
		studentNumber,
	).padStart(3, "0")}`;
}

type InvoiceRecord = {
	id: string;
	studentId: string;
	month: number;
	year: number;
	sent: boolean;
	createdAt: Date;
	lines: InvoiceLineRecord[];
};

async function serializeInvoice(invoice: InvoiceRecord) {
	const student = await prisma.student.findUnique({
		where: { id: invoice.studentId },
		include: { user: true },
	});

	const lines = await Promise.all(
		invoice.lines.map(async (line) => {
			const [group, teacher] = await Promise.all([
				prisma.group.findUnique({
					where: { id: line.groupId },
					include: { subject: true },
				}),
				prisma.teacher.findUnique({
					where: { id: line.teacherId },
					include: { user: true },
				}),
			]);

			return {
				invoiceLineId: line.id,
				groupId: line.groupId,
				groupName: group?.name ?? null,
				subjectName: group?.subject.name ?? null,
				groupTypeLabel: groupTypeLabel(group?.groupType),
				teacherId: line.teacherId,
				teacherName: teacher?.user.name ?? null,
				invoiceNo: line.invoiceNo,
				price: line.price,
				sessions: line.sessions
					.map((s) => ({
						sessionId: s.id,
						date: s.date.toISOString(),
						durationMinutes: s.durationMinutes,
					}))
					.sort((a, b) => a.date.localeCompare(b.date)),
			};
		}),
	);

	return {
		invoiceId: invoice.id,
		studentId: invoice.studentId,
		studentName: student?.user.name ?? null,
		month: invoice.month,
		year: invoice.year,
		sent: invoice.sent,
		lines,
		totalPrice: lines.reduce((sum, line) => sum + line.price, 0),
		createdAt: invoice.createdAt.toISOString(),
	};
}

const INVOICE_INCLUDE = { lines: { include: { sessions: true } } } as const;

invoicesRouter.get(
	"/invoices",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const invoices: InvoiceRecord[] = await prisma.invoice.findMany({
			include: INVOICE_INCLUDE,
			orderBy: { createdAt: "desc" },
		});

		const data = await Promise.all(invoices.map(serializeInvoice));
		return c.json({ success: true, data });
	},
);

invoicesRouter.post(
	"/invoices",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			studentId?: string;
			month?: number;
			year?: number;
			lines?: { groupId: string; price: number }[];
		};

		if (
			!body.studentId ||
			!body.month ||
			!body.year ||
			!body.lines ||
			body.lines.length === 0
		) {
			return c.json(
				{
					success: false,
					message:
						"studentId, month, year, and at least one line are required.",
				},
				400,
			);
		}
		if (body.month < 1 || body.month > 12) {
			return c.json(
				{ success: false, message: "month must be between 1 and 12." },
				400,
			);
		}
		if (body.lines.some((line) => line.price < 0)) {
			return c.json(
				{ success: false, message: "price cannot be negative." },
				400,
			);
		}

		const student = await prisma.student.findUnique({
			where: { id: body.studentId },
		});
		if (!student) {
			return c.json({ success: false, message: "Student not found." }, 404);
		}
		if (!student.studentNumber) {
			return c.json(
				{
					success: false,
					message:
						"This student doesn't have a student number yet — set one in Settings → User before generating an invoice.",
				},
				400,
			);
		}

		const currentGroupIds = await getCurrentGroupIdsForStudent(body.studentId);
		const invalidGroupId = body.lines.find(
			(line) => !currentGroupIds.includes(line.groupId),
		);
		if (invalidGroupId) {
			return c.json(
				{
					success: false,
					message:
						"This student is not currently enrolled in one of the selected groups.",
				},
				400,
			);
		}

		const year = body.year;
		const month = body.month;
		const studentNumber = student.studentNumber;
		const periodStart = new Date(year, month - 1, 1);
		const periodEnd = new Date(year, month, 1);
		const studentId = body.studentId;

		// Snapshot which sessions count as "attended" for this student in
		// each group right now — see the Invoice model's doc comment for why
		// this isn't recomputed live at render time. `attendanceRecorded` is
		// the only eligibility gate; session status (draft/finished) isn't
		// part of this check.
		const lineInputs = await Promise.all(
			body.lines.map(async (line) => {
				const [teacherId, group, attendedSessions] = await Promise.all([
					getCurrentTeacherId(line.groupId),
					prisma.group.findUnique({
						where: { id: line.groupId },
						include: { subject: true },
					}),
					prisma.session.findMany({
						where: {
							groupId: line.groupId,
							date: { gte: periodStart, lt: periodEnd },
							attendanceRecorded: true,
							attendance: { some: { studentId } },
						},
						orderBy: { date: "asc" },
					}),
				]);
				return {
					...line,
					teacherId,
					subjectCode: group?.subject.subjectCode ?? null,
					attendedSessions,
				};
			}),
		);

		const missingTeacherLine = lineInputs.find((line) => !line.teacherId);
		if (missingTeacherLine) {
			return c.json(
				{
					success: false,
					message: "One of the selected groups has no assigned teacher yet.",
				},
				400,
			);
		}
		const missingSubjectCodeLine = lineInputs.find((line) => !line.subjectCode);
		if (missingSubjectCodeLine) {
			return c.json(
				{
					success: false,
					message:
						"One of the selected groups' subjects doesn't have a subject code yet — set one in Settings → Subject before generating an invoice.",
				},
				400,
			);
		}

		const invoice = await prisma.invoice.create({
			data: {
				studentId,
				month,
				year,
				lines: {
					create: lineInputs.map((line) => ({
						groupId: line.groupId,
						// biome-ignore lint/style/noNonNullAssertion: checked via missingTeacherLine above
						teacherId: line.teacherId!,
						invoiceNo: buildInvoiceNo(
							// biome-ignore lint/style/noNonNullAssertion: checked via missingSubjectCodeLine above
							line.subjectCode!,
							year,
							month,
							studentNumber,
						),
						price: line.price,
						sessions: {
							connect: line.attendedSessions.map((s) => ({ id: s.id })),
						},
					})),
				},
			},
			include: INVOICE_INCLUDE,
		});
		return c.json(
			{ success: true, data: await serializeInvoice(invoice) },
			201,
		);
	},
);

invoicesRouter.patch(
	"/invoices/:invoiceId",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const invoiceId = c.req.param("invoiceId");

		const existing = await prisma.invoice.findUnique({
			where: { id: invoiceId },
		});
		if (!existing) {
			return c.json({ success: false, message: "Invoice not found." }, 404);
		}

		const body = (await c.req.json()) as { sent?: boolean };
		if (body.sent === undefined) {
			return c.json({ success: false, message: "sent is required." }, 400);
		}

		const invoice = await prisma.invoice.update({
			where: { id: invoiceId },
			data: { sent: body.sent },
			include: INVOICE_INCLUDE,
		});
		return c.json({ success: true, data: await serializeInvoice(invoice) });
	},
);

invoicesRouter.delete(
	"/invoices/:invoiceId",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const invoiceId = c.req.param("invoiceId");

		const existing = await prisma.invoice.findUnique({
			where: { id: invoiceId },
		});
		if (!existing) {
			return c.json({ success: false, message: "Invoice not found." }, 404);
		}

		await prisma.invoice.delete({ where: { id: invoiceId } });
		return c.json({ success: true });
	},
);

invoicesRouter.get(
	"/invoices/:invoiceId/pdf",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const invoiceId = c.req.param("invoiceId");

		const invoice = await prisma.invoice.findUnique({
			where: { id: invoiceId },
			include: {
				lines: { include: { sessions: { orderBy: { date: "asc" } } } },
			},
		});
		if (!invoice) {
			return c.json({ success: false, message: "Invoice not found." }, 404);
		}

		const [student, reportSettings, invoiceSettings, lines] = await Promise.all(
			[
				prisma.student.findUnique({
					where: { id: invoice.studentId },
					include: { user: true },
				}),
				prisma.reportSettings.findFirst(),
				prisma.invoiceSettings.findFirst(),
				Promise.all(
					invoice.lines.map(async (line) => {
						const [group, teacher] = await Promise.all([
							prisma.group.findUnique({
								where: { id: line.groupId },
								include: { subject: true },
							}),
							prisma.teacher.findUnique({
								where: { id: line.teacherId },
								include: { user: true },
							}),
						]);
						return {
							groupId: line.groupId,
							groupName: group?.name ?? "-",
							subjectName: group?.subject.name ?? "-",
							groupTypeLabel: groupTypeLabel(group?.groupType),
							teacherName: teacher?.user.name ?? "-",
							invoiceNo: line.invoiceNo,
							price: line.price,
							sessionCount: line.sessions.length,
						};
					}),
				),
			],
		);

		const buffer = await renderInvoicePdf({
			studentName: student?.user.name ?? "-",
			month: invoice.month,
			year: invoice.year,
			issuedAtLabel: invoice.createdAt.toLocaleDateString("en-GB", {
				day: "numeric",
				month: "long",
				year: "numeric",
			}),
			lines,
			totalPrice: lines.reduce((sum, line) => sum + line.price, 0),
			primaryColor: DEFAULT_THEME_COLOR,
			organizationName: reportSettings?.organizationName ?? "Ihsanify",
			logoUrl: reportSettings?.logoUrl ?? null,
			websiteUrl: reportSettings?.websiteUrl ?? null,
			footerPhone: reportSettings?.footerPhone ?? null,
			footerEmail: reportSettings?.footerEmail ?? null,
			footerInstagram: reportSettings?.footerInstagram ?? null,
			bankName: invoiceSettings?.bankName ?? null,
			bankAccount: invoiceSettings?.bankAccount ?? null,
			receiverName: invoiceSettings?.receiverName ?? null,
			font: reportSettings?.font ?? "HELVETICA",
			headerPattern: reportSettings?.headerPattern ?? "NONE",
		});

		return c.body(new Uint8Array(buffer), 200, {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="invoice-${invoice.year}-${invoice.month}-${student?.user.name ?? invoiceId}.pdf"`,
		});
	},
);
