import { GraduationCap, Leaf, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";

const DAY_ORDER = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
];

const DAY_LABEL: Record<string, string> = {
	monday: "Mon",
	tuesday: "Tue",
	wednesday: "Wed",
	thursday: "Thu",
	friday: "Fri",
	saturday: "Sat",
	sunday: "Sun",
};

function formatTime(time: string) {
	const [h, m] = time.split(":").map(Number);
	const period = h >= 12 ? "PM" : "AM";
	const hour12 = h % 12 === 0 ? 12 : h % 12;
	return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

type PlannedSession = {
	plannedSessionId: string;
	dayOfWeek: string;
	time: string;
};
type Group = {
	groupId: string;
	groupName: string;
	teacherId: string | null;
	teacherName: string | null;
	isActive: boolean;
	studentIds: { studentId: string; studentName: string }[];
	plannedSessions: PlannedSession[];
};

type TeacherBucket = {
	teacherId: string;
	teacherName: string;
	groups: Group[];
};

function buildTeacherBuckets(groups: Group[]): TeacherBucket[] {
	const buckets = new Map<string, TeacherBucket>();
	for (const group of groups) {
		const teacherId = group.teacherId ?? "unassigned";
		const teacherName = group.teacherName ?? "Unassigned";
		if (!buckets.has(teacherId)) {
			buckets.set(teacherId, { teacherId, teacherName, groups: [] });
		}
		buckets.get(teacherId)?.groups.push(group);
	}
	return [...buckets.values()]
		.sort((a, b) => {
			if (a.teacherId === "unassigned") return 1;
			if (b.teacherId === "unassigned") return -1;
			return a.teacherName.localeCompare(b.teacherName);
		})
		.map((bucket) => ({
			...bucket,
			groups: [...bucket.groups].sort((a, b) =>
				a.groupName.localeCompare(b.groupName),
			),
		}));
}

function sortSessions(sessions: PlannedSession[]) {
	return [...sessions].sort((a, b) => {
		const dayDiff =
			DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
		return dayDiff !== 0 ? dayDiff : a.time.localeCompare(b.time);
	});
}

export function TeacherGroupMindMap() {
	const [groups, setGroups] = useState<Group[]>([]);
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");

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

	if (loadState === "unauthorized") return null;

	const teacherBuckets = buildTeacherBuckets(groups);

	return (
		<section className="p-6 pt-0">
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Team Structure
			</h1>
			<p className="text-stone-500 text-sm mb-8">
				Teachers, the groups they lead, and each group's students and planned
				sessions.
			</p>

			{loadState === "loading" ? (
				<p className="text-stone-400">Loading team structure…</p>
			) : teacherBuckets.length === 0 ? (
				<p className="text-stone-400 italic">No groups to display yet.</p>
			) : (
				<div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
					<div className="flex flex-col gap-8">
						{teacherBuckets.map((bucket) => (
							<div key={bucket.teacherId}>
								<div className="flex items-center gap-2">
									<div
										className={`flex items-center gap-2 rounded-full px-4 py-2 font-heading font-semibold text-white shadow-sm ${
											bucket.teacherId === "unassigned"
												? "bg-stone-400"
												: "bg-green-700"
										}`}
									>
										<GraduationCap size={18} />
										{bucket.teacherName}
									</div>
									<span className="text-xs text-stone-400">
										{bucket.groups.length} group
										{bucket.groups.length === 1 ? "" : "s"}
									</span>
								</div>

								<div className="ml-6 mt-4 flex flex-col gap-5 border-l-2 border-dashed border-green-200 pl-8">
									{bucket.groups.map((group) => (
										<div key={group.groupId} className="relative">
											<span className="absolute -left-8 top-4 w-8 border-t-2 border-dashed border-green-200" />
											<div
												className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-sm ${
													group.isActive ? "bg-teal-600" : "bg-stone-400"
												}`}
											>
												<Users size={15} />
												{group.groupName}
												{!group.isActive && (
													<span className="text-teal-100 font-normal">
														(inactive)
													</span>
												)}
											</div>

											<div className="ml-4 mt-3 flex flex-col gap-4 border-l-2 border-dashed border-stone-200 pl-6 sm:flex-row sm:gap-8">
												<div className="flex-1">
													<div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
														Students
													</div>
													{group.studentIds.length === 0 ? (
														<span className="text-xs italic text-stone-400">
															No students yet
														</span>
													) : (
														<div className="flex flex-wrap gap-1.5">
															{group.studentIds.map((s) => (
																<span
																	key={s.studentId}
																	className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
																>
																	<User size={12} />
																	{s.studentName}
																</span>
															))}
														</div>
													)}
												</div>

												<div className="flex-1">
													<div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
														Planned Sessions
													</div>
													{group.plannedSessions.length === 0 ? (
														<span className="text-xs italic text-stone-400">
															No planned sessions yet
														</span>
													) : (
														<div className="flex flex-wrap gap-1.5">
															{sortSessions(group.plannedSessions).map((p) => (
																<span
																	key={p.plannedSessionId}
																	className="flex items-center gap-1 rounded-tl-full rounded-br-full rounded-tr-md rounded-bl-md border border-green-300 bg-gradient-to-br from-green-50 to-green-100 px-2.5 py-1 text-xs font-medium text-green-800"
																>
																	<Leaf size={12} />
																	{DAY_LABEL[p.dayOfWeek] ?? p.dayOfWeek} ·{" "}
																	{formatTime(p.time)}
																</span>
															))}
														</div>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
