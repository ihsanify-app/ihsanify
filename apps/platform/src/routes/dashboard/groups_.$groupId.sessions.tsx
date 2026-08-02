import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { mockUser } from "../../lib/mockAuth";

export const Route = createFileRoute("/dashboard/groups_/$groupId/sessions")({
	component: RouteComponent,
});

type SessionRow = {
	sessionId: string;
	year: number;
	month: number;
	day: number;
	teacherName: string | null;
	subjectName: string | null;
	studentIds: { studentId: string; studentName: string }[];
	status: "draft" | "finished";
	durationMinutes: number;
};

function CreateSessionModal({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (payload: {
		date: string;
		durationMinutes: number;
		status: "draft" | "finished";
	}) => void;
}) {
	const [date, setDate] = useState("");
	const [durationMinutes, setDurationMinutes] = useState(60);
	const [status, setStatus] = useState<"draft" | "finished">("draft");

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
					Log Session
				</h2>
				<form>
					<div className="flex flex-col gap-2">
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							type="number"
							min={1}
							placeholder="Duration (minutes)"
							value={durationMinutes}
							onChange={(e) => setDurationMinutes(Number(e.target.value))}
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
						onClick={() => onSubmit({ date, durationMinutes, status })}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const { groupId } = useParams({
		from: "/dashboard/groups_/$groupId/sessions",
	});
	const [loadState, setLoadState] = useState<"loading" | "ready" | "denied">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [sessions, setSessions] = useState<SessionRow[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const loadSessions = useCallback(async () => {
		const { status, body } = await apiFetch(`/groups/${groupId}/sessions`);
		if (status === 401 || status === 403 || status === 404) {
			setLoadState("denied");
			setErrorMessage(body?.message ?? "Unable to load sessions.");
			return;
		}
		setSessions(body?.data ?? []);
		setLoadState("ready");
	}, [groupId]);

	useEffect(() => {
		loadSessions();
	}, [loadSessions]);

	async function handleCreate(payload: {
		date: string;
		durationMinutes: number;
		status: "draft" | "finished";
	}) {
		const { body } = await apiFetch(`/groups/${groupId}/sessions`, {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (body?.success) {
			setIsModalOpen(false);
			loadSessions();
		} else {
			setErrorMessage(body?.message ?? "Could not create session.");
		}
	}

	if (loadState === "denied") {
		return (
			<section className="p-6 text-center text-stone-500">
				<p className="mb-3">{errorMessage}</p>
				<Link
					to="/dashboard/groups"
					className="text-green-700 font-semibold underline"
				>
					Back to groups
				</Link>
			</section>
		);
	}

	return (
		<section className="p-6">
			{isModalOpen && (
				<CreateSessionModal
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleCreate}
				/>
			)}
			<div className="flex items-center gap-3 mb-4">
				<Link
					to="/dashboard/groups"
					className="text-stone-500 hover:text-green-700 transition-colors"
				>
					<ArrowLeft size={20} />
				</Link>
				<h1 className="font-heading text-2xl font-bold text-green-800">
					Sessions
				</h1>
			</div>

			{(mockUser.role === "admin" || mockUser.role === "teacher") && (
				<div className="flex justify-items-start mb-4">
					<button
						type="button"
						className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2"
						onClick={() => setIsModalOpen(true)}
					>
						<PlusCircle size={18} />
						Log Session
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
							<th className="px-4 py-3 text-left">Year</th>
							<th className="px-4 py-3 text-left">Month</th>
							<th className="px-4 py-3 text-left">Day</th>
							<th className="px-4 py-3 text-left">Teacher</th>
							<th className="px-4 py-3 text-left">Students</th>
							<th className="px-4 py-3 text-left">Subject</th>
							<th className="px-4 py-3 text-left">Status</th>
							<th className="px-4 py-3 text-left">Duration</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-stone-100">
						{sessions.length === 0 && (
							<tr>
								<td
									colSpan={8}
									className="px-4 py-6 text-center text-stone-400 italic"
								>
									No sessions logged yet.
								</td>
							</tr>
						)}
						{sessions.map((s) => (
							<tr key={s.sessionId} className="hover:bg-green-50">
								<td className="px-4 py-3">{s.year}</td>
								<td className="px-4 py-3">{s.month}</td>
								<td className="px-4 py-3">{s.day}</td>
								<td className="px-4 py-3">{s.teacherName ?? "-"}</td>
								<td className="px-4 py-3">
									{s.studentIds.map((st) => st.studentName).join(", ") || "-"}
								</td>
								<td className="px-4 py-3">{s.subjectName ?? "-"}</td>
								<td className="px-4 py-3">
									<span
										className={
											s.status === "finished"
												? "bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full"
												: "bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full"
										}
									>
										{s.status === "finished" ? "Finished" : "Draft"}
									</span>
								</td>
								<td className="px-4 py-3">{s.durationMinutes} min</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
