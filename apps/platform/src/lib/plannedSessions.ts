// Shared helpers for turning a group's recurring weekly `plannedSessions`
// (dayOfWeek + time, no end time) into concrete calendar occurrences. Used
// by the dashboard's mini calendar, nearest-session reminder, and the main
// group calendar.

export type DayKey =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

export const DAYS: {
	key: DayKey;
	label: string;
	full: string;
	jsDay: number;
}[] = [
	{ key: "monday", label: "Mon", full: "Monday", jsDay: 1 },
	{ key: "tuesday", label: "Tue", full: "Tuesday", jsDay: 2 },
	{ key: "wednesday", label: "Wed", full: "Wednesday", jsDay: 3 },
	{ key: "thursday", label: "Thu", full: "Thursday", jsDay: 4 },
	{ key: "friday", label: "Fri", full: "Friday", jsDay: 5 },
	{ key: "saturday", label: "Sat", full: "Saturday", jsDay: 6 },
	{ key: "sunday", label: "Sun", full: "Sunday", jsDay: 0 },
];

// PlannedSession has no end time, only a start — this is purely a visual
// block height for the calendar grid, not used for the Y-axis range (that's
// based on start times only, per spec).
export const DEFAULT_BLOCK_MINUTES = 60;

export type PlannedSession = { dayOfWeek: string; time: string };

export type GroupWithSchedule = {
	groupId: string;
	groupName: string;
	subjectName: string | null;
	teacherName: string | null;
	cardColor: string | null;
	plannedSessions: PlannedSession[];
	studentIds: { studentId: string; studentName: string }[];
};

export type PlannedEvent = {
	groupId: string;
	groupName: string;
	subjectName: string | null;
	teacherName: string | null;
	cardColor: string | null;
	studentNames: string[];
	date: Date;
	startMinutes: number;
	endMinutes: number;
};

