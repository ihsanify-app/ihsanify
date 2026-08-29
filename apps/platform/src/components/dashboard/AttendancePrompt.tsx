import { AlertTriangle, BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { mockUser } from "../../lib/mockAuth";
import {
	DEFAULT_BLOCK_MINUTES,
	findTodaysStartedSession,
	formatTime,
	type GroupWithSchedule,
	isSameDay,
} from "../../lib/plannedSessions";

type Status = "checking" | "idle" | "saving" | "recorded" | "error";

export function AttendancePrompt({ groups }: { groups: GroupWithSchedule[] }) {
	const [now, setNow] = useState(new Date());
	const [status, setStatus] = useState<Status>("checking");
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 30_000);
		return () => clearInterval(interval);
	}, []);

	const target = findTodaysStartedSession(groups, now);
	const targetGroupId = target?.groupId ?? null;

	useEffect(() => {
		if (!targetGroupId) {
			setStatus("idle");
			setSessionId(null);
			return;
		}
		let cancelled = false;
		setStatus("checking");
		apiFetch(`/groups/${targetGroupId}/sessions`).then(
			({ status: httpStatus, body }) => {
				if (cancelled) return;
				if (httpStatus !== 200) {
					setErrorMessage("Couldn't check today's attendance status.");
					setStatus("error");
					return;
				}
				const sessions = (body?.data ?? []) as {
					sessionId: string;
					date: string;
					attendanceRecorded: boolean;
				}[];
				const today = new Date();
				const todays = sessions.find((s) => isSameDay(new Date(s.date), today));
				setSessionId(todays?.sessionId ?? null);
				setStatus(todays?.attendanceRecorded ? "recorded" : "idle");
			},
		);
		return () => {
			cancelled = true;
		};
	}, [targetGroupId]);

	if (mockUser.role === "student" || !target) return null;

	async function handleRecordAttendance() {
		if (!target) return;
		setStatus("saving");
		setErrorMessage("");
		try {
			let id = sessionId;
			if (!id) {
				const { status: httpStatus, body } = await apiFetch(
					`/groups/${target.groupId}/sessions`,
					{
						method: "POST",
						body: JSON.stringify({
							date: now.toISOString(),
							durationMinutes: DEFAULT_BLOCK_MINUTES,
						}),
					},
				);
				if (httpStatus !== 201 || !body?.data?.sessionId) {
					throw new Error("Failed to create session");
				}
				id = body.data.sessionId;
			}
			const { status: patchStatus } = await apiFetch(
				`/groups/${target.groupId}/sessions/${id}`,
				{
					method: "PATCH",
					body: JSON.stringify({
						studentIds: target.studentIds.map((s) => s.studentId),
					}),
				},
			);
			if (patchStatus !== 200) throw new Error("Failed to record attendance");
			setSessionId(id);
			setStatus("recorded");
			setShowConfirmation(true);
		} catch {
			setErrorMessage("Couldn't save attendance. Please try again.");
			setStatus("error");
		}
	}

	return (
		<>
			{status === "recorded" ? (
				<div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
					<CheckCircle2 className="shrink-0 text-green-600" size={22} />
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-green-800">
							Attendance recorded
						</p>
						<p className="truncate text-xs text-green-700/80">
							{target.groupName}
						</p>
					</div>
				</div>
			) : status === "error" ? (
				<div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
					<AlertTriangle className="shrink-0 text-rose-600" size={22} />
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold text-rose-800">
							{errorMessage || "Something went wrong."}
						</p>
						<p className="truncate text-xs text-rose-700/80">
							{target.groupName}
						</p>
					</div>
					<button
						type="button"
						onClick={() => setStatus("idle")}
						className="shrink-0 cursor-pointer rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
					>
						Try again
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={handleRecordAttendance}
					disabled={status === "saving" || status === "checking"}
					className={`group relative w-full overflow-hidden rounded-2xl bg-linear-to-br from-amber-400 via-orange-500 to-rose-500 p-4 text-left text-white shadow-lg shadow-orange-500/30 transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:hover:translate-y-0 ${
						status === "idle" ? "animate-shake" : ""
					}`}
				>
					<div className="pointer-events-none absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/10" />
					<div className="relative flex items-center gap-3">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
							{status === "saving" ? (
								<Loader2 className="animate-spin" size={20} />
							) : (
								<BellRing className="animate-pulse" size={20} />
							)}
						</span>
						<div className="min-w-0">
							<p className="text-sm font-semibold leading-tight">
								{status === "saving"
									? "Recording attendance…"
									: "Log Attendance"}
							</p>
							<p className="truncate text-xs opacity-90">
								{target.groupName} · started{" "}
								{formatTime(
									`${String(Math.floor(target.startMinutes / 60)).padStart(2, "0")}:${String(
										target.startMinutes % 60,
									).padStart(2, "0")}`,
								)}
							</p>
						</div>
					</div>
				</button>
			)}

			{showConfirmation && (
				<div
					role="dialog"
					onKeyDown={(e) => e.key === "Escape" && setShowConfirmation(false)}
					className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50"
					onClick={() => setShowConfirmation(false)}
				>
					<div
						role="dialog"
						onKeyDown={(e) => e.key === "Escape" && setShowConfirmation(false)}
						className="w-80 rounded-2xl bg-white p-6 text-center shadow-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<CheckCircle2 className="mx-auto mb-3 text-green-600" size={40} />
						<p className="text-base font-semibold text-stone-800">
							Attendance has been recorded
						</p>
						<p className="mt-1 text-sm text-stone-500">{target.groupName}</p>
						<button
							type="button"
							onClick={() => setShowConfirmation(false)}
							className="mt-4 w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</>
	);
}
