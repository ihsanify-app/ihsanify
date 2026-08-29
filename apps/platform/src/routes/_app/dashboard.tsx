import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { AttendancePrompt } from "../../components/dashboard/AttendancePrompt";
import { DailyVerseCard } from "../../components/dashboard/DailyVerseCard";
import { GroupCalendar } from "../../components/dashboard/GroupCalendar";
import { MiniCalendar } from "../../components/dashboard/MiniCalendar";
import { NearestSessionCard } from "../../components/dashboard/NearestSessionCard";
import { apiFetch } from "../../lib/apiClient";
import type { GroupWithSchedule } from "../../lib/plannedSessions";

export const Route = createFileRoute("/_app/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const [groups, setGroups] = useState<GroupWithSchedule[]>([]);
	const [loadError, setLoadError] = useState(false);
	const [focusedDate, setFocusedDate] = useState(() => new Date());

	function loadGroups() {
		setLoadError(false);
		apiFetch("/groups")
			.then(({ status, body }) => {
				if (status === 401 || status === 403) return;
				if (status !== 200) {
					setLoadError(true);
					return;
				}
				setGroups(body?.data ?? []);
			})
			.catch(() => setLoadError(true));
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: loadGroups is stable per render and only needs to run once on mount
	useEffect(() => {
		loadGroups();
	}, []);

	return (
		<div className="max-sm:p-3 sm:p-6">
			{loadError && (
				<div className="mb-4 flex flex-col items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<AlertTriangle size={18} className="shrink-0" />
						<p className="text-sm font-medium">
							Couldn't load your groups. Your schedule below may be incomplete.
						</p>
					</div>
					<button
						type="button"
						onClick={loadGroups}
						className="shrink-0 cursor-pointer rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
					>
						Try again
					</button>
				</div>
			)}
			<div className="flex max-lg:flex-col gap-4 lg:flex-row lg:gap-6">
				<div className="flex flex-col gap-4 sm:gap-6 lg:w-72 lg:shrink-0">
					<AttendancePrompt groups={groups} />
					<DailyVerseCard />
					<MiniCalendar
						focusedDate={focusedDate}
						onFocusedDateChange={setFocusedDate}
					/>
					<NearestSessionCard groups={groups} />
				</div>
				<div className="min-w-0 flex-1">
					<GroupCalendar
						groups={groups}
						focusedDate={focusedDate}
						onFocusedDateChange={setFocusedDate}
					/>
				</div>
			</div>
		</div>
	);
}
