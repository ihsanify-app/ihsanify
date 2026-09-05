import { Hono } from "hono";
import { renderPayslipPdf } from "../pdf/PayslipDocument";
import { DEFAULT_THEME_COLOR } from "../pdf/shared";
import { requireAuth, requireRole } from "../utils/auth";
import {
	getCurrentGroupIdsForTeacher,
	getCurrentStudentIds,
} from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const payrollRouter = new Hono();

const GROUP_TYPES = ["GROUP", "PRIVATE", "SEMI_PRIVATE"] as const;

function groupTypeLabel(groupType: (typeof GROUP_TYPES)[number]) {
	if (groupType === "PRIVATE") return "Privat";
	if (groupType === "SEMI_PRIVATE") return "Semi Privat";
	return "Kelompok";
}

function monthRange(year: number, month: number) {
	return {
		start: new Date(year, month - 1, 1),
		end: new Date(year, month, 1), // exclusive
	};
}

// The instant a payroll period "closes" — used to replay the enrollment/
// assignment audit logs as they stood back then, not as they stand today.
function endOfMonth(year: number, month: number) {
	return new Date(year, month, 0, 23, 59, 59, 999);
}

function parseMonthYear(c: {
	req: { query: (key: string) => string | undefined };
}) {
	const month = Number(c.req.query("month"));
	const year = Number(c.req.query("year"));
	if (!Number.isInteger(month) || month < 1 || month > 12) return null;
	if (!Number.isInteger(year) || year < 2000) return null;
	return { month, year };
}

// ---------------------------------------------------------------------------
// Teacher rates (Settings → User)
// ---------------------------------------------------------------------------

payrollRouter.get(
	"/teachers/:teacherId/rates",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const teacherId = c.req.param("teacherId");
		const rates = await prisma.teacherRate.findMany({ where: { teacherId } });
		return c.json({
			success: true,
			data: rates.map((r) => ({
				groupType: r.groupType.toLowerCase(),
				monthlyRate: r.monthlyRate,
			})),
		});
	},
);

payrollRouter.patch(
	"/teachers/:teacherId/rates",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const teacherId = c.req.param("teacherId");
		const teacher = await prisma.teacher.findUnique({
			where: { id: teacherId },
		});
		if (!teacher) {
			return c.json({ success: false, message: "Teacher not found." }, 404);
		}

		const body = (await c.req.json()) as {
			rates: {
				groupType: "group" | "private" | "semi_private";
				monthlyRate: number;
			}[];
		};

		for (const rate of body.rates ?? []) {
			const groupType = rate.groupType.toUpperCase();
			if (!GROUP_TYPES.includes(groupType as (typeof GROUP_TYPES)[number]))
				continue;
			await prisma.teacherRate.upsert({
				where: {
					teacherId_groupType: {
						teacherId,
						groupType: groupType as "GROUP" | "PRIVATE" | "SEMI_PRIVATE",
					},
				},
				create: {
					teacherId,
					groupType: groupType as "GROUP" | "PRIVATE" | "SEMI_PRIVATE",
					monthlyRate: rate.monthlyRate,
				},
				update: { monthlyRate: rate.monthlyRate },
			});
		}

		const rates = await prisma.teacherRate.findMany({ where: { teacherId } });
		return c.json({
			success: true,
			data: rates.map((r) => ({
				groupType: r.groupType.toLowerCase(),
				monthlyRate: r.monthlyRate,
			})),
		});
	},
);

// ---------------------------------------------------------------------------
// Period aggregate — GET /payroll?month=&year=
// ---------------------------------------------------------------------------

payrollRouter.get("/payroll", requireAuth, requireRole("ADMIN"), async (c) => {
	const period = parseMonthYear(c);
	if (!period) {
		return c.json(
			{ success: false, message: "month and year are required." },
			400,
		);
	}

	// No Payroll row is created just from viewing a period — only from
	// actually creating a payslip in it (see POST /payroll/payslips). An
	// unviewed/empty period simply has nothing to summarize yet.
	const payroll = await prisma.payroll.findUnique({
		where: { month_year: { month: period.month, year: period.year } },
		include: { payslips: { include: { lines: true } } },
	});

	let totalProfit = 0;
	let totalCost = 0;
	const groupIds = new Set<string>();
	for (const payslip of payroll?.payslips ?? []) {
		for (const line of payslip.lines) {
			totalProfit += line.price;
			totalCost += line.teacherRateSnapshot;
			groupIds.add(line.groupId);
		}
	}

	return c.json({
		success: true,
		data: {
			totalRevenue: totalProfit - totalCost,
			totalCost,
			totalProfit,
			totalGroup: groupIds.size,
		},
	});
});

