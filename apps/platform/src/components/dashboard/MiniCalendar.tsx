import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { addDays, isSameDay, startOfDay } from "../../lib/plannedSessions";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type MiniCalendarProps = {
	focusedDate: Date;
	onFocusedDateChange: (date: Date) => void;
};

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

export function MiniCalendar({
	focusedDate,
	onFocusedDateChange,
}: MiniCalendarProps) {
	const [viewMonth, setViewMonth] = useState(() => startOfDay(focusedDate));
	const today = new Date();

	useEffect(() => {
		setViewMonth((prev) =>
			prev.getFullYear() === focusedDate.getFullYear() &&
			prev.getMonth() === focusedDate.getMonth()
				? prev
				: startOfDay(focusedDate),
		);
	}, [focusedDate]);

	const days = buildMonthGrid(viewMonth);
	const monthLabel = viewMonth.toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});

	return (
		<div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<h2 className="font-heading text-lg font-bold text-stone-800">
					{monthLabel}
				</h2>
				<div className="flex items-center gap-1">
					<button
						type="button"
						aria-label="Previous month"
						onClick={() =>
							setViewMonth(
								(prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
							)
						}
						className="rounded-md p-1 text-stone-500 hover:bg-stone-100"
					>
						<ChevronLeft size={16} />
					</button>
					<button
						type="button"
						aria-label="Next month"
						onClick={() =>
							setViewMonth(
								(prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
							)
						}
						className="rounded-md p-1 text-stone-500 hover:bg-stone-100"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
			<div className="grid grid-cols-7 gap-y-1 text-center">
				{WEEKDAY_LABELS.map((label) => (
					<span key={label} className="text-[11px] font-medium text-stone-400">
						{label}
					</span>
				))}
				{days.map((day) => {
					const inMonth = day.getMonth() === viewMonth.getMonth();
					const isToday = isSameDay(day, today);
					const isSelected = isSameDay(day, focusedDate);
					return (
						<button
							type="button"
							key={day.toISOString()}
							onClick={() => onFocusedDateChange(day)}
							className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
								isSelected
									? "bg-green-700 text-white font-semibold"
									: isToday
										? "text-green-700 font-semibold hover:bg-green-50"
										: inMonth
											? "text-stone-700 hover:bg-stone-100"
											: "text-stone-300 hover:bg-stone-50"
							}`}
						>
							{day.getDate()}
						</button>
					);
				})}
			</div>
		</div>
	);
}
