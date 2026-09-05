import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Ban,
	Download,
	Eye,
	PlusCircle,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { apiFetch, downloadFile } from "../../lib/apiClient";
import { authUser } from "../../lib/auth";

export const Route = createFileRoute("/_app/payroll")({
	component: RouteComponent,
});

const MONTHS = [
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

function formatIDR(n: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(n);
}

type PeriodStats = {
	totalRevenue: number;
	totalCost: number;
	totalProfit: number;
	totalGroup: number;
};

type PayslipSummary = {
	payslipId: string;
	teacherId: string;
	teacherName: string;
	totalProfit: number;
	totalCost: number;
	lineCount: number;
};

type PreviewStudent = {
	studentId: string;
	studentName: string;
	sessionsAttended: number;
	sessionsTotal: number;
};

type PreviewGroup = {
	groupId: string;
	groupName: string;
	groupType: string;
	teacherRate: number | null;
	students: PreviewStudent[];
};

type Teacher = { teacherId: string; teacherName: string };

function CreatePayslipModal({
	month,
	year,
	onClose,
	onCreated,
}: {
	month: number;
	year: number;
	onClose: () => void;
	onCreated: () => void;
}) {
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [teacherId, setTeacherId] = useState("");
	const [groups, setGroups] = useState<PreviewGroup[] | null>(null);
	const [existingPayslipId, setExistingPayslipId] = useState<string | null>(
		null,
	);
	const [prices, setPrices] = useState<Record<string, string>>({});
	const [errorMessage, setErrorMessage] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		apiFetch("/teachers").then(({ status, body }) => {
			if (status === 200) setTeachers(body?.data ?? []);
		});
	}, []);

	useEffect(() => {
		if (!teacherId) {
			setGroups(null);
			return;
		}
		setGroups(null);
		setPrices({});
		setErrorMessage("");
		apiFetch(
			`/payroll/create-payslip-data?teacherId=${teacherId}&month=${month}&year=${year}`,
		).then(({ status, body }) => {
			if (status !== 200) return;
			setGroups(body?.data?.groups ?? []);
			setExistingPayslipId(body?.data?.existingPayslipId ?? null);
		});
	}, [teacherId, month, year]);

	function priceKey(groupId: string, studentId: string) {
		return `${groupId}:${studentId}`;
	}

	async function handleSubmit() {
		if (!groups) return;
		const lines = groups.flatMap((g) =>
			g.students.map((s) => ({
				groupId: g.groupId,
				studentId: s.studentId,
				price: Number(prices[priceKey(g.groupId, s.studentId)] || 0),
			})),
		);
		setIsSaving(true);
		const { status, body } = await apiFetch("/payroll/payslips", {
			method: "POST",
			body: JSON.stringify({ teacherId, month, year, lines }),
		});
		setIsSaving(false);
		if (status === 201) {
			onCreated();
		} else {
			setErrorMessage(body?.message ?? "Could not create payslip.");
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
				className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-3">
					Create Payslip — {MONTHS[month - 1]} {year}
				</h2>

				<select
					className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
					value={teacherId}
					onChange={(e) => setTeacherId(e.target.value)}
				>
					<option value="">Select a teacher…</option>
					{teachers.map((t) => (
						<option key={t.teacherId} value={t.teacherId}>
							{t.teacherName}
						</option>
					))}
				</select>

				{errorMessage && (
					<p className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
						{errorMessage}
					</p>
				)}

				{existingPayslipId && (
					<p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
						A payslip already exists for this teacher in this period.
					</p>
				)}

				{teacherId && groups === null && !existingPayslipId && (
					<p className="mt-4 text-sm text-stone-400">Loading roster…</p>
				)}

				{groups && !existingPayslipId && (
					<div className="mt-4 flex flex-col gap-4">
						{groups.length === 0 && (
							<p className="text-sm text-stone-400 italic">
								This teacher has no assigned groups for this period.
							</p>
						)}
						{groups.map((group) => (
							<div
								key={group.groupId}
								className="rounded-xl border border-stone-200 p-3"
							>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<span className="font-semibold text-stone-800">
										{group.groupName}
									</span>
									<span className="text-xs text-stone-500 capitalize">
										{group.groupType.replace("_", "-")} · rate{" "}
										{group.teacherRate !== null ? (
											formatIDR(group.teacherRate)
										) : (
											<span className="text-rose-600">not set</span>
										)}
									</span>
								</div>
								<div className="mt-2 flex flex-col gap-2">
									{group.students.map((student) => (
										<div
											key={student.studentId}
											className="flex items-center justify-between gap-3 text-sm"
										>
											<span className="text-stone-700">
												{student.studentName}{" "}
												<span className="text-stone-400">
													({student.sessionsAttended}/{student.sessionsTotal}{" "}
													sessions)
												</span>
											</span>
											<input
												type="number"
												min={0}
												placeholder="Price (IDR)"
												className="w-36 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
												value={
													prices[priceKey(group.groupId, student.studentId)] ??
													""
												}
												onChange={(e) =>
													setPrices((prev) => ({
														...prev,
														[priceKey(group.groupId, student.studentId)]:
															e.target.value,
													}))
												}
											/>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
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
						disabled={
							!groups || groups.length === 0 || !!existingPayslipId || isSaving
						}
						onClick={handleSubmit}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSaving ? "Saving…" : "Create Payslip"}
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
					Delete this payslip? This can't be undone.
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

function RouteComponent() {
	const toast = useToast();
	const now = new Date();
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [stats, setStats] = useState<PeriodStats | null>(null);
	const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState("");

	async function loadPeriod() {
		// Admin-only aggregate; teachers would just get a 403, so skip it.
		const statsPromise =
			authUser.role === "admin"
				? apiFetch(`/payroll?month=${month}&year=${year}`)
				: null;
		const [statsRes, payslipsRes] = await Promise.all([
			statsPromise,
			apiFetch(`/payroll/payslips?month=${month}&year=${year}`),
		]);
		if (payslipsRes.status === 401 || payslipsRes.status === 403) {
			setLoadState("unauthorized");
			return;
		}
		setStats(statsRes?.body?.data ?? null);
		setPayslips(payslipsRes.body?.data ?? []);
		setLoadState("ready");
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: loadPeriod is stable per render and only needs to re-run when the period changes
	useEffect(() => {
		loadPeriod();
	}, [month, year]);

	async function handleDownload(payslip: PayslipSummary) {
		const result = await downloadFile(
			`/payroll/payslips/${payslip.payslipId}/pdf`,
			`payslip-${year}-${String(month).padStart(2, "0")}-${payslip.teacherName}.pdf`,
		);
		if (result.ok) {
			toast.success("Payslip PDF downloaded.");
		} else {
			setErrorMessage(result.message ?? "Could not download payslip PDF.");
		}
	}

	async function handleDelete(id: string) {
		const { body } = await apiFetch(`/payroll/payslips/${id}`, {
			method: "DELETE",
		});
		if (body?.success) {
			setDeletingId(null);
			loadPeriod();
		}
	}

	if (loadState === "unauthorized") {
		return (
			<section className="max-sm:p-3 sm:p-6 text-center text-stone-500">
				<p className="mb-3">You need to log in to view this page.</p>
				<Link to="/login" className="text-green-700 font-semibold underline">
					Go to login
				</Link>
			</section>
		);
	}

	return (
		<section className="max-sm:p-3 sm:p-6">
			{isModalOpen && (
				<CreatePayslipModal
					month={month}
					year={year}
					onClose={() => setIsModalOpen(false)}
					onCreated={() => {
						setIsModalOpen(false);
						loadPeriod();
					}}
				/>
			)}
			{deletingId && (
				<ConfirmDeleteModal
					onConfirm={() => handleDelete(deletingId)}
					onClose={() => setDeletingId(null)}
				/>
			)}

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			<div className="flex max-sm:flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
				<h1 className="font-heading text-2xl font-bold text-green-800">
					Payroll
				</h1>
				<div className="flex items-center gap-2">
					<select
						className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
						value={month}
						onChange={(e) => setMonth(Number(e.target.value))}
					>
						{MONTHS.map((m, i) => (
							<option key={m} value={i + 1}>
								{m}
							</option>
						))}
					</select>
					<select
						className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
						value={year}
						onChange={(e) => setYear(Number(e.target.value))}
					>
						{Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(
							(y) => (
								<option key={y} value={y}>
									{y}
								</option>
							),
						)}
					</select>
				</div>
			</div>

			{loadState === "loading" ? (
				<p className="text-stone-400">Loading…</p>
			) : (
				<>
					{authUser.role === "admin" && (
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
							<div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
								<div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wide">
									<TrendingUp size={14} />
									Total Revenue
								</div>
								<p className="mt-1 font-heading text-xl font-bold text-green-800">
									{formatIDR(stats?.totalRevenue ?? 0)}
								</p>
							</div>
							<div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
								<div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wide">
									<Wallet size={14} />
									Total Cost
								</div>
								<p className="mt-1 font-heading text-xl font-bold text-stone-800">
									{formatIDR(stats?.totalCost ?? 0)}
								</p>
							</div>
							<div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
								<div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wide">
									<TrendingUp size={14} />
									Total Profit
								</div>
								<p className="mt-1 font-heading text-xl font-bold text-stone-800">
									{formatIDR(stats?.totalProfit ?? 0)}
								</p>
							</div>
							<div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
								<div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wide">
									<Users size={14} />
									Total Group
								</div>
								<p className="mt-1 font-heading text-xl font-bold text-stone-800">
									{stats?.totalGroup ?? 0}
								</p>
							</div>
						</div>
					)}

					<div className="flex items-center justify-between mb-3">
						<h2 className="font-heading text-lg font-bold text-green-800">
							Payslips
						</h2>
						{authUser.role === "admin" && (
							<button
								type="button"
								className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2"
								onClick={() => setIsModalOpen(true)}
							>
								<PlusCircle size={18} />
								Create Payslip
							</button>
						)}
					</div>

					<div className="overflow-x-auto">
						<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm">
							<table className="w-full">
								<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
									<tr>
										<th className="px-4 py-3 text-left">Teacher</th>
										<th className="px-4 py-3 text-left">Groups/Students</th>
										{authUser.role === "admin" && (
											<th className="px-4 py-3 text-left">Profit</th>
										)}
										<th className="px-4 py-3 text-left">
											{authUser.role === "admin" ? "Cost" : "Total Pay"}
										</th>
										<th className="px-4 py-3 text-left">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-100">
									{payslips.length === 0 && (
										<tr>
											<td
												colSpan={authUser.role === "admin" ? 5 : 4}
												className="px-4 py-6 text-center text-stone-400 italic"
											>
												No payslips created for this period yet.
											</td>
										</tr>
									)}
									{payslips.map((p) => (
										<tr key={p.payslipId} className="hover:bg-green-50">
											<td className="px-4 py-3">{p.teacherName}</td>
											<td className="px-4 py-3">{p.lineCount}</td>
											{authUser.role === "admin" && (
												<td className="px-4 py-3">
													{formatIDR(p.totalProfit)}
												</td>
											)}
											<td className="px-4 py-3">{formatIDR(p.totalCost)}</td>
											<td className="px-4 py-3">
												<div className="flex flex-row gap-3">
													<Link
														to="/payroll/$payslipId"
														params={{ payslipId: p.payslipId }}
														className="flex items-center gap-1 text-sky-600 hover:text-sky-700 cursor-pointer"
													>
														<Eye size={16} />
													</Link>
													<button
														type="button"
														className="text-green-700 hover:text-green-800 cursor-pointer"
														onClick={() => handleDownload(p)}
													>
														<Download size={16} />
													</button>
													{authUser.role === "admin" && (
														<button
															type="button"
															className="text-rose-500 hover:text-rose-600 cursor-pointer"
															onClick={() => setDeletingId(p.payslipId)}
														>
															<Ban size={16} />
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
				</>
			)}
		</section>
	);
}
