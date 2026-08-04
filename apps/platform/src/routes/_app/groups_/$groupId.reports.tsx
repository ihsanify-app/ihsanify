import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Ban, Pencil, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { GroupTabs } from "../../../components/dashboard/GroupTabs";
import { apiFetch } from "../../../lib/apiClient";
import { mockUser } from "../../../lib/mockAuth";

export const Route = createFileRoute("/_app/groups_/$groupId/reports")({
	component: RouteComponent,
});

type ReportRow = {
	reportId: string;
	title: string;
	description: string;
	status: "draft" | "finished";
};

function ReportModal({
	initialData,
	onClose,
	onSubmit,
}: {
	initialData: ReportRow | null;
	onClose: () => void;
	onSubmit: (payload: {
		title: string;
		description: string;
		status: "draft" | "finished";
	}) => void;
}) {
	const [title, setTitle] = useState(initialData?.title ?? "");
	const [description, setDescription] = useState(
		initialData?.description ?? "",
	);
	const [status, setStatus] = useState<"draft" | "finished">(
		initialData?.status ?? "draft",
	);

	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-96 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-3">
					{initialData ? "Edit Report" : "Add Report"}
				</h2>
				<form>
					<div className="flex flex-col gap-2">
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							placeholder="Title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
						<textarea
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors min-h-24"
							placeholder="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={status}
							onChange={(e) =>
								setStatus(e.target.value as "draft" | "finished")
							}
						>
							<option value="draft">Draft</option>
							<option value="finished">Finished</option>
						</select>
					</div>
				</form>
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
						onClick={() => onSubmit({ title, description, status })}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
					>
						{initialData ? "Save Changes" : "Create"}
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
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-96 flex flex-col gap-4 shadow-xl"
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
	const { groupId } = useParams({
		from: "/_app/groups_/$groupId/reports",
	});
	const [loadState, setLoadState] = useState<"loading" | "ready" | "denied">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [reports, setReports] = useState<ReportRow[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingReport, setEditingReport] = useState<ReportRow | null>(null);
	const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

	const canManage = mockUser.role === "admin" || mockUser.role === "teacher";

	const loadReports = useCallback(async () => {
		const { status, body } = await apiFetch(`/groups/${groupId}/reports`);
		if (status === 401 || status === 403 || status === 404) {
			setLoadState("denied");
			setErrorMessage(body?.message ?? "Unable to load reports.");
			return;
		}
		setReports(body?.data ?? []);
		setLoadState("ready");
	}, [groupId]);

	useEffect(() => {
		loadReports();
	}, [loadReports]);

	async function handleCreate(payload: {
		title: string;
		description: string;
		status: "draft" | "finished";
	}) {
		const { body } = await apiFetch(`/groups/${groupId}/reports`, {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (body?.success) {
			setReports((prev) => [body.data, ...prev]);
			setIsModalOpen(false);
		} else {
			setErrorMessage(body?.message ?? "Could not create report.");
		}
	}

	async function handleEdit(
		reportId: string,
		payload: {
			title: string;
			description: string;
			status: "draft" | "finished";
		},
	) {
		const { body } = await apiFetch(`/groups/${groupId}/reports/${reportId}`, {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
		if (body?.success) {
			setReports((prev) =>
				prev.map((r) => (r.reportId === reportId ? body.data : r)),
			);
			setEditingReport(null);
		} else {
			setErrorMessage(body?.message ?? "Could not update report.");
		}
	}

	async function handleDelete(reportId: string) {
		const { body } = await apiFetch(`/groups/${groupId}/reports/${reportId}`, {
			method: "DELETE",
		});
		if (body?.success) {
			setReports((prev) => prev.filter((r) => r.reportId !== reportId));
			setDeletingReportId(null);
		} else {
			setErrorMessage(body?.message ?? "Could not delete report.");
		}
	}

	if (loadState === "denied") {
		return (
			<section className="p-6 text-center text-stone-500">
				<p className="mb-3">{errorMessage}</p>
				<Link to="/groups" className="text-green-700 font-semibold underline">
					Back to groups
				</Link>
			</section>
		);
	}

	return (
		<section className="p-6">
			{isModalOpen && (
				<ReportModal
					initialData={null}
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleCreate}
				/>
			)}
			{editingReport && (
				<ReportModal
					initialData={editingReport}
					onClose={() => setEditingReport(null)}
					onSubmit={(payload) => handleEdit(editingReport.reportId, payload)}
				/>
			)}
			{deletingReportId && (
				<ConfirmDeleteModal
					onConfirm={() => handleDelete(deletingReportId)}
					onClose={() => setDeletingReportId(null)}
				/>
			)}

			<GroupTabs groupId={groupId} active="reports" />

			{canManage && (
				<div className="flex justify-items-start mb-4">
					<button
						type="button"
						className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2"
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
				<table className="w-full">
					<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
						<tr>
							<th className="px-4 py-3 text-left">Title</th>
							<th className="px-4 py-3 text-left">Description</th>
							<th className="px-4 py-3 text-left">Status</th>
							{canManage && <th className="px-4 py-3 text-left">Action</th>}
						</tr>
					</thead>
					<tbody className="divide-y divide-stone-100">
						{reports.length === 0 && (
							<tr>
								<td
									colSpan={canManage ? 4 : 3}
									className="px-4 py-6 text-center text-stone-400 italic"
								>
									No reports yet.
								</td>
							</tr>
						)}
						{reports.map((r) => (
							<tr key={r.reportId} className="hover:bg-green-50">
								<td className="px-4 py-3">{r.title}</td>
								<td className="px-4 py-3 text-stone-600">{r.description}</td>
								<td className="px-4 py-3">
									<span
										className={
											r.status === "finished"
												? "bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full"
												: "bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full"
										}
									>
										{r.status === "finished" ? "Finished" : "Draft"}
									</span>
								</td>
								{canManage && (
									<td className="px-4 py-3">
										<div className="flex flex-row gap-3">
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
												onClick={() => setDeletingReportId(r.reportId)}
											>
												<Ban size={16} />
											</button>
										</div>
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
