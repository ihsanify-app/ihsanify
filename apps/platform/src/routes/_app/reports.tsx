import { createFileRoute } from "@tanstack/react-router";
import { Download, Eye, Pencil, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
	const [score, setScore] = useState(initialData?.score ?? 0);

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

	const payload = { groupId, studentId, month, year, progress, advice, score };

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
				className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
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
						<div className="flex flex-col sm:flex-row gap-2 text-xs font-normal text-stone-500">
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
							/>
							<textarea
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors min-h-32"
								placeholder="Advice"
								value={advice}
								onChange={(e) => setAdvice(e.target.value)}
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
									onChange={(e) => setScore(Number(e.target.value))}
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
	const [downloadError, setDownloadError] = useState("");

	async function handleDownload() {
		setDownloadError("");
		const result = await downloadFile(
			`/groups/${report.groupId}/reports/${report.reportId}/pdf`,
			`report-${report.year}-${String(report.month).padStart(2, "0")}-${report.studentName ?? report.reportId}.pdf`,
		);
		if (!result.ok) {
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
				className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
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

function RouteComponent() {
	const [loadState, setLoadState] = useState<"loading" | "ready" | "denied">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [reports, setReports] = useState<ReportRow[]>([]);
	const [groups, setGroups] = useState<GroupOption[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingReport, setEditingReport] = useState<ReportRow | null>(null);
	const [viewingReport, setViewingReport] = useState<ReportRow | null>(null);

	const canManage = mockUser.role === "admin" || mockUser.role === "teacher";

	const load = useCallback(async () => {
		const [reportsRes, groupsRes] = await Promise.all([
			apiFetch("/reports"),
			canManage
				? apiFetch("/groups")
				: Promise.resolve({ status: 200, body: null }),
		]);
		if (reportsRes.status === 401 || reportsRes.status === 403) {
			setLoadState("denied");
			setErrorMessage(reportsRes.body?.message ?? "Unable to load reports.");
			return;
		}
		setReports(reportsRes.body?.data ?? []);
		setGroups(groupsRes.body?.data ?? []);
		setLoadState("ready");
	}, [canManage]);

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

	if (loadState === "denied") {
		return (
			<section className="p-6 text-center text-stone-500">
				<p>{errorMessage}</p>
			</section>
		);
	}

	return (
		<section className="p-3 sm:p-6">
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

			<h1 className="font-heading text-2xl font-bold text-green-800 mb-4">
				Reports
			</h1>

			{canManage && (
				<div className="flex justify-items-start mb-4">
					<button
						type="button"
						disabled={groups.length === 0}
						className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={() => setIsModalOpen(true)}
					>
						<PlusCircle size={18} />
						Add Report
					</button>
				</div>
			)}

			{errorMessage && loadState === "ready" && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
							<tr>
								<th className="px-4 py-3 text-left">Period</th>
								<th className="px-4 py-3 text-left">Student</th>
								<th className="px-4 py-3 text-left">Group</th>
								<th className="px-4 py-3 text-left">Subject</th>
								<th className="px-4 py-3 text-left">Score</th>
								<th className="px-4 py-3 text-left">Status</th>
								<th className="px-4 py-3 text-left">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{reports.length === 0 && (
								<tr>
									<td
										colSpan={7}
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
												<button
													type="button"
													className="text-green-700 hover:text-green-800 cursor-pointer"
													onClick={() => setEditingReport(r)}
												>
													<Pencil size={16} />
												</button>
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
