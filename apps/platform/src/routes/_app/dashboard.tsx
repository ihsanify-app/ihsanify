import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AttendancePrompt } from "../../components/dashboard/AttendancePrompt";
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
	const [focusedDate, setFocusedDate] = useState(() => new Date());

	useEffect(() => {
		apiFetch("/groups").then(({ status, body }) => {
			if (status === 401 || status === 403) return;
			setGroups(body?.data ?? []);
		});
	}, []);

	return (
		<div className="flex flex-col gap-4 p-3 sm:p-6 lg:flex-row lg:gap-6">
			<div className="flex flex-col gap-4 sm:gap-6 lg:w-72 lg:shrink-0">
				<MiniCalendar
					focusedDate={focusedDate}
					onFocusedDateChange={setFocusedDate}
				/>
				<NearestSessionCard groups={groups} />
				<AttendancePrompt groups={groups} />
			</div>
			<div className="min-w-0 flex-1">
				<GroupCalendar
					groups={groups}
					focusedDate={focusedDate}
					onFocusedDateChange={setFocusedDate}
				/>
			</div>
		</div>
	);
}
