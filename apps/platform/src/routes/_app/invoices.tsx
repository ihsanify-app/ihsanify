import { createFileRoute } from "@tanstack/react-router";
import { Ban, Download, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, downloadFile } from "../../lib/apiClient";
import { mockUser } from "../../lib/mockAuth";

export const Route = createFileRoute("/_app/invoices")({
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

type StudentOption = { studentId: string; studentName: string };

type GroupOption = {
	groupId: string;
	groupName: string;
	subjectName: string | null;
	studentIds: { studentId: string; studentName: string }[];
};

type InvoiceSession = {
	sessionId: string;
	date: string;
	durationMinutes: number;
};

type InvoiceLine = {
	invoiceLineId: string;
	groupId: string;
	groupName: string | null;
	subjectName: string | null;
	teacherId: string;
	teacherName: string | null;
	price: number;
	sessions: InvoiceSession[];
};

type InvoiceRow = {
	invoiceId: string;
	studentId: string;
	studentName: string | null;
	month: number;
	year: number;
	sent: boolean;
	lines: InvoiceLine[];
	totalPrice: number;
	createdAt: string;
};

function formatPrice(price: number) {
	return `Rp ${price.toLocaleString("id-ID")}`;
}

function CreateInvoiceModal({
	students,
	groups,
	onClose,
	onPublish,
}: {
	students: StudentOption[];
	groups: GroupOption[];
	onClose: () => void;
	onPublish: (payload: {
		studentId: string;
		month: number;
		year: number;
		lines: { groupId: string; price: number }[];
	}) => Promise<boolean>;
}) {
	const now = new Date();
	const [studentId, setStudentId] = useState(students[0]?.studentId ?? "");
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
	const [prices, setPrices] = useState<Record<string, number>>({});
	const [sessionCounts, setSessionCounts] = useState<Record<string, number>>(
		{},
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [isPublishing, setIsPublishing] = useState(false);

	const studentGroups = groups.filter((g) =>
		g.studentIds.some((s) => s.studentId === studentId),
	);

	function toggleGroup(groupId: string) {
		setSelectedGroupIds((prev) =>
			prev.includes(groupId)
				? prev.filter((id) => id !== groupId)
				: [...prev, groupId],
		);
	}

	// Recompute each selected group's attended-session count for this
	// student/period whenever the relevant inputs change — purely for
	// display before publishing; the server independently recomputes the
	// authoritative count when the invoice is actually created.
	useEffect(() => {
		if (selectedGroupIds.length === 0) return;
		let cancelled = false;
		Promise.all(
			selectedGroupIds.map(async (groupId) => {
				const { body } = await apiFetch(`/groups/${groupId}/sessions`);
				const sessions: {
					month: number;
					year: number;
					attendanceRecorded: boolean;
					studentIds: { studentId: string }[];
				}[] = body?.data ?? [];
				const count = sessions.filter(
					(s) =>
						s.month === month &&
						s.year === year &&
						s.attendanceRecorded &&
						s.studentIds.some((st) => st.studentId === studentId),
				).length;
				return [groupId, count] as const;
			}),
		).then((results) => {
			if (cancelled) return;
			setSessionCounts((prev) => ({ ...prev, ...Object.fromEntries(results) }));
		});
		return () => {
			cancelled = true;
		};
	}, [selectedGroupIds, month, year, studentId]);

	async function handlePublish() {
		setErrorMessage("");
		if (selectedGroupIds.length === 0) {
			setErrorMessage("Select at least one group.");
			return;
		}
		setIsPublishing(true);
		const ok = await onPublish({
			studentId,
			month,
			year,
			lines: selectedGroupIds.map((groupId) => ({
				groupId,
				price: prices[groupId] ?? 0,
			})),
		});
		setIsPublishing(false);
		if (!ok) {
			setErrorMessage("Could not publish invoice.");
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
				className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-3">
					Add Invoice
				</h2>
				<div className="overflow-y-auto pr-1">
					<form>
						<div className="flex flex-col gap-2">
							<label className="text-xs font-normal text-stone-500">
								Student
								<select
									className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
									value={studentId}
									onChange={(e) => {
										setStudentId(e.target.value);
										setSelectedGroupIds([]);
										setPrices({});
									}}
								>
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

							<div className="border border-stone-200 rounded-xl p-2">
								<p className="text-xs text-stone-500 mb-1">Groups</p>
								{studentGroups.length === 0 ? (
									<p className="text-sm text-stone-400 italic">
										This student isn't enrolled in any group.
									</p>
								) : (
									<div className="flex flex-col gap-1">
										{studentGroups.map((g) => (
											<label
												key={g.groupId}
												className="flex items-center gap-2 text-sm cursor-pointer text-stone-600 hover:text-green-700"
											>
												<input
													type="checkbox"
													checked={selectedGroupIds.includes(g.groupId)}
													onChange={() => toggleGroup(g.groupId)}
												/>
												{g.groupName} ({g.subjectName ?? "No subject"})
											</label>
										))}
									</div>
								)}
							</div>

							{selectedGroupIds.length > 0 && (
								<div className="border border-stone-200 rounded-xl p-2">
									<p className="text-xs text-stone-500 mb-2">Price per group</p>
									<div className="flex flex-col gap-2">
										{selectedGroupIds.map((groupId) => {
											const group = groups.find((g) => g.groupId === groupId);
											return (
												<div
													key={groupId}
													className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
												>
													<span className="text-stone-700">
														{group?.groupName ?? groupId}
														<span className="text-stone-400">
															{" "}
															({sessionCounts[groupId] ?? 0} sessions)
														</span>
													</span>
													<input
														type="number"
														min={0}
														className="w-full sm:w-32 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
														value={prices[groupId] ?? 0}
														onChange={(e) =>
															setPrices((prev) => ({
																...prev,
																[groupId]: Number(e.target.value),
															}))
														}
													/>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</div>
					</form>
				</div>
				{errorMessage && (
					<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mt-3 shrink-0">
						{errorMessage}
					</p>
				)}
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
						disabled={!studentId || isPublishing}
						onClick={handlePublish}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isPublishing ? "Publishing…" : "Publish Invoice"}
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
				className="bg-white rounded-2xl p-6 w-[90vw] max-w-sm flex flex-col gap-4 shadow-xl"
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

function RouteComponent() {
	const [loadState, setLoadState] = useState<"loading" | "ready" | "denied">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
	const [students, setStudents] = useState<StudentOption[]>([]);
	const [groups, setGroups] = useState<GroupOption[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(
		null,
	);

	const isAdmin = mockUser.role === "admin";

	useEffect(() => {
		apiFetch("/invoices").then(({ status, body }) => {
			if (status === 401 || status === 403) {
				setLoadState("denied");
				setErrorMessage(body?.message ?? "Unable to load invoices.");
				return;
			}
			setInvoices(body?.data ?? []);
			setLoadState("ready");
		});

		if (isAdmin) {
			apiFetch("/students").then(({ body }) => {
				setStudents(body?.data ?? []);
			});
			apiFetch("/groups").then(({ body }) => {
				setGroups(body?.data ?? []);
			});
		}
	}, [isAdmin]);

	async function handlePublish(payload: {
		studentId: string;
		month: number;
		year: number;
		lines: { groupId: string; price: number }[];
	}) {
		const { body } = await apiFetch("/invoices", {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (body?.success) {
			setInvoices((prev) => [body.data, ...prev]);
			setIsModalOpen(false);
			return true;
		}
		setErrorMessage(body?.message ?? "Could not publish invoice.");
		return false;
	}

	async function handleDownload(invoice: InvoiceRow) {
		const result = await downloadFile(
			`/invoices/${invoice.invoiceId}/pdf`,
			`invoice-${invoice.year}-${String(invoice.month).padStart(2, "0")}-${invoice.studentName ?? invoice.invoiceId}.pdf`,
		);
		if (!result.ok) {
			setErrorMessage(result.message ?? "Could not download invoice PDF.");
		}
	}

	async function handleToggleSent(invoiceId: string, sent: boolean) {
		const { body } = await apiFetch(`/invoices/${invoiceId}`, {
			method: "PATCH",
			body: JSON.stringify({ sent }),
		});
		if (body?.success) {
			setInvoices((prev) =>
				prev.map((i) => (i.invoiceId === invoiceId ? body.data : i)),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update invoice.");
		}
	}

	async function handleDelete(invoiceId: string) {
		const { body } = await apiFetch(`/invoices/${invoiceId}`, {
			method: "DELETE",
		});
		if (body?.success) {
			setInvoices((prev) => prev.filter((i) => i.invoiceId !== invoiceId));
			setDeletingInvoiceId(null);
		} else {
			setErrorMessage(body?.message ?? "Could not delete invoice.");
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
				<CreateInvoiceModal
					students={students}
					groups={groups}
					onClose={() => setIsModalOpen(false)}
					onPublish={handlePublish}
				/>
			)}
			{deletingInvoiceId && (
				<ConfirmDeleteModal
					onConfirm={() => handleDelete(deletingInvoiceId)}
					onClose={() => setDeletingInvoiceId(null)}
				/>
			)}

			<h1 className="font-heading text-2xl font-bold text-green-800 mb-4">
				Invoices
			</h1>

			{isAdmin && (
				<div className="flex justify-items-start mb-4">
					<button
						type="button"
						className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2"
						onClick={() => setIsModalOpen(true)}
					>
						<PlusCircle size={18} />
						Add Invoice
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
								<th className="px-4 py-3 text-left">Groups</th>
								<th className="px-4 py-3 text-left">Total</th>
								<th className="px-4 py-3 text-left">Sent</th>
								<th className="px-4 py-3 text-left">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{invoices.length === 0 && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-6 text-center text-stone-400 italic"
									>
										No invoices yet.
									</td>
								</tr>
							)}
							{invoices.map((i) => (
								<tr key={i.invoiceId} className="hover:bg-green-50">
									<td className="px-4 py-3 whitespace-nowrap">
										{MONTH_NAMES[i.month - 1]} {i.year}
									</td>
									<td className="px-4 py-3">{i.studentName ?? "-"}</td>
									<td className="px-4 py-3">
										<div className="flex flex-col gap-0.5">
											{i.lines.map((line) => (
												<span
													key={line.invoiceLineId}
													className="text-xs whitespace-nowrap"
												>
													{line.groupName ?? "-"} ({line.sessions.length}{" "}
													{line.sessions.length === 1 ? "session" : "sessions"})
													— {formatPrice(line.price)}
												</span>
											))}
										</div>
									</td>
									<td className="px-4 py-3 font-semibold whitespace-nowrap">
										{formatPrice(i.totalPrice)}
									</td>
									<td className="px-4 py-3">
										<input
											type="checkbox"
											checked={i.sent}
											disabled={!isAdmin}
											onChange={(e) =>
												handleToggleSent(i.invoiceId, e.target.checked)
											}
											className={isAdmin ? "cursor-pointer" : ""}
										/>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-row gap-3">
											<button
												type="button"
												className="text-green-700 hover:text-green-800 cursor-pointer"
												onClick={() => handleDownload(i)}
											>
												<Download size={16} />
											</button>
											{isAdmin && (
												<button
													type="button"
													className="text-rose-500 hover:text-rose-600 cursor-pointer"
													onClick={() => setDeletingInvoiceId(i.invoiceId)}
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
		</section>
	);
}
