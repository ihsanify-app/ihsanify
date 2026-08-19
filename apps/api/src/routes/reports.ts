import { Hono } from "hono";
import { DEFAULT_THEME_COLOR, renderReportPdf } from "../pdf/ReportDocument";
import { requireAuth } from "../utils/auth";
import {
	canManageGroup,
	canUserAccessGroup,
	getCurrentStudentIds,
	getCurrentTeacherId,
} from "../utils/groupState";
import { prisma } from "../utils/prisma";

export const reportsRouter = new Hono();

const SCORE_DENOMINATOR = 100;

type ReportGrade = "MUMTAZ" | "JAYYID_JIDDAN" | "JAYYID" | "MAQBUL" | "DHAIF";

// score is the persisted source of truth (kept for future progress-over-time
// graphing); grade is a pure function of it, derived here rather than stored,
// so it can never drift out of sync with the number it's based on.
function deriveGrade(score: number): ReportGrade {
	if (score >= 90) return "MUMTAZ";
	if (score >= 80) return "JAYYID_JIDDAN";
	if (score >= 70) return "JAYYID";
	if (score >= 60) return "MAQBUL";
	return "DHAIF";
}

const GRADE_LABEL: Record<ReportGrade, { male: string; female: string }> = {
	MUMTAZ: { male: "Mumtaz", female: "Mumtaazah" },
	JAYYID_JIDDAN: { male: "Jayyid Jiddan", female: "Jayyidah Jiddan" },
	JAYYID: { male: "Jayyid", female: "Jayyidah" },
	MAQBUL: { male: "Maqbul", female: "Maqbulah" },
	DHAIF: { male: "Dhaif", female: "Dhaifah" },
};

function deriveGradeLabel(
	grade: ReportGrade,
	gender: "MALE" | "FEMALE" | null,
) {
	return GRADE_LABEL[grade][gender === "FEMALE" ? "female" : "male"];
}

type ReportRecord = {
	id: string;
	groupId: string;
	studentId: string;
	teacherId: string;
	month: number;
	year: number;
	progress: string;
	advice: string;
	score: number;
	submittedAt: Date | null;
	readAt: Date | null;
	createdAt: Date;
};

