import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
	addDays,
	assignLanes,
	buildEventsForDates,
	computeAxisHourRange,
	DAYS,
	formatHourLabel,
	formatNameList,
	formatTime,
	type GroupWithSchedule,
	isSameDay,
	type PlannedEvent,
	startOfDay,
	startOfWeek,
} from "../../lib/plannedSessions";

type ViewMode = "daily" | "weekly" | "monthly";

const ROW_HEIGHT_PX = 56;

function buildMonthGrid(monthAnchor: Date): Date[] {
	const firstOfMonth = new Date(
		monthAnchor.getFullYear(),
		monthAnchor.getMonth(),
		1,
	);
	const jsDay = firstOfMonth.getDay();
	const leadingDays = jsDay === 0 ? 6 : jsDay - 1;
	const gridStart = addDays(firstOfMonth, -leadingDays);
	return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

function getVisibleDates(viewMode: ViewMode, focusedDate: Date): Date[] {
	if (viewMode === "daily") return [startOfDay(focusedDate)];
	if (viewMode === "weekly") {
		const start = startOfWeek(focusedDate);
		return Array.from({ length: 7 }, (_, i) => addDays(start, i));
	}
	return buildMonthGrid(focusedDate);
}

function periodLabel(viewMode: ViewMode, focusedDate: Date): string {
	if (viewMode === "monthly") {
		return focusedDate.toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});
	}
	if (viewMode === "daily") {
		return focusedDate.toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	}
	const start = startOfWeek(focusedDate);
	const end = addDays(start, 6);
	const sameMonth = start.getMonth() === end.getMonth();
	const startLabel = start.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
	const endLabel = end.toLocaleDateString(
		"en-US",
		sameMonth
			? { day: "numeric", year: "numeric" }
			: { month: "short", day: "numeric", year: "numeric" },
	);
	return `${startLabel} – ${endLabel}`;
}