// ---------------------------------------------------------------------------
// Payslip list / detail
// ---------------------------------------------------------------------------

payrollRouter.get(
	"/payroll/payslips",
	requireAuth,
	requireRole("ADMIN", "TEACHER"),
	async (c) => {
		const period = parseMonthYear(c);
		if (!period) {
			return c.json(
				{ success: false, message: "month and year are required." },
				400,
			);
		}

		// Teachers only ever see their own payslips — resolve their teacher
		// record up front and scope the relation query to it.
		let teacherScope: string | undefined;
		if (c.get("authUser").role === "TEACHER") {
			const teacher = await prisma.teacher.findUnique({
				where: { userId: c.get("authUser").id },
			});
			if (!teacher) return c.json({ success: true, data: [] });
			teacherScope = teacher.id;
		}

		const payroll = await prisma.payroll.findUnique({
			where: { month_year: { month: period.month, year: period.year } },
			include: {
				payslips: {
					where: teacherScope ? { teacherId: teacherScope } : undefined,
					include: { teacher: { include: { user: true } }, lines: true },
					orderBy: { createdAt: "asc" },
				},
			},
		});

		return c.json({
			success: true,
			data: (payroll?.payslips ?? []).map((p) => ({
				payslipId: p.id,
				teacherId: p.teacherId,
				teacherName: p.teacher.user.name,
				totalProfit: p.lines.reduce((sum, l) => sum + l.price, 0),
				totalCost: p.lines.reduce((sum, l) => sum + l.teacherRateSnapshot, 0),
				lineCount: p.lines.length,
			})),
		});
	},
);

// A teacher may read their own payslip (detail and PDF), so the ownership
// check is shared between both handlers.
async function getPayslipForUser(
	payslipId: string,
	user: {
		id: string;
		role: "ADMIN" | "TEACHER" | "STUDENT";
	},
) {
	const payslip = await prisma.payslip.findUnique({
		where: { id: payslipId },
		include: {
			teacher: true,
		},
	});
	if (!payslip) return { error: "not_found" as const };
	if (user.role === "TEACHER" && payslip.teacher.userId !== user.id) {
		return { error: "forbidden" as const };
	}
	return { payslip };
}

payrollRouter.get(
	"/payroll/payslips/:id",
	requireAuth,
	requireRole("ADMIN", "TEACHER"),
	async (c) => {
		const result = await getPayslipForUser(
			c.req.param("id"),
			c.get("authUser"),
		);
		if (result.error === "not_found") {
			return c.json({ success: false, message: "Payslip not found." }, 404);
		}
		if (result.error === "forbidden") {
			return c.json(
				{ success: false, message: "You can only view your own payslips." },
				403,
			);
		}
		const payslip = await prisma.payslip.findUnique({
			where: { id: c.req.param("id") },
			include: {
				payroll: true,
				teacher: { include: { user: true } },
				lines: {
					include: {
						group: { include: { subject: true } },
						student: { include: { user: true } },
					},
				},
			},
		});
		if (!payslip) {
			return c.json({ success: false, message: "Payslip not found." }, 404);
		}
		return c.json({
			success: true,
			data: {
				payslipId: payslip.id,
				teacherId: payslip.teacherId,
				teacherName: payslip.teacher.user.name,
				month: payslip.payroll.month,
				year: payslip.payroll.year,
				lines: payslip.lines.map((l) => ({
					groupId: l.groupId,
					groupName: l.group.name,
					studentId: l.studentId,
					studentName: l.student.user.name,
					sessionsAttended: l.sessionsAttended,
					sessionsTotal: l.sessionsTotal,
					price: l.price,
					groupType: l.groupTypeSnapshot.toLowerCase(),
					teacherRate: l.teacherRateSnapshot,
				})),
			},
		});
	},
);