async function serializeReport(report: ReportRecord) {
	const [student, teacher] = await Promise.all([
		prisma.student.findUnique({
			where: { id: report.studentId },
			include: { user: true },
		}),
		prisma.teacher.findUnique({
			where: { id: report.teacherId },
			include: { user: true },
		}),
	]);

	const statusKind: "draft" | "submitted" | "read" = report.readAt
		? "read"
		: report.submittedAt
			? "submitted"
			: "draft";
	const statusLabel =
		statusKind === "read"
			? `Read by ${student?.user.name ?? "student"}`
			: statusKind === "submitted"
				? `Submitted by ${teacher?.user.name ?? "teacher"}`
				: "Draft";

	const grade = deriveGrade(report.score);

	return {
		reportId: report.id,
		groupId: report.groupId,
		studentId: report.studentId,
		studentName: student?.user.name ?? null,
		teacherId: report.teacherId,
		teacherName: teacher?.user.name ?? null,
		month: report.month,
		year: report.year,
		progress: report.progress,
		advice: report.advice,
		score: report.score,
		scoreDenominator: SCORE_DENOMINATOR,
		grade,
		gradeLabel: deriveGradeLabel(grade, student?.user.gender ?? null),
		statusKind,
		statusLabel,
		submittedAt: report.submittedAt ? report.submittedAt.toISOString() : null,
		readAt: report.readAt ? report.readAt.toISOString() : null,
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

	let reports: ReportRecord[];
	if (await canManageGroup(authUser, groupId)) {
		reports = await prisma.report.findMany({
			where: { groupId },
			orderBy: { createdAt: "desc" },
		});
	} else {
		const student = await prisma.student.findUnique({
			where: { userId: authUser.id },
		});
		reports = student
			? await prisma.report.findMany({
					where: { groupId, studentId: student.id, submittedAt: { not: null } },
					orderBy: { createdAt: "desc" },
				})
			: [];
	}

	const rosterStudentIds = await getCurrentStudentIds(groupId);
	const rosterStudents = await prisma.student.findMany({
		where: { id: { in: rosterStudentIds } },
		include: { user: true },
	});
	const roster = rosterStudents.map((st) => ({
		studentId: st.id,
		studentName: st.user.name,
	}));

	const data = await Promise.all(reports.map(serializeReport));
	return c.json({ success: true, roster, data });
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
		studentId?: string;
		month?: number;
		year?: number;
		progress?: string;
		advice?: string;
		score?: number;
		submit?: boolean;
	};

	if (
		!body.studentId ||
		!body.month ||
		!body.year ||
		!body.progress ||
		!body.advice ||
		body.score === undefined
	) {
		return c.json(
			{
				success: false,
				message:
					"StudentId, Month, Year, Progress, Advice, and Score are required.",
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
	if (body.score < 0 || body.score > SCORE_DENOMINATOR) {
		return c.json(
			{
				success: false,
				message: `score must be between 0 and ${SCORE_DENOMINATOR}.`,
			},
			400,
		);
	}

	const currentStudentIds = await getCurrentStudentIds(groupId);
	if (!currentStudentIds.includes(body.studentId)) {
		return c.json(
			{ success: false, message: "That student is not in this group." },
			400,
		);
	}

	const teacherId = await getCurrentTeacherId(groupId);
	if (!teacherId) {
		return c.json(
			{
				success: false,
				message: "This group has no assigned teacher yet.",
			},
			400,
		);
	}

	const report = await prisma.report.create({
		data: {
			groupId,
			studentId: body.studentId,
			teacherId,
			month: body.month,
			year: body.year,
			progress: body.progress,
			advice: body.advice,
			score: body.score,
			submittedAt: body.submit ? new Date() : null,
		},
	});
	return c.json({ success: true, data: await serializeReport(report) }, 201);
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
		studentId?: string;
		month?: number;
		year?: number;
		progress?: string;
		advice?: string;
		score?: number;
	};

	if (body.studentId !== undefined) {
		const currentStudentIds = await getCurrentStudentIds(groupId);
		if (!currentStudentIds.includes(body.studentId)) {
			return c.json(
				{ success: false, message: "That student is not in this group." },
				400,
			);
		}
	}
	if (body.month !== undefined && (body.month < 1 || body.month > 12)) {
		return c.json(
			{ success: false, message: "month must be between 1 and 12." },
			400,
		);
	}
	if (
		body.score !== undefined &&
		(body.score < 0 || body.score > SCORE_DENOMINATOR)
	) {
		return c.json(
			{
				success: false,
				message: `score must be between 0 and ${SCORE_DENOMINATOR}.`,
			},
			400,
		);
	}

	const retargetingStudent =
		body.studentId !== undefined && body.studentId !== existing.studentId;

	const report = await prisma.report.update({
		where: { id: reportId },
		data: {
			...(body.studentId !== undefined && { studentId: body.studentId }),
			...(body.month !== undefined && { month: body.month }),
			...(body.year !== undefined && { year: body.year }),
			...(body.progress !== undefined && { progress: body.progress }),
			...(body.advice !== undefined && { advice: body.advice }),
			...(body.score !== undefined && { score: body.score }),
			// Re-targeting to a different student invalidates any existing
			// submitted/read state, which described the old student.
			...(retargetingStudent && { submittedAt: null, readAt: null }),
		},
	});
	return c.json({ success: true, data: await serializeReport(report) });
});

reportsRouter.post(
	"/groups/:id/reports/:reportId/submit",
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
						"Only an admin or this group's current teacher can submit a report.",
				},
				403,
			);
		}

		const report = existing.submittedAt
			? existing
			: await prisma.report.update({
					where: { id: reportId },
					data: { submittedAt: new Date() },
				});
		return c.json({ success: true, data: await serializeReport(report) });
	},
);

