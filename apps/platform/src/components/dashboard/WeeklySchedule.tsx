import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";

const SESSION_DURATION_MINUTES = 60;

const DAYS = [
	{ key: "monday", label: "Mon", jsDay: 1 },
	{ key: "tuesday", label: "Tue", jsDay: 2 },
	{ key: "wednesday", label: "Wed", jsDay: 3 },
	{ key: "thursday", label: "Thu", jsDay: 4 },
	{ key: "friday", label: "Fri", jsDay: 5 },
	{ key: "saturday", label: "Sat", jsDay: 6 },
	{ key: "sunday", label: "Sun", jsDay: 0 },
] as const;

type PlannedSession = { dayOfWeek: string; time: string };
type Group = {
	groupId: string;
	groupName: string;
	plannedSessions: PlannedSession[];
};

type ScheduleEntry = {
	groupId: string;
	groupName: string;
	time: string;
};

function formatTime(time: string) {
	const [h, m] = time.split(":").map(Number);
	const period = h >= 12 ? "PM" : "AM";
	const hour12 = h % 12 === 0 ? 12 : h % 12;
	return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

type LiveStatus = "upcoming" | "live" | "done";

function getLiveStatus(now: Date, time: string): LiveStatus {
	const [h, m] = time.split(":").map(Number);
	const sessionStart = new Date(now);
	sessionStart.setHours(h, m, 0, 0);
	const sessionEnd = new Date(
		sessionStart.getTime() + SESSION_DURATION_MINUTES * 60_000,
	);
	if (now < sessionStart) return "upcoming";
	if (now < sessionEnd) return "live";
	return "done";
}

const STATUS_DOT_CLASS: Record<LiveStatus, string> = {
	upcoming: "bg-amber-400 schedule-vibrate",
	live: "bg-green-500 schedule-vibrate",
	done: "bg-stone-300",
};

function GroupCircle({
	entry,
	isToday,
	now,
}: {
	entry: ScheduleEntry;
	isToday: boolean;
	now: Date;
}) {
	const status = isToday ? getLiveStatus(now, entry.time) : null;
	const size = isToday ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";

	return (
		<Link
			to="/groups"
			title={`${entry.groupName} · ${formatTime(entry.time)}`}
			className={`relative flex ${size} shrink-0 items-center justify-center rounded-full border-2 border-green-600 bg-white font-heading font-bold text-green-700 shadow-sm transition-transform hover:scale-110`}
		>
			{initials(entry.groupName)}
			{status && (
				<span
					className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white ${STATUS_DOT_CLASS[status]}`}
				/>
			)}
		</Link>
	);
}

export function WeeklySchedule() {
	const [groups, setGroups] = useState<Group[]>([]);
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		apiFetch("/groups").then(({ status, body }) => {
			if (status === 401 || status === 403) {
				setLoadState("unauthorized");
				return;
			}
			setGroups(body?.data ?? []);
			setLoadState("ready");
		});
	}, []);

	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 30_000);
		return () => clearInterval(interval);
	}, []);

	if (loadState === "unauthorized") {
		return (
			<section className="p-6 text-center text-stone-500">
				<p className="mb-3">Please log in to view the schedule.</p>
				<Link to="/login" className="text-green-700 font-semibold underline">
					Go to login
				</Link>
			</section>
		);
	}

	const byDay: Record<string, ScheduleEntry[]> = {};
	for (const day of DAYS) byDay[day.key] = [];
	for (const group of groups) {
		for (const planned of group.plannedSessions) {
			const bucket = byDay[planned.dayOfWeek];
			if (!bucket) continue;
			bucket.push({
				groupId: group.groupId,
				groupName: group.groupName,
				time: planned.time,
			});
		}
	}
	for (const day of DAYS) {
		byDay[day.key].sort((a, b) => a.time.localeCompare(b.time));
	}

	const todayKey = DAYS.find((d) => d.jsDay === now.getDay())?.key;
	const maxCount = Math.max(1, ...DAYS.map((d) => byDay[d.key].length));
	const MIN_BAR_HEIGHT = 28;
	const MAX_BAR_HEIGHT = 140;

	return (
		<section className="p-6">
			<style>{`
				@keyframes schedule-vibrate {
					0%, 100% { transform: translate(0, 0); }
					25% { transform: translate(-1px, 1px); }
					50% { transform: translate(1px, -1px); }
					75% { transform: translate(-1px, -1px); }
				}
				.schedule-vibrate {
					animation: schedule-vibrate 0.35s infinite;
				}
			`}</style>
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Weekly Schedule
			</h1>
			<p className="text-stone-500 text-sm mb-8">
				Groups with planned sessions this week, by day.
			</p>

			{loadState === "loading" ? (
				<p className="text-stone-400">Loading schedule…</p>
			) : (
				<div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
					<div className="flex items-end justify-between gap-2 sm:gap-4">
						{DAYS.map((day) => {
							const entries = byDay[day.key];
							const isToday = day.key === todayKey;
							const barHeight =
								entries.length === 0
									? MIN_BAR_HEIGHT
									: MIN_BAR_HEIGHT +
										(entries.length / maxCount) *
											(MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);

							return (
								<div
									key={day.key}
									className="flex flex-1 flex-col items-center justify-end"
								>
									<div className="mb-2 flex flex-col-reverse items-center gap-1.5">
										{entries.map((entry) => (
											<GroupCircle
												key={`${entry.groupId}-${entry.time}`}
												entry={entry}
												isToday={isToday}
												now={now}
											/>
										))}
									</div>
									<div
										className={`w-full rounded-t-lg transition-all ${
											isToday
												? "bg-gradient-to-t from-green-700 to-green-500 shadow-md"
												: "bg-gradient-to-t from-green-200 to-green-100"
										}`}
										style={{
											height: barHeight,
											maxWidth: isToday ? 64 : 44,
										}}
									/>
									<span
										className={`mt-3 font-heading text-sm ${
											isToday
												? "font-bold text-green-800"
												: "font-medium text-stone-500"
										}`}
									>
										{day.label}
									</span>
								</div>
							);
						})}
					</div>

					<div className="mt-8 flex flex-wrap items-center gap-5 border-t border-stone-100 pt-4 text-xs text-stone-500">
						<div className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-amber-400 schedule-vibrate" />
							Upcoming today
						</div>
						<div className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-green-500 schedule-vibrate" />
							In session
						</div>
						<div className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-stone-300" />
							Finished for today
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