payrollRouter.get(
	"/payroll/payslips/:id/pdf",
	requireAuth,
	requireRole("ADMIN", "TEACHER"),
	async (c) => {
		const result = await getPayslipForUser(
			c.req.param("id"),
			c.get("authUser"),
		);
		if (result.error === "not_found") {
			return c.json({ success: false, message: "Payslip not found." }, 404);
		}
		if (result.error === "forbidden") {
			return c.json(
				{ success: false, message: "You can only view your own payslips." },
				403,
			);
		}
		const payslip = await prisma.payslip.findUnique({
			where: { id: c.req.param("id") },
			include: {
				payroll: true,
				teacher: { include: { user: true } },
				lines: {
					include: {
						group: true,
						student: { include: { user: true } },
					},
				},
			},
		});
		if (!payslip) {
			return c.json({ success: false, message: "Payslip not found." }, 404);
		}

		const reportSettings = await prisma.reportSettings.findFirst();

		const buffer = await renderPayslipPdf({
			teacherName: payslip.teacher.user.name,
			month: payslip.payroll.month,
			year: payslip.payroll.year,
			issuedAtLabel: payslip.createdAt.toLocaleDateString("en-GB", {
				day: "numeric",
				month: "long",
				year: "numeric",
			}),
			lines: payslip.lines.map((l) => ({
				groupId: l.groupId,
				studentId: l.studentId,
				groupName: l.group.name,
				studentName: l.student.user.name,
				groupTypeLabel: groupTypeLabel(l.groupTypeSnapshot),
				sessionsAttended: l.sessionsAttended,
				sessionsTotal: l.sessionsTotal,
				rate: l.teacherRateSnapshot,
			})),
			totalPayment: payslip.lines.reduce(
				(sum, l) => sum + l.teacherRateSnapshot,
				0,
			),
			primaryColor: DEFAULT_THEME_COLOR,
			organizationName: reportSettings?.organizationName ?? "Ihsanify",
			logoUrl: reportSettings?.logoUrl ?? null,
			websiteUrl: reportSettings?.websiteUrl ?? null,
			footerPhone: reportSettings?.footerPhone ?? null,
			footerEmail: reportSettings?.footerEmail ?? null,
			footerInstagram: reportSettings?.footerInstagram ?? null,
			font: reportSettings?.font ?? "HELVETICA",
			headerPattern: reportSettings?.headerPattern ?? "NONE",
		});

		return c.body(new Uint8Array(buffer), 200, {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="payslip-${payslip.payroll.year}-${payslip.payroll.month}-${payslip.teacher.user.name}.pdf"`,
		});
	},
);

payrollRouter.delete(
	"/payroll/payslips/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const existing = await prisma.payslip.findUnique({
			where: { id: c.req.param("id") },
		});
		if (!existing) {
			return c.json({ success: false, message: "Payslip not found." }, 404);
		}
		await prisma.payslip.delete({ where: { id: existing.id } });
		return c.json({ success: true });
	},
);

// ---------------------------------------------------------------------------
// Create-payslip preview — auto-populates groups/students/session fractions
// for a teacher "as of" the selected month, using the same audit-log replay
// this app already uses everywhere else for historical accuracy.
// ---------------------------------------------------------------------------

async function buildPayslipPreview(
	teacherId: string,
	month: number,
	year: number,
) {
	const asOf = endOfMonth(year, month);
	const { start, end } = monthRange(year, month);

	const groupIds = await getCurrentGroupIdsForTeacher(teacherId, asOf);
	const groups = await prisma.group.findMany({
		where: { id: { in: groupIds } },
	});
	const rates = await prisma.teacherRate.findMany({ where: { teacherId } });
	const rateByType = new Map(rates.map((r) => [r.groupType, r.monthlyRate]));

	const preview = [];
	for (const group of groups) {
		const studentIds = await getCurrentStudentIds(group.id, asOf);
		const students = await prisma.student.findMany({
			where: { id: { in: studentIds } },
			include: { user: true },
		});

		// Only sessions with attendance actually recorded count toward the
		// denominator — an unrecorded session isn't evidence of absence, so
		// including it would unfairly deflate every student's fraction for a
		// gap that's the teacher's bookkeeping, not the student's attendance.
		const sessions = await prisma.session.findMany({
			where: {
				groupId: group.id,
				date: { gte: start, lt: end },
				attendanceRecorded: true,
			},
			include: { attendance: true },
		});
		const sessionsTotal = sessions.length;

		preview.push({
			groupId: group.id,
			groupName: group.name,
			groupType: group.groupType.toLowerCase(),
			teacherRate: rateByType.get(group.groupType) ?? null,
			students: students.map((student) => ({
				studentId: student.id,
				studentName: student.user.name,
				sessionsAttended: sessions.filter((s) =>
					s.attendance.some((a) => a.studentId === student.id),
				).length,
				sessionsTotal,
			})),
		});
	}
	return preview;
}

payrollRouter.get(
	"/payroll/create-payslip-data",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const teacherId = c.req.query("teacherId");
		const period = parseMonthYear(c);
		if (!teacherId || !period) {
			return c.json(
				{ success: false, message: "teacherId, month, and year are required." },
				400,
			);
		}

		const payroll = await prisma.payroll.findUnique({
			where: { month_year: { month: period.month, year: period.year } },
		});
		const existing = payroll
			? await prisma.payslip.findUnique({
					where: {
						payrollId_teacherId: { payrollId: payroll.id, teacherId },
					},
				})
			: null;

		const groups = await buildPayslipPreview(
			teacherId,
			period.month,
			period.year,
		);
		return c.json({
			success: true,
			data: { groups, existingPayslipId: existing?.id ?? null },
		});
	},
);

payrollRouter.post(
	"/payroll/payslips",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			teacherId?: string;
			month?: number;
			year?: number;
			lines?: { groupId: string; studentId: string; price: number }[];
		};

		if (!body.teacherId || !body.month || !body.year || !body.lines?.length) {
			return c.json(
				{
					success: false,
					message:
						"teacherId, month, year, and at least one line are required.",
				},
				400,
			);
		}
		const { teacherId, month, year } = body;

		// The Payroll period is only actually created here, at the moment its
		// first payslip is — not from merely viewing the period on GET /payroll.
		const payroll = await prisma.payroll.upsert({
			where: { month_year: { month, year } },
			create: { month, year },
			update: {},
		});

		const existing = await prisma.payslip.findUnique({
			where: { payrollId_teacherId: { payrollId: payroll.id, teacherId } },
		});
		if (existing) {
			return c.json(
				{
					success: false,
					message: "A payslip already exists for this teacher in this period.",
					payslipId: existing.id,
				},
				409,
			);
		}

		// Recompute everything authoritatively server-side — never trust the
		// client for the frozen snapshot values, only for the manually
		// negotiated `price` per line.
		const preview = await buildPayslipPreview(teacherId, month, year);
		const previewByGroup = new Map(preview.map((g) => [g.groupId, g]));

		const linesToCreate: {
			groupId: string;
			studentId: string;
			price: number;
			sessionsAttended: number;
			sessionsTotal: number;
			groupTypeSnapshot: "GROUP" | "PRIVATE" | "SEMI_PRIVATE";
			teacherRateSnapshot: number;
		}[] = [];

		for (const line of body.lines) {
			const group = previewByGroup.get(line.groupId);
			const student = group?.students.find(
				(s) => s.studentId === line.studentId,
			);
			if (!group || !student) {
				return c.json(
					{
						success: false,
						message: `Student ${line.studentId} is not part of ${teacherId}'s roster for this period.`,
					},
					400,
				);
			}
			if (group.teacherRate === null) {
				return c.json(
					{
						success: false,
						message: `Set this teacher's rate for ${group.groupType} groups before creating this payslip.`,
					},
					400,
				);
			}
			linesToCreate.push({
				groupId: line.groupId,
				studentId: line.studentId,
				price: line.price,
				sessionsAttended: student.sessionsAttended,
				sessionsTotal: student.sessionsTotal,
				groupTypeSnapshot: group.groupType.toUpperCase() as
					| "GROUP"
					| "PRIVATE"
					| "SEMI_PRIVATE",
				teacherRateSnapshot: group.teacherRate,
			});
		}

		const payslip = await prisma.payslip.create({
			data: {
				payrollId: payroll.id,
				teacherId,
				lines: { create: linesToCreate },
			},
			include: { lines: true },
		});

		return c.json({ success: true, data: { payslipId: payslip.id } }, 201);
	},
);
