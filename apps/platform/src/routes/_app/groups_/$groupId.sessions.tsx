import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Ban, Pencil, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { GroupTabs } from "../../../components/dashboard/GroupTabs";
import { apiFetch } from "../../../lib/apiClient";
import { authUser } from "../../../lib/auth";

export const Route = createFileRoute("/_app/groups_/$groupId/sessions")({
	component: RouteComponent,
});

type Option = { studentId: string; studentName: string };

type SessionRow = {
	sessionId: string;
	year: number;
	month: number;
	day: number;
	date: string;
	teacherName: string | null;
	subjectName: string | null;
	studentIds: Option[];
	attendanceRecorded: boolean;
	durationMinutes: number;
};

function CreateSessionModal({
	roster,
	onClose,
	onSubmit,
}: {
	roster: Option[];
	onClose: () => void;
	onSubmit: (payload: {
		date: string;
		durationMinutes: number;
		studentIds: string[];
	}) => void;
}) {
	const [date, setDate] = useState("");
	const [durationMinutes, setDurationMinutes] = useState(60);
	// Defaults to the whole roster checked, unlike EditSessionModal's
	// empty default — there, an unchecked start avoids implying "these are
	// already-confirmed attendees" for an existing session that looks like
	// it might have real saved data. A brand-new session has no such
	// look-alike risk, so defaulting to "everyone attended, uncheck absentees"
	// matches the common case and needs fewer clicks.
	const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
		roster.map((s) => s.studentId),
	);

	function toggleStudent(id: string) {
		setSelectedStudentIds((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
		);
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
						<div className="border border-stone-200 rounded-xl p-2">
							<p className="text-xs text-stone-500 mb-1">Students present</p>
							<div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
								{roster.map((s) => (
									<label
										key={s.studentId}
										className="flex items-center gap-2 text-sm cursor-pointer text-stone-600 hover:text-green-700"
									>
										<input
											type="checkbox"
											checked={selectedStudentIds.includes(s.studentId)}
											onChange={() => toggleStudent(s.studentId)}
										/>
										{s.studentName}
									</label>
								))}
							</div>
						</div>
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
						onClick={() =>
							onSubmit({
								date,
								durationMinutes,
								studentIds: selectedStudentIds,
							})
						}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

function EditSessionModal({
	session,
	roster,
	onClose,
	onSubmit,
}: {
	session: SessionRow;
	roster: Option[];
	onClose: () => void;
	onSubmit: (payload: {
		date: string;
		durationMinutes: number;
		studentIds: string[];
	}) => void;
}) {
	const [date, setDate] = useState(session.date.slice(0, 10));
	const [durationMinutes, setDurationMinutes] = useState(
		session.durationMinutes,
	);
	// Only prefill from `studentIds` once attendance has actually been saved
	// before — until then, `studentIds` is just a "whole class" placeholder,
	// not real data, so starting the checkboxes from it would make an
	// unsaved default look identical to a real save.
	const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
		session.attendanceRecorded
			? session.studentIds.map((s) => s.studentId)
			: [],
	);

	function toggleStudent(id: string) {
		setSelectedStudentIds((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
		);
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
				<h2 className="font-heading text-lg text-green-800 mb-3">
					Edit Session
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
						<div className="border border-stone-200 rounded-xl p-2">
							<p className="text-xs text-stone-500 mb-1">Students present</p>
							<div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
								{roster.map((s) => (
									<label
										key={s.studentId}
										className="flex items-center gap-2 text-sm cursor-pointer text-stone-600 hover:text-green-700"
									>
										<input
											type="checkbox"
											checked={selectedStudentIds.includes(s.studentId)}
											onChange={() => toggleStudent(s.studentId)}
										/>
										{s.studentName}
									</label>
								))}
							</div>
						</div>
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
						onClick={() =>
							onSubmit({
								date,
								durationMinutes,
								studentIds: selectedStudentIds,
							})
						}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
					>
						Save Changes
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

function RouteComponent() {
	const { groupId } = useParams({
		from: "/_app/groups_/$groupId/sessions",
	});
	const [loadState, setLoadState] = useState<"loading" | "ready" | "denied">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [sessions, setSessions] = useState<SessionRow[]>([]);
	const [roster, setRoster] = useState<Option[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSession, setEditingSession] = useState<SessionRow | null>(null);
	const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
		null,
	);

	const canManage = authUser.role === "admin" || authUser.role === "teacher";

	const loadSessions = useCallback(async () => {
		const { status, body } = await apiFetch(`/groups/${groupId}/sessions`);
		if (status === 401 || status === 403 || status === 404) {
			setLoadState("denied");
			setErrorMessage(body?.message ?? "Unable to load sessions.");
			return;
		}
		setSessions(body?.data ?? []);
		setRoster(body?.roster ?? []);
		setLoadState("ready");
	}, [groupId]);

	useEffect(() => {
		loadSessions();
	}, [loadSessions]);

	async function handleCreate(payload: {
		date: string;
		durationMinutes: number;
		studentIds: string[];
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

	async function handleEdit(
		sessionId: string,
		payload: {
			date: string;
			durationMinutes: number;
			studentIds: string[];
		},
	) {
		const { body } = await apiFetch(
			`/groups/${groupId}/sessions/${sessionId}`,
			{
				method: "PATCH",
				body: JSON.stringify(payload),
			},
		);
		if (body?.success) {
			setSessions((prev) =>
				prev.map((s) => (s.sessionId === sessionId ? body.data : s)),
			);
			setEditingSession(null);
		} else {
			setErrorMessage(body?.message ?? "Could not update session.");
		}
	}

	async function handleDelete(sessionId: string) {
		const { body } = await apiFetch(
			`/groups/${groupId}/sessions/${sessionId}`,
			{
				method: "DELETE",
			},
		);
		if (body?.success) {
			setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
			setDeletingSessionId(null);
		} else {
			setErrorMessage(body?.message ?? "Could not delete session.");
		}
	}

	if (loadState === "denied") {
		return (
			<section className="max-sm:p-3 sm:p-6 text-center text-stone-500">
				<p className="mb-3">{errorMessage}</p>
				<Link to="/groups" className="text-green-700 font-semibold underline">
					Back to groups
				</Link>
			</section>
		);
	}

	return (
		<section className="max-sm:p-3 sm:p-6">
			{isModalOpen && (
				<CreateSessionModal
					roster={roster}
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleCreate}
				/>
			)}
			{editingSession && (
				<EditSessionModal
					session={editingSession}
					roster={roster}
					onClose={() => setEditingSession(null)}
					onSubmit={(payload) => handleEdit(editingSession.sessionId, payload)}
				/>
			)}
			{deletingSessionId && (
				<ConfirmDeleteModal
					onConfirm={() => handleDelete(deletingSessionId)}
					onClose={() => setDeletingSessionId(null)}
				/>
			)}
			<GroupTabs groupId={groupId} active="sessions" />

			{canManage && (
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

			<div className="overflow-x-auto">
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
								<th className="px-4 py-3 text-left">Attendance</th>
								<th className="px-4 py-3 text-left">Duration</th>
								{canManage && <th className="px-4 py-3 text-left">Action</th>}
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{sessions.length === 0 && (
								<tr>
									<td
										colSpan={canManage ? 9 : 8}
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
												s.attendanceRecorded
													? "bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full"
													: "bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full"
											}
										>
											{s.attendanceRecorded ? "Recorded" : "Pending"}
										</span>
									</td>
									<td className="px-4 py-3">{s.durationMinutes} min</td>
									{canManage && (
										<td className="px-4 py-3">
											<div className="flex flex-row gap-3">
												<button
													type="button"
													className="text-green-700 hover:text-green-800 cursor-pointer"
													onClick={() => setEditingSession(s)}
												>
													<Pencil size={16} />
												</button>
												<button
													type="button"
													className="text-rose-500 hover:text-rose-600 cursor-pointer"
													onClick={() => setDeletingSessionId(s.sessionId)}
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
			</div>
		</section>
	);
}
