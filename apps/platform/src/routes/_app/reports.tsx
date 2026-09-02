import { createFileRoute } from "@tanstack/react-router";
import {
	Ban,
	Download,
	Eye,
	FolderDown,
	Pencil,
	PlusCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { apiFetch, downloadFile } from "../../lib/apiClient";
import { mockUser } from "../../lib/mockAuth";

export const Route = createFileRoute("/_app/reports")({
	component: RouteComponent,
});

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

type Option = { studentId: string; studentName: string };

type GroupOption = {
	groupId: string;
	groupName: string;
	subjectName: string | null;
	teacherName: string | null;
	studentIds: Option[];
};

type ReportRow = {
	reportId: string;
	groupId: string;
	groupName: string | null;
	subjectName: string | null;
	studentId: string;
	studentName: string | null;
	teacherId: string;
	teacherName: string | null;
	month: number;
	year: number;
	progress: string;
	advice: string;
	score: number;
	scoreDenominator: number;
	statusKind: "draft" | "submitted" | "read";
	statusLabel: string;
	submittedAt: string | null;
	readAt: string | null;
	isSent: boolean;
};

type ReportFormPayload = {
	groupId: string;
	studentId: string;
	month: number;
	year: number;
	progress: string;
	advice: string;
	score: number;
};

const STATUS_BADGE_CLASS: Record<ReportRow["statusKind"], string> = {
	draft: "bg-amber-100 text-amber-700",
	submitted: "bg-sky-100 text-sky-700",
	read: "bg-green-100 text-green-700",
};

// Pasted text (e.g. from WhatsApp or Word) often arrives already hard-wrapped
// at some fixed column width, with a literal line break at every wrap point.
// The report PDF renders every "\n" in Progress/Advice as a real line break,
// so a hard-wrapped paste would otherwise show up as a wall of short lines
// instead of reflowing. Stripped here, at the point the text enters the
// field, rather than guessed at render time — an actual Enter keypress by
// the teacher never goes through this, so it's untouched.
function normalizePastedFreeText(text: string): string {
	return text
		.split(/\n\s*\n/)
		.map((paragraph) =>
			paragraph
				.split("\n")
				.map((line) => line.trim())
				.join(" ")
				.replace(/\s+/g, " ")
				.trim(),
		)
		.filter((paragraph) => paragraph.length > 0)
		.join("\n\n");
}

function handleFreeTextPaste(
	e: React.ClipboardEvent<HTMLTextAreaElement>,
	setValue: (value: string) => void,
) {
	e.preventDefault();
	const target = e.currentTarget;
	const pasted = normalizePastedFreeText(e.clipboardData.getData("text"));
	const { selectionStart, selectionEnd, value } = target;
	const nextValue =
		value.slice(0, selectionStart) + pasted + value.slice(selectionEnd);
	const cursor = selectionStart + pasted.length;
	setValue(nextValue);
	requestAnimationFrame(() => {
		target.setSelectionRange(cursor, cursor);
	});
}

function ReportFormModal({
	initialData,
	groups,
	onClose,
	onSaveDraft,
	onSubmitReport,
}: {
	initialData: ReportRow | null;
	groups: GroupOption[];
	onClose: () => void;
	onSaveDraft: (payload: ReportFormPayload) => void;
	onSubmitReport: (payload: ReportFormPayload) => void;
}) {
	const now = new Date();
	const [groupId, setGroupId] = useState(
		initialData?.groupId ?? groups[0]?.groupId ?? "",
	);
	const [studentId, setStudentId] = useState(
		initialData?.studentId ?? groups[0]?.studentIds[0]?.studentId ?? "",
	);
	const [month, setMonth] = useState(initialData?.month ?? now.getMonth() + 1);
	const [year, setYear] = useState(initialData?.year ?? now.getFullYear());
	const [progress, setProgress] = useState(initialData?.progress ?? "");
	const [advice, setAdvice] = useState(initialData?.advice ?? "");
	const [score, setScore] = useState<number | "">(initialData?.score ?? 0);

	// A report's group can't be changed once created (the backend's edit
	// endpoint is scoped to a fixed groupId) — only which student within
	// that group it's about.
	const editableGroups = initialData
		? groups.filter((g) => g.groupId === initialData.groupId)
		: groups;
	const selectedGroup = editableGroups.find((g) => g.groupId === groupId);
	const roster = selectedGroup?.studentIds ?? [];
	const canSubmitAction = !initialData || initialData.statusKind === "draft";

	function handleGroupChange(nextGroupId: string) {
		setGroupId(nextGroupId);
		const nextGroup = groups.find((g) => g.groupId === nextGroupId);
		setStudentId(nextGroup?.studentIds[0]?.studentId ?? "");
	}

	const payload = {
		groupId,
		studentId,
		month,
		year,
		progress,
		advice,
		score: score === "" ? 0 : score,
	};

	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl max-sm:p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-1">
					{initialData ? "Edit Report" : "Add Report"}
				</h2>
				{initialData && (
					<span
						className={`inline-block mb-2 text-xs font-semibold px-3 py-1 rounded-full w-fit ${STATUS_BADGE_CLASS[initialData.statusKind]}`}
					>
						{initialData.statusLabel}
					</span>
				)}
				<form className="overflow-y-auto pr-1">
					<div className="flex flex-col gap-2">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							<label className="text-xs font-normal text-stone-500">
								Group
								<select
									className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal disabled:bg-stone-100 disabled:text-stone-400"
									value={groupId}
									disabled={!!initialData}
									onChange={(e) => handleGroupChange(e.target.value)}
								>
									{editableGroups.map((g) => (
										<option key={g.groupId} value={g.groupId}>
											{g.groupName}
										</option>
									))}
								</select>
							</label>
							<label className="text-xs font-normal text-stone-500">
								Student
								<select
									className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
									value={studentId}
									onChange={(e) => setStudentId(e.target.value)}
								>
									{roster.map((s) => (
										<option key={s.studentId} value={s.studentId}>
											{s.studentName}
										</option>
									))}
								</select>
							</label>
						</div>
						<div className="flex gap-2">
							<label className="text-xs font-normal text-stone-500 flex-1">
								Month
								<select
									className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
									value={month}
									onChange={(e) => setMonth(Number(e.target.value))}
								>
									{MONTH_NAMES.map((name, i) => (
										<option key={name} value={i + 1}>
											{name}
										</option>
									))}
								</select>
							</label>
							<label className="text-xs font-normal text-stone-500 w-24">
								Year
								<input
									className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
									type="number"
									value={year}
									onChange={(e) => setYear(Number(e.target.value))}
								/>
							</label>
						</div>
						<div className="flex max-sm:flex-col sm:flex-row gap-2 text-xs font-normal text-stone-500">
							<div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl p-2">
								Teacher
								<div className="text-stone-700 font-semibold">
									{selectedGroup?.teacherName ?? "-"}
								</div>
							</div>
							<div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl p-2">
								Subject
								<div className="text-stone-700 font-semibold">
									{selectedGroup?.subjectName ?? "-"}
								</div>
							</div>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							<textarea
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors min-h-32"
								placeholder="Progress"
								value={progress}
								onChange={(e) => setProgress(e.target.value)}
								onPaste={(e) => handleFreeTextPaste(e, setProgress)}
							/>
							<textarea
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors min-h-32"
								placeholder="Advice"
								value={advice}
								onChange={(e) => setAdvice(e.target.value)}
								onPaste={(e) => handleFreeTextPaste(e, setAdvice)}
							/>
						</div>
						<label className="text-xs font-normal text-stone-500">
							Score
							<div className="mt-1 flex items-center gap-2">
								<input
									className="w-20 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
									type="number"
									min={0}
									max={100}
									value={score}
									onFocus={() => {
										if (score === 0) setScore("");
									}}
									onBlur={() => {
										if (score === "") setScore(0);
									}}
									onChange={(e) =>
										setScore(
											e.target.value === "" ? "" : Number(e.target.value),
										)
									}
								/>
								<span className="font-semibold text-stone-500">/</span>
								<input
									className="w-20 border border-stone-200 bg-stone-100 rounded-xl p-2 text-sm text-stone-500 font-normal"
									type="number"
									value={100}
									readOnly
								/>
							</div>
						</label>
					</div>
				</form>
				<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4 shrink-0">
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-xl border border-stone-300 text-stone-600 px-4 py-2 hover:bg-stone-50 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={!groupId || !studentId}
						onClick={() => onSaveDraft(payload)}
						className="cursor-pointer rounded-xl border border-green-600 text-green-700 px-4 py-2 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Save Draft
					</button>
					{canSubmitAction && (
						<button
							type="button"
							disabled={!groupId || !studentId}
							onClick={() => onSubmitReport(payload)}
							className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Submit
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

function ViewReportModal({
	report,
	onClose,
}: {
	report: ReportRow;
	onClose: () => void;
}) {
	const toast = useToast();
	const [downloadError, setDownloadError] = useState("");

	async function handleDownload() {
		setDownloadError("");
		const result = await downloadFile(
			`/groups/${report.groupId}/reports/${report.reportId}/pdf`,
			`report-${report.year}-${String(report.month).padStart(2, "0")}-${report.studentName ?? report.reportId}.pdf`,
		);
		if (result.ok) {
			toast.success("Report PDF downloaded.");
		} else {
			setDownloadError(result.message ?? "Could not download PDF.");
		}
	}

	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl max-sm:p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-1">Report</h2>
				<span
					className={`inline-block mb-3 text-xs font-semibold px-3 py-1 rounded-full w-fit ${STATUS_BADGE_CLASS[report.statusKind]}`}
				>
					{report.statusLabel}
				</span>
				<div className="flex flex-col gap-2 text-sm overflow-y-auto pr-1">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
						<div className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-normal text-stone-500">
							Period
							<div className="text-stone-700 font-semibold">
								{MONTH_NAMES[report.month - 1]} {report.year}
							</div>
						</div>
						<div className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-normal text-stone-500">
							Group
							<div className="text-stone-700 font-semibold">
								{report.groupName ?? "-"}
							</div>
						</div>
						<div className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-normal text-stone-500">
							Score
							<div className="text-stone-700 font-semibold">
								{report.score}/{report.scoreDenominator}
							</div>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						<div className="border border-stone-200 rounded-xl p-2">
							<p className="text-xs font-normal text-stone-500 mb-1">
								Progress
							</p>
							<p className="font-normal text-stone-700 whitespace-pre-wrap">
								{report.progress}
							</p>
						</div>
						<div className="border border-stone-200 rounded-xl p-2">
							<p className="text-xs font-normal text-stone-500 mb-1">Advice</p>
							<p className="font-normal text-stone-700 whitespace-pre-wrap">
								{report.advice}
							</p>
						</div>
					</div>
				</div>
				{downloadError && (
					<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mt-3 shrink-0">
						{downloadError}
					</p>
				)}
				<div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 mt-4 shrink-0">
					<button
						type="button"
						onClick={handleDownload}
						className="flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-green-600 text-green-700 px-4 py-2 hover:bg-green-50 transition-colors"
					>
						<Download size={16} />
						Download PDF
					</button>
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-xl border border-stone-300 text-stone-600 px-4 py-2 hover:bg-stone-50 transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

function ConfirmDeleteModal({
	onConfirm,
	onClose,
}: {
	onConfirm: () => void;
	onClose: () => void;
}) {
	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-stone-800">
					Are you sure you want to delete this record?
				</h2>
				<div className="flex flex-col gap-2">
					<button
						type="button"
						className="cursor-pointer rounded-xl bg-rose-600 text-white p-2 hover:bg-rose-700 transition-colors"
						onClick={onConfirm}
					>
						Confirm
					</button>
					<button
						type="button"
						className="cursor-pointer rounded-xl border border-stone-300 text-stone-600 p-2 hover:bg-stone-50 transition-colors"
						onClick={onClose}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}

function BulkDownloadModal({
	students,
	onClose,
	onDownload,
}: {
	students: Option[];
	onClose: () => void;
	onDownload: (payload: {
		studentId: string;
		month: number;
		year: number;
	}) => Promise<{ ok: boolean; message?: string }>;
}) {
	const now = new Date();
	const [studentId, setStudentId] = useState(students[0]?.studentId ?? "");
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit() {
		if (!studentId) return;
		setError("");
		setIsSubmitting(true);
		const result = await onDownload({ studentId, month, year });
		setIsSubmitting(false);
		if (result.ok) {
			onClose();
		} else {
			setError(result.message ?? "Could not download reports.");
		}
	}

	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-1">
					Bulk Download
				</h2>
				<p className="text-sm font-normal text-stone-500 mb-3">
					Combines every submitted report this student has for the chosen
					month/year — across every subject and teacher — into one PDF.
				</p>
				<div className="flex flex-col gap-2">
					<label className="text-xs font-normal text-stone-500">
						Student
						<select
							className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
							value={studentId}
							onChange={(e) => setStudentId(e.target.value)}
						>
							{students.length === 0 && <option value="">No students</option>}
							{students.map((s) => (
								<option key={s.studentId} value={s.studentId}>
									{s.studentName}
								</option>
							))}
						</select>
					</label>
					<div className="flex gap-2">
						<label className="text-xs font-normal text-stone-500 flex-1">
							Month
							<select
								className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
								value={month}
								onChange={(e) => setMonth(Number(e.target.value))}
							>
								{MONTH_NAMES.map((name, i) => (
									<option key={name} value={i + 1}>
										{name}
									</option>
								))}
							</select>
						</label>
						<label className="text-xs font-normal text-stone-500 w-24">
							Year
							<input
								className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
								type="number"
								value={year}
								onChange={(e) => setYear(Number(e.target.value))}
							/>
						</label>
					</div>
				</div>
				{error && (
					<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mt-3 font-normal">
						{error}
					</p>
				)}
				<div className="flex justify-end gap-2 mt-4">
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-xl border border-stone-300 text-stone-600 px-4 py-2 hover:bg-stone-50 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={!studentId || isSubmitting}
						onClick={handleSubmit}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? "Downloading…" : "Download"}
					</button>
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const toast = useToast();
	const [loadState, setLoadState] = useState<"loading" | "ready" | "denied">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [reports, setReports] = useState<ReportRow[]>([]);
	const [groups, setGroups] = useState<GroupOption[]>([]);
	const [students, setStudents] = useState<Option[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
	const [editingReport, setEditingReport] = useState<ReportRow | null>(null);
	const [viewingReport, setViewingReport] = useState<ReportRow | null>(null);
	const [deletingReport, setDeletingReport] = useState<ReportRow | null>(null);

	const canManage = mockUser.role === "admin" || mockUser.role === "teacher";
	const isAdmin = mockUser.role === "admin";

	const load = useCallback(async () => {
		const [reportsRes, groupsRes, studentsRes] = await Promise.all([
			apiFetch("/reports"),
			canManage
				? apiFetch("/groups")
				: Promise.resolve({ status: 200, body: null }),
			isAdmin
				? apiFetch("/students")
				: Promise.resolve({ status: 200, body: null }),
		]);
		if (reportsRes.status === 401 || reportsRes.status === 403) {
			setLoadState("denied");
			setErrorMessage(reportsRes.body?.message ?? "Unable to load reports.");
			return;
		}
		setReports(reportsRes.body?.data ?? []);
		setGroups(groupsRes.body?.data ?? []);
		setStudents(studentsRes.body?.data ?? []);
		setLoadState("ready");
	}, [canManage, isAdmin]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleCreate(payload: ReportFormPayload, submit: boolean) {
		const { groupId, ...rest } = payload;
		const { body } = await apiFetch(`/groups/${groupId}/reports`, {
			method: "POST",
			body: JSON.stringify({ ...rest, submit }),
		});
		if (body?.success) {
			setReports((prev) => [body.data, ...prev]);
			setIsModalOpen(false);
		} else {
			setErrorMessage(body?.message ?? "Could not create report.");
		}
	}

	async function handleEdit(payload: ReportFormPayload) {
		if (!editingReport) return;
		const { groupId, ...rest } = payload;
		const { body } = await apiFetch(
			`/groups/${groupId}/reports/${editingReport.reportId}`,
			{ method: "PATCH", body: JSON.stringify(rest) },
		);
		if (body?.success) {
			setReports((prev) =>
				prev.map((r) =>
					r.reportId === editingReport.reportId ? body.data : r,
				),
			);
			setEditingReport(null);
		} else {
			setErrorMessage(body?.message ?? "Could not update report.");
		}
	}

	async function handleSubmitFromEdit(payload: ReportFormPayload) {
		if (!editingReport) return;
		const { groupId, ...rest } = payload;
		const { body: patchBody } = await apiFetch(
			`/groups/${groupId}/reports/${editingReport.reportId}`,
			{ method: "PATCH", body: JSON.stringify(rest) },
		);
		if (!patchBody?.success) {
			setErrorMessage(patchBody?.message ?? "Could not update report.");
			return;
		}
		const { body: submitBody } = await apiFetch(
			`/groups/${groupId}/reports/${editingReport.reportId}/submit`,
			{ method: "POST" },
		);
		if (submitBody?.success) {
			setReports((prev) =>
				prev.map((r) =>
					r.reportId === editingReport.reportId ? submitBody.data : r,
				),
			);
			setEditingReport(null);
		} else {
			setErrorMessage(submitBody?.message ?? "Could not submit report.");
		}
	}

	async function handleToggleSent(report: ReportRow) {
		const { body } = await apiFetch(
			`/groups/${report.groupId}/reports/${report.reportId}`,
			{ method: "PATCH", body: JSON.stringify({ isSent: !report.isSent }) },
		);
		if (body?.success) {
			setReports((prev) =>
				prev.map((r) => (r.reportId === report.reportId ? body.data : r)),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update report.");
		}
	}

	async function handleDelete(report: ReportRow) {
		const { body } = await apiFetch(
			`/groups/${report.groupId}/reports/${report.reportId}`,
			{ method: "DELETE" },
		);
		if (body?.success) {
			setReports((prev) => prev.filter((r) => r.reportId !== report.reportId));
			setDeletingReport(null);
		} else {
			setErrorMessage(body?.message ?? "Could not delete report.");
		}
	}

	async function handleView(report: ReportRow) {
		setViewingReport(report);
		if (report.statusKind === "submitted" && mockUser.role === "student") {
			const { body } = await apiFetch(
				`/groups/${report.groupId}/reports/${report.reportId}/read`,
				{ method: "POST" },
			);
			if (body?.success) {
				setReports((prev) =>
					prev.map((r) => (r.reportId === report.reportId ? body.data : r)),
				);
				setViewingReport(body.data);
			}
		}
	}

	async function handleBulkDownload(payload: {
		studentId: string;
		month: number;
		year: number;
	}) {
		const studentName =
			students.find((s) => s.studentId === payload.studentId)?.studentName ??
			payload.studentId;
		const result = await downloadFile(
			`/reports/bulk-pdf?studentId=${payload.studentId}&month=${payload.month}&year=${payload.year}`,
			`reports-${payload.year}-${String(payload.month).padStart(2, "0")}-${studentName}.pdf`,
		);
		if (result.ok) {
			toast.success("Reports downloaded.");
			return { ok: true as const };
		}
		return { ok: false as const, message: result.message };
	}

	if (loadState === "denied") {
		return (
			<section className="p-6 text-center text-stone-500">
				<p>{errorMessage}</p>
			</section>
		);
	}

	return (
		<section className="max-sm:p-3 sm:p-6">
			{isModalOpen && (
				<ReportFormModal
					initialData={null}
					groups={groups}
					onClose={() => setIsModalOpen(false)}
					onSaveDraft={(payload) => handleCreate(payload, false)}
					onSubmitReport={(payload) => handleCreate(payload, true)}
				/>
			)}
			{editingReport && (
				<ReportFormModal
					initialData={editingReport}
					groups={groups}
					onClose={() => setEditingReport(null)}
					onSaveDraft={handleEdit}
					onSubmitReport={handleSubmitFromEdit}
				/>
			)}
			{viewingReport && (
				<ViewReportModal
					report={viewingReport}
					onClose={() => setViewingReport(null)}
				/>
			)}
			{deletingReport && (
				<ConfirmDeleteModal
					onConfirm={() => handleDelete(deletingReport)}
					onClose={() => setDeletingReport(null)}
				/>
			)}
			{isBulkModalOpen && (
				<BulkDownloadModal
					students={students}
					onClose={() => setIsBulkModalOpen(false)}
					onDownload={handleBulkDownload}
				/>
			)}

			<h1 className="font-heading text-2xl font-bold text-green-800 mb-4">
				Reports
			</h1>

			{(canManage || isAdmin) && (
				<div className="flex flex-wrap justify-items-start gap-2 mb-4">
					{canManage && (
						<button
							type="button"
							disabled={groups.length === 0}
							className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => setIsModalOpen(true)}
						>
							<PlusCircle size={18} />
							Add Report
						</button>
					)}
					{isAdmin && (
						<button
							type="button"
							disabled={students.length === 0}
							className="flex font-semibold items-center gap-2 cursor-pointer text-green-700 border border-green-600 hover:bg-green-50 transition-colors rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => setIsBulkModalOpen(true)}
						>
							<FolderDown size={18} />
							Bulk Download
						</button>
					)}
				</div>
			)}

			{errorMessage && loadState === "ready" && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full min-w-180">
						<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
							<tr>
								<th className="px-4 py-3 text-left">Period</th>
								<th className="px-4 py-3 text-left">Student</th>
								<th className="px-4 py-3 text-left">Group</th>
								<th className="px-4 py-3 text-left">Subject</th>
								<th className="px-4 py-3 text-left">Score</th>
								<th className="px-4 py-3 text-left">Status</th>
								{canManage && <th className="px-4 py-3 text-left">Sent</th>}
								<th className="px-4 py-3 text-left">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{reports.length === 0 && (
								<tr>
									<td
										colSpan={canManage ? 8 : 7}
										className="px-4 py-6 text-center text-stone-400 italic"
									>
										No reports yet.
									</td>
								</tr>
							)}
							{reports.map((r) => (
								<tr key={r.reportId} className="hover:bg-green-50">
									<td className="px-4 py-3 whitespace-nowrap">
										{MONTH_NAMES[r.month - 1]} {r.year}
									</td>
									<td className="px-4 py-3">{r.studentName ?? "-"}</td>
									<td className="px-4 py-3">{r.groupName ?? "-"}</td>
									<td className="px-4 py-3">{r.subjectName ?? "-"}</td>
									<td className="px-4 py-3">
										{r.score}/{r.scoreDenominator}
									</td>
									<td className="px-4 py-3">
										<span
											className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_BADGE_CLASS[r.statusKind]}`}
										>
											{r.statusLabel}
										</span>
									</td>
									{canManage && (
										<td className="px-4 py-3">
											<input
												type="checkbox"
												className="w-4 h-4 accent-green-700 cursor-pointer"
												checked={r.isSent}
												onChange={() => handleToggleSent(r)}
											/>
										</td>
									)}
									<td className="px-4 py-3">
										<div className="flex flex-row gap-3">
											<button
												type="button"
												className="text-sky-600 hover:text-sky-700 cursor-pointer"
												onClick={() => handleView(r)}
											>
												<Eye size={16} />
											</button>
											{canManage && (
												<>
													<button
														type="button"
														className="text-green-700 hover:text-green-800 cursor-pointer"
														onClick={() => setEditingReport(r)}
													>
														<Pencil size={16} />
													</button>
													<button
														type="button"
														className="text-rose-500 hover:text-rose-600 cursor-pointer"
														onClick={() => setDeletingReport(r)}
													>
														<Ban size={16} />
													</button>
												</>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}