export function GroupCalendar({
	groups,
	focusedDate,
	onFocusedDateChange,
}: {
	groups: GroupWithSchedule[];
	focusedDate: Date;
	onFocusedDateChange: (date: Date) => void;
}) {
	const [viewMode, setViewMode] = useState<ViewMode>("weekly");
	const today = new Date();

	const visibleDates = useMemo(
		() => getVisibleDates(viewMode, focusedDate),
		[viewMode, focusedDate],
	);

	function navigate(direction: -1 | 1) {
		if (viewMode === "daily") {
			onFocusedDateChange(addDays(focusedDate, direction));
		} else if (viewMode === "weekly") {
			onFocusedDateChange(addDays(focusedDate, direction * 7));
		} else {
			onFocusedDateChange(
				new Date(
					focusedDate.getFullYear(),
					focusedDate.getMonth() + direction,
					1,
				),
			);
		}
	}

	return (
		<div className="flex min-h-105 flex-col rounded-2xl border border-green-100 bg-white shadow-sm sm:min-h-150">
			<div className="flex max-sm:flex-col gap-3 border-b border-green-100 max-sm:px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
				<div className="flex items-center gap-2">
					<button
						type="button"
						aria-label="Previous period"
						onClick={() => navigate(-1)}
						className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
					>
						<ChevronLeft size={18} />
					</button>
					<h2 className="min-w-0 max-sm:flex-1 font-heading text-lg font-bold text-stone-800 sm:min-w-45 sm:flex-none">
						{periodLabel(viewMode, focusedDate)}
					</h2>
					<button
						type="button"
						aria-label="Next period"
						onClick={() => navigate(1)}
						className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
					>
						<ChevronRight size={18} />
					</button>
					<button
						type="button"
						onClick={() => onFocusedDateChange(new Date())}
						className="ml-2 rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
					>
						Today
					</button>
				</div>
				<div className="flex items-center gap-1 self-start rounded-lg bg-stone-100 p-1 sm:self-auto">
					{(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
						<button
							type="button"
							key={mode}
							onClick={() => setViewMode(mode)}
							className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
								viewMode === mode
									? "bg-white text-stone-900 shadow-sm"
									: "text-stone-500 hover:text-stone-700"
							}`}
						>
							{mode}
						</button>
					))}
				</div>
			</div>

			{viewMode === "monthly" ? (
				<MonthlyGrid
					dates={visibleDates}
					focusedDate={focusedDate}
					groups={groups}
					today={today}
				/>
			) : (
				<TimeGrid dates={visibleDates} groups={groups} today={today} />
			)}
		</div>
	);
}

function TimeGrid({
	dates,
	groups,
	today,
}: {
	dates: Date[];
	groups: GroupWithSchedule[];
	today: Date;
}) {
	const events = useMemo(
		() => buildEventsForDates(groups, dates),
		[groups, dates],
	);
	const { startHour, endHour } = useMemo(
		() => computeAxisHourRange(events),
		[events],
	);
	const hours = Array.from(
		{ length: endHour - startHour },
		(_, i) => startHour + i,
	);
	const gridHeight = hours.length * ROW_HEIGHT_PX;

	return (
		<div className="flex-1 overflow-auto">
			<div className="flex min-w-full">
				<div className="w-16 shrink-0 border-r border-stone-100">
					<div className="h-10 border-b border-stone-100" />
					{hours.map((hour) => (
						<div
							key={hour}
							style={{ height: ROW_HEIGHT_PX }}
							className="relative -translate-y-2 px-2 text-right text-[11px] text-stone-400"
						>
							{formatHourLabel(hour)}
						</div>
					))}
				</div>
				<div
					className="grid flex-1"
					style={{
						gridTemplateColumns: `repeat(${dates.length}, minmax(120px, 1fr))`,
					}}
				>
					{dates.map((date) => {
						const dayEvents = events.filter((e) => isSameDay(e.date, date));
						const laned = assignLanes(dayEvents);
						const isToday = isSameDay(date, today);
						return (
							<div
								key={date.toISOString()}
								className="border-r border-stone-100 last:border-r-0"
							>
								<div
									className={`flex h-10 flex-col items-center justify-center border-b border-stone-100 text-xs ${
										isToday ? "text-green-700 font-semibold" : "text-stone-500"
									}`}
								>
									<span>
										{date.toLocaleDateString("en-US", { weekday: "short" })}
									</span>
									<span className="text-[11px]">{date.getDate()}</span>
								</div>
								<div className="relative" style={{ height: gridHeight }}>
									{hours.map((hour, i) => (
										<div
											key={hour}
											className="absolute inset-x-0 border-b border-stone-50"
											style={{ top: i * ROW_HEIGHT_PX, height: ROW_HEIGHT_PX }}
										/>
									))}
									{laned.map((event) => (
										<EventBlock
											key={`${event.groupId}-${event.startMinutes}`}
											event={event}
											startHour={startHour}
										/>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function EventBlock({
	event,
	startHour,
}: {
	event: PlannedEvent & { lane: number; laneCount: number };
	startHour: number;
}) {
	const top = ((event.startMinutes - startHour * 60) / 60) * ROW_HEIGHT_PX;
	const height = ((event.endMinutes - event.startMinutes) / 60) * ROW_HEIGHT_PX;
	const widthPercent = 100 / event.laneCount;
	const timeLabel = formatTime(
		`${String(Math.floor(event.startMinutes / 60)).padStart(2, "0")}:${String(
			event.startMinutes % 60,
		).padStart(2, "0")}`,
	);
	const studentList = formatNameList(event.studentNames);
	const description = event.teacherName
		? studentList
			? `${event.teacherName} - ${studentList}`
			: event.teacherName
		: studentList;

	return (
		<Link
			to="/groups/$groupId/sessions"
			params={{ groupId: event.groupId }}
			className="absolute overflow-hidden rounded-lg px-2 py-1 text-white shadow-sm transition-opacity hover:opacity-90"
			style={{
				top,
				height: Math.max(height, 24) - 2,
				left: `${event.lane * widthPercent}%`,
				width: `calc(${widthPercent}% - 4px)`,
				backgroundColor: event.cardColor || "#0f766e",
			}}
			title={`${event.groupName} · ${timeLabel}${description ? ` · ${description}` : ""}`}
		>
			<p className="truncate text-[11px] font-semibold leading-tight">
				{event.groupName}
			</p>
			<p className="truncate text-[10px] opacity-85">{timeLabel}</p>
			{description && (
				<p className="truncate text-[10px] opacity-80">{description}</p>
			)}
		</Link>
	);
}

function MonthlyGrid({
	dates,
	focusedDate,
	groups,
	today,
}: {
	dates: Date[];
	focusedDate: Date;
	groups: GroupWithSchedule[];
	today: Date;
}) {
	const events = useMemo(
		() => buildEventsForDates(groups, dates),
		[groups, dates],
	);

	return (
		<div className="flex-1 overflow-x-auto p-2">
			<div className="min-w-160">
				<div className="grid grid-cols-7 border-b border-stone-100 pb-1">
					{DAYS.map((d) => (
						<span
							key={d.key}
							className="text-center text-[11px] font-medium text-stone-400"
						>
							{d.label}
						</span>
					))}
				</div>
				<div
					className="grid grid-cols-7 grid-rows-6 gap-px bg-stone-100"
					style={{ height: "calc(100% - 24px)" }}
				>
					{dates.map((date) => {
						const dayEvents = events
							.filter((e) => isSameDay(e.date, date))
							.sort((a, b) => a.startMinutes - b.startMinutes);
						const inMonth = date.getMonth() === focusedDate.getMonth();
						const isToday = isSameDay(date, today);
						const visible = dayEvents.slice(0, 3);
						const overflowCount = dayEvents.length - visible.length;
						return (
							<div
								key={date.toISOString()}
								className={`min-h-[90px] bg-white p-1.5 ${inMonth ? "" : "bg-stone-50/60"}`}
							>
								<span
									className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
										isToday
											? "bg-green-700 font-semibold text-white"
											: inMonth
												? "text-stone-700"
												: "text-stone-300"
									}`}
								>
									{date.getDate()}
								</span>
								<div className="mt-1 flex flex-col gap-0.5">
									{visible.map((event) => (
										<div
											key={`${event.groupId}-${event.startMinutes}`}
											className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
											style={{ backgroundColor: event.cardColor || "#0f766e" }}
											title={event.groupName}
										>
											{event.groupName}
										</div>
									))}
									{overflowCount > 0 && (
										<span className="text-[10px] text-stone-400">
											+{overflowCount} more
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