reportsRouter.post(
	"/groups/:id/reports/:reportId/read",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		const groupId = c.req.param("id");
		const reportId = c.req.param("reportId");

		if (authUser.role !== "STUDENT") {
			return c.json(
				{ success: false, message: "Only a student can mark a report read." },
				403,
			);
		}
		const student = await prisma.student.findUnique({
			where: { userId: authUser.id },
		});
		if (!student) {
			return c.json(
				{ success: false, message: "Student profile not found." },
				403,
			);
		}

		const existing = await prisma.report.findUnique({
			where: { id: reportId },
		});
		if (!existing || existing.groupId !== groupId) {
			return c.json({ success: false, message: "Report not found." }, 404);
		}
		if (existing.studentId !== student.id) {
			return c.json(
				{ success: false, message: "This report is not addressed to you." },
				403,
			);
		}
		if (!existing.submittedAt) {
			return c.json(
				{ success: false, message: "This report has not been submitted yet." },
				403,
			);
		}

		const report = existing.readAt
			? existing
			: await prisma.report.update({
					where: { id: reportId },
					data: { readAt: new Date() },
				});
		return c.json({ success: true, data: await serializeReport(report) });
	},
);

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

function genderLabel(gender: "MALE" | "FEMALE" | null) {
	if (gender === "FEMALE") return "Akhawat";
	if (gender === "MALE") return "Ikhwan";
	return "-";
}

reportsRouter.get(
	"/groups/:id/reports/:reportId/pdf",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		const groupId = c.req.param("id");
		const reportId = c.req.param("reportId");

		const report = await prisma.report.findUnique({ where: { id: reportId } });
		if (!report || report.groupId !== groupId) {
			return c.json({ success: false, message: "Report not found." }, 404);
		}

		const canManage = await canManageGroup(authUser, groupId);
		if (!canManage) {
			const student = await prisma.student.findUnique({
				where: { userId: authUser.id },
			});
			const isOwnSubmittedReport =
				!!student &&
				report.studentId === student.id &&
				report.submittedAt !== null;
			if (!isOwnSubmittedReport) {
				return c.json(
					{ success: false, message: "You don't have access to this report." },
					403,
				);
			}
		}

		const [group, student, teacher, reportSettings] = await Promise.all([
			prisma.group.findUnique({
				where: { id: report.groupId },
				include: { subject: { include: { reportTheme: true } } },
			}),
			prisma.student.findUnique({
				where: { id: report.studentId },
				include: { user: true },
			}),
			prisma.teacher.findUnique({
				where: { id: report.teacherId },
				include: { user: true },
			}),
			prisma.reportSettings.findFirst(),
		]);

		const grade = deriveGrade(report.score);
		const buffer = await renderReportPdf({
			studentName: student?.user.name ?? "-",
			studentGenderLabel: genderLabel(student?.user.gender ?? null),
			subjectName: group?.subject.name ?? "-",
			teacherName: teacher?.user.name ?? "-",
			month: report.month,
			year: report.year,
			progress: report.progress,
			advice: report.advice,
			score: report.score,
			scoreDenominator: SCORE_DENOMINATOR,
			gradeLabel: deriveGradeLabel(grade, student?.user.gender ?? null),
			submittedAtLabel: report.submittedAt
				? report.submittedAt.toLocaleDateString("en-GB", {
						day: "numeric",
						month: "long",
						year: "numeric",
					})
				: null,
			primaryColor:
				group?.subject.reportTheme?.primaryColor ?? DEFAULT_THEME_COLOR,
			documentTitle: reportSettings?.title ?? "Laporan Belajar",
			organizationName: reportSettings?.organizationName ?? "Ihsanify",
			logoUrl: reportSettings?.logoUrl ?? null,
			websiteUrl: reportSettings?.websiteUrl ?? null,
			footerPhone: reportSettings?.footerPhone ?? null,
			footerEmail: reportSettings?.footerEmail ?? null,
			footerInstagram: reportSettings?.footerInstagram ?? null,
			font: reportSettings?.font ?? "HELVETICA",
			headerPattern: reportSettings?.headerPattern ?? "NONE",
			coverImageUrl: reportSettings?.coverImageUrl ?? null,
		});

		return c.body(new Uint8Array(buffer), 200, {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="report-${report.year}-${report.month}-${student?.user.name ?? reportId}.pdf"`,
		});
	},
);
