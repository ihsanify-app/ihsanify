import { CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";
import {
	findNearestUpcoming,
	formatTime,
	type GroupWithSchedule,
	isSameDay,
} from "../../lib/plannedSessions";

function formatRelative(startsAt: Date, now: Date) {
	const diffMs = startsAt.getTime() - now.getTime();
	const diffMinutes = Math.round(diffMs / 60000);
	if (diffMinutes <= 0) return "Starting now";
	if (diffMinutes < 60) return `Starts in ${diffMinutes} min`;
	const diffHours = Math.round(diffMinutes / 60);
	if (isSameDay(startsAt, now)) return `Starts in ${diffHours}h`;
	return `Starts ${startsAt.toLocaleDateString("en-US", { weekday: "long" })}`;
}

export function NearestSessionCard({
	groups,
}: {
	groups: GroupWithSchedule[];
}) {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 30_000);
		return () => clearInterval(interval);
	}, []);

	const nearest = findNearestUpcoming(groups, now);

	if (!nearest) {
		return (
			<div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
				<div className="flex items-center gap-2 text-gray-500">
					<CalendarClock size={18} />
					<span className="text-sm font-medium">No upcoming sessions</span>
				</div>
			</div>
		);
	}

	const cardColor = nearest.cardColor || "#0f766e";
	const dayLabel = isSameDay(nearest.startsAt, now)
		? "Today"
		: nearest.startsAt.toLocaleDateString("en-US", {
				weekday: "long",
				month: "short",
				day: "numeric",
			});

	return (
		<div
			className="rounded-2xl p-4 shadow-sm text-white"
			style={{ backgroundColor: cardColor }}
		>
			<div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide opacity-80">
				<CalendarClock size={14} />
				Class reminder
			</div>
			<p className="mt-2 text-base font-semibold leading-tight">
				{nearest.groupName}
			</p>
			{nearest.subjectName && (
				<p className="text-xs opacity-80">{nearest.subjectName}</p>
			)}
			<div className="mt-3 flex items-center justify-between text-sm">
				<span>
					{dayLabel} ·{" "}
					{formatTime(
						`${String(Math.floor(nearest.startMinutes / 60)).padStart(2, "0")}:${String(
							nearest.startMinutes % 60,
						).padStart(2, "0")}`,
					)}
				</span>
				<span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
					{formatRelative(nearest.startsAt, now)}
				</span>
			</div>
			{nearest.teacherName && (
				<p className="mt-2 text-xs opacity-80">
					with <i>{nearest.teacherName}</i>
				</p>
			)}
		</div>
	);
}