// "Ustadzah Siska - Maryam, Ibrahim & Dawud" — teacher name, then a
// comma-separated student list with "&" before the last one.
export function formatNameList(names: string[]): string {
	if (names.length === 0) return "";
	if (names.length === 1) return names[0];
	return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export function dayKeyOf(date: Date): DayKey {
	const jsDay = date.getDay();
	return DAYS.find((d) => d.jsDay === jsDay)?.key ?? "sunday";
}

export function parseTimeToMinutes(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + (m || 0);
}

export function formatTime(time: string) {
	const [h, m] = time.split(":").map(Number);
	const period = h >= 12 ? "PM" : "AM";
	const hour12 = h % 12 === 0 ? 12 : h % 12;
	return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatHourLabel(hour: number) {
	const normalized = ((hour % 24) + 24) % 24;
	const period = normalized >= 12 ? "PM" : "AM";
	const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
	return `${String(hour12).padStart(2, "0")} ${period}`;
}

export function startOfDay(date: Date) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

// Monday-start week containing `date`.
export function startOfWeek(date: Date) {
	const d = startOfDay(date);
	const jsDay = d.getDay();
	const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
	return addDays(d, diffToMonday);
}

export function isSameDay(a: Date, b: Date) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

// Every occurrence of every group's planned sessions that falls on one of
// `dates`.
export function buildEventsForDates(
	groups: GroupWithSchedule[],
	dates: Date[],
): PlannedEvent[] {
	const events: PlannedEvent[] = [];
	for (const date of dates) {
		const dayKey = dayKeyOf(date);
		for (const group of groups) {
			for (const planned of group.plannedSessions) {
				if (planned.dayOfWeek !== dayKey) continue;
				const startMinutes = parseTimeToMinutes(planned.time);
				events.push({
					groupId: group.groupId,
					groupName: group.groupName,
					subjectName: group.subjectName,
					teacherName: group.teacherName,
					cardColor: group.cardColor,
					studentNames: group.studentIds.map((s) => s.studentName),
					date,
					startMinutes,
					endMinutes: startMinutes + DEFAULT_BLOCK_MINUTES,
				});
			}
		}
	}
	return events;
}

// "1 hour before the earliest planned session" / "1 hour after the latest
// planned session" — both based on start times, since planned sessions
// don't carry a duration. Falls back to a plain business-hours window when
// there's nothing scheduled in range.
export function computeAxisHourRange(events: PlannedEvent[]): {
	startHour: number;
	endHour: number;
} {
	if (events.length === 0) return { startHour: 8, endHour: 18 };
	const startHours = events.map((e) => e.startMinutes / 60);
	const minStart = Math.min(...startHours);
	const maxStart = Math.max(...startHours);
	const startHour = Math.max(0, Math.floor(minStart) - 1);
	const endHour = Math.min(24, Math.ceil(maxStart) + 1);
	return { startHour, endHour: Math.max(endHour, startHour + 1) };
}

// Groups events into overlap clusters (classic merge-overlapping-intervals
// sweep) and assigns each a lane *within its own cluster* — lane numbering
// restarts at 0 per cluster, rather than persisting across the whole day,
// so a cluster's members stack cleanly from the top regardless of what
// came before them. `clusterStartMinutes` lets the caller anchor a whole
// cluster's vertical stack at its earliest event's time position, so
// overlapping events can be rendered as a compact, fully-readable vertical
// list instead of ever-narrower side-by-side columns.
export function assignLanes<
	T extends { startMinutes: number; endMinutes: number },
>(
	events: T[],
): (T & { lane: number; laneCount: number; clusterStartMinutes: number })[] {
	const sorted = [...events].sort((a, b) => a.startMinutes - b.startMinutes);
	const laneEnds: number[] = [];
	const placed: (T & { lane: number; clusterIndex: number })[] = [];
	const clusterStarts: number[] = [];
	let clusterIndex = -1;
	let clusterEnd = Number.NEGATIVE_INFINITY;
	for (const ev of sorted) {
		if (ev.startMinutes >= clusterEnd) {
			clusterIndex++;
			clusterStarts[clusterIndex] = ev.startMinutes;
			clusterEnd = ev.endMinutes;
			laneEnds.length = 0;
		} else {
			clusterEnd = Math.max(clusterEnd, ev.endMinutes);
		}
		let lane = laneEnds.findIndex((end) => end <= ev.startMinutes);
		if (lane === -1) {
			lane = laneEnds.length;
			laneEnds.push(ev.endMinutes);
		} else {
			laneEnds[lane] = ev.endMinutes;
		}
		placed.push({ ...ev, lane, clusterIndex });
	}
	const clusterLaneCount = new Map<number, number>();
	for (const p of placed) {
		clusterLaneCount.set(
			p.clusterIndex,
			Math.max(clusterLaneCount.get(p.clusterIndex) ?? 0, p.lane + 1),
		);
	}
	return placed.map((p) => ({
		...p,
		laneCount: clusterLaneCount.get(p.clusterIndex) ?? 1,
		clusterStartMinutes: clusterStarts[p.clusterIndex],
	}));
}

// The soonest upcoming occurrence (today if its time hasn't passed yet,
// otherwise the next matching weekday, up to 7 days out) across every
// group's planned sessions.
export function findNearestUpcoming(
	groups: GroupWithSchedule[],
	now: Date,
): (PlannedEvent & { startsAt: Date }) | null {
	let best: (PlannedEvent & { startsAt: Date }) | null = null;
	for (const group of groups) {
		for (const planned of group.plannedSessions) {
			const targetDay = DAYS.find((d) => d.key === planned.dayOfWeek);
			if (!targetDay) continue;
			const startMinutes = parseTimeToMinutes(planned.time);
			for (let offset = 0; offset <= 7; offset++) {
				const candidateDate = addDays(startOfDay(now), offset);
				if (dayKeyOf(candidateDate) !== planned.dayOfWeek) continue;
				const startsAt = new Date(candidateDate);
				startsAt.setHours(
					Math.floor(startMinutes / 60),
					startMinutes % 60,
					0,
					0,
				);
				if (startsAt < now) continue;
				if (!best || startsAt < best.startsAt) {
					best = {
						groupId: group.groupId,
						groupName: group.groupName,
						subjectName: group.subjectName,
						teacherName: group.teacherName,
						cardColor: group.cardColor,
						studentNames: group.studentIds.map((s) => s.studentName),
						date: candidateDate,
						startMinutes,
						endMinutes: startMinutes + DEFAULT_BLOCK_MINUTES,
						startsAt,
					};
				}
				break;
			}
		}
	}
	return best;
}

export type TodaysSessionSlot = {
	groupId: string;
	groupName: string;
	startMinutes: number;
	studentIds: { studentId: string; studentName: string }[];
};

// Among today's planned sessions whose start time has already passed, the
// one that started most recently — i.e. "the class that's on right now."
// Returns null before any of today's sessions have started yet.
export function findTodaysStartedSession(
	groups: GroupWithSchedule[],
	now: Date,
): TodaysSessionSlot | null {
	const dayKey = dayKeyOf(now);
	const nowMinutes = now.getHours() * 60 + now.getMinutes();
	let best: TodaysSessionSlot | null = null;
	for (const group of groups) {
		for (const planned of group.plannedSessions) {
			if (planned.dayOfWeek !== dayKey) continue;
			const startMinutes = parseTimeToMinutes(planned.time);
			if (startMinutes > nowMinutes) continue;
			if (!best || startMinutes > best.startMinutes) {
				best = {
					groupId: group.groupId,
					groupName: group.groupName,
					startMinutes,
					studentIds: group.studentIds,
				};
			}
		}
	}
	return best;
}
