import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, Calendar, Clock, Pencil, PlusCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { mockUser } from "../../lib/mockAuth";

export const Route = createFileRoute("/_app/groups")({
	component: RouteComponent,
});

const DAY_OPTIONS = [
	{ value: "monday", label: "Monday" },
	{ value: "tuesday", label: "Tuesday" },
	{ value: "wednesday", label: "Wednesday" },
	{ value: "thursday", label: "Thursday" },
	{ value: "friday", label: "Friday" },
	{ value: "saturday", label: "Saturday" },
	{ value: "sunday", label: "Sunday" },
] as const;

const DAY_ABBREV: Record<string, string> = {
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

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatDateRange(start: string, end: string | null) {
	return `${formatDate(start)} → ${end ? formatDate(end) : "Ongoing"}`;
}

type PlannedSession = { dayOfWeek: string; time: string };

type Group = {
	groupId: string;
	groupName: string;
	subjectId: string;
	subjectName: string | null;
	teacherId: string | null;
	teacherName: string | null;
	isActive: boolean;
	startDate: string;
	endDate: string | null;
	studentIds: { studentId: string; studentName: string }[];
	plannedSessions: PlannedSession[];
};
type Option = { id: string; name: string };

function ConfirmModal({
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
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-96 flex flex-col gap-4 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-stone-800">
					Are you sure you want to delete this group?
				</h2>
				<form>
					<div className="flex flex-col gap-2">
						<button
							type="button"
							className="cursor-pointer rounded-xl bg-rose-600 text-white p-2 hover:bg-rose-700 transition-colors"
							onClick={onConfirm}
						>
							Yes
						</button>
						<button
							type="button"
							className="cursor-pointer rounded-xl border border-stone-300 text-stone-600 p-2 hover:bg-stone-50 transition-colors"
							onClick={onClose}
						>
							No
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function CreateGroupModal({
	initialData,
	subjects,
	teachers,
	students,
	onClose,
	onSubmit,
}: {
	initialData: Group | null;
	subjects: Option[];
	teachers: Option[];
	students: Option[];
	onClose: () => void;
	onSubmit: (payload: {
		groupName: string;
		subjectId: string;
		teacherId: string;
		studentIds: string[];
		startDate: string;
		endDate: string | null;
		plannedSessions: PlannedSession[];
	}) => void;
}) {
	const [groupName, setGroupName] = useState(initialData?.groupName ?? "");
	const [subjectId, setSubjectId] = useState(initialData?.subjectId ?? "");
	const [teacherId, setTeacherId] = useState(initialData?.teacherId ?? "");
	const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
		initialData?.studentIds.map((s) => s.studentId) ?? [],
	);
	const [startDate, setStartDate] = useState(
		initialData?.startDate.slice(0, 10) ?? "",
	);
	const [endDate, setEndDate] = useState(
		initialData?.endDate?.slice(0, 10) ?? "",
	);
	const [plannedSessions, setPlannedSessions] = useState<PlannedSession[]>(
		initialData?.plannedSessions.map((p) => ({
			dayOfWeek: p.dayOfWeek,
			time: p.time,
		})) ?? [],
	);
	const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<
		true | false
	>(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	function toggleStudent(id: string) {
		setSelectedStudentIds((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
		);
	}

	function addPlannedSession() {
		setPlannedSessions((prev) => [
			...prev,
			{ dayOfWeek: "monday", time: "16:00" },
		]);
	}

	function updatePlannedSession(index: number, patch: Partial<PlannedSession>) {
		setPlannedSessions((prev) =>
			prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
		);
	}

	function removePlannedSession(index: number) {
		setPlannedSessions((prev) => prev.filter((_, i) => i !== index));
	}

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setIsStudentDropdownOpen(false);
			}
		}
		if (isStudentDropdownOpen) {
			document.addEventListener("click", handleClickOutside);
		}
		return () => document.removeEventListener("click", handleClickOutside);
	}, [isStudentDropdownOpen]);

	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-md shadow-xl max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-3">
					{initialData ? "Edit Group" : "Create Group"}
				</h2>
				<form>
					<div className="flex flex-col gap-2">
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							placeholder="e.g. Tahsin Dasar 01"
							value={groupName}
							onChange={(e) => setGroupName(e.target.value)}
						/>
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={subjectId}
							onChange={(e) => setSubjectId(e.target.value)}
						>
							<option value="">Select subject</option>
							{subjects.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</select>
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={teacherId}
							onChange={(e) => setTeacherId(e.target.value)}
						>
							<option value="">Select teacher</option>
							{teachers.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
						<div ref={dropdownRef}>
							<button
								type="button"
								tabIndex={0}
								onClick={() => setIsStudentDropdownOpen((prev) => !prev)}
								onKeyDown={(e) =>
									e.key === "Enter" && setIsStudentDropdownOpen((prev) => !prev)
								}
								className="border border-stone-300 rounded-xl p-2 text-sm cursor-pointer min-h-9 w-full text-left"
							>
								{selectedStudentIds.length === 0
									? "Select Students"
									: students
											.filter((s) => selectedStudentIds.includes(s.id))
											.map((s) => s.name)
											.join(", ")}
							</button>
							{isStudentDropdownOpen && (
								<div className="border border-stone-200 rounded-xl mt-1 p-2 grid grid-cols-3 gap-1 max-h-30 overflow-y-auto">
									{students.map((s) => (
										<label
											key={s.id}
											onClick={(e) => e.stopPropagation()}
											onKeyDown={(e) => e.stopPropagation()}
											className="flex items-center gap-2 text-sm cursor-pointer text-stone-600 hover:text-green-700"
										>
											<input
												type="checkbox"
												onChange={() => toggleStudent(s.id)}
												checked={selectedStudentIds.includes(s.id)}
											/>
											{s.name}
										</label>
									))}
								</div>
							)}
						</div>

						<div className="flex gap-2">
							<div className="flex-1">
								<p className="text-xs text-stone-500 mb-1">Start date</p>
								<input
									type="date"
									className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors w-full"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
							</div>
							<div className="flex-1">
								<p className="text-xs text-stone-500 mb-1">
									End date (blank = ongoing)
								</p>
								<input
									type="date"
									className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors w-full"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
								/>
							</div>
						</div>

						<div className="border border-stone-200 rounded-xl p-2">
							<p className="text-xs text-stone-500 mb-1">Planned sessions</p>
							<div className="flex flex-col gap-2">
								{plannedSessions.map((p, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: rows are only ever appended/removed by index, no stable id yet
									<div key={i} className="flex items-center gap-2">
										<select
											className="border border-stone-300 rounded-lg p-1.5 text-sm outline-none flex-1"
											value={p.dayOfWeek}
											onChange={(e) =>
												updatePlannedSession(i, { dayOfWeek: e.target.value })
											}
										>
											{DAY_OPTIONS.map((d) => (
												<option key={d.value} value={d.value}>
													{d.label}
												</option>
											))}
										</select>
										<input
											type="time"
											className="border border-stone-300 rounded-lg p-1.5 text-sm outline-none"
											value={p.time}
											onChange={(e) =>
												updatePlannedSession(i, { time: e.target.value })
											}
										/>
										<button
											type="button"
											onClick={() => removePlannedSession(i)}
											className="text-rose-500 hover:text-rose-600 cursor-pointer"
										>
											<X size={16} />
										</button>
									</div>
								))}
								<button
									type="button"
									onClick={addPlannedSession}
									className="text-sm text-green-700 hover:text-green-800 cursor-pointer text-left"
								>
									+ Add planned session
								</button>
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
								groupName,
								subjectId,
								teacherId,
								studentIds: selectedStudentIds,
								startDate,
								endDate: endDate || null,
								plannedSessions,
							})
						}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
					>
						{initialData ? "Save Changes" : "Create"}
					</button>
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedQuery, setSelectedQuery] = useState("");
	const [groups, setGroups] = useState<Group[]>([]);
	const [subjects, setSubjects] = useState<Option[]>([]);
	const [teachers, setTeachers] = useState<Option[]>([]);
	const [students, setStudents] = useState<Option[]>([]);
	const [editingGroup, setEditingGroup] = useState<Group | null>(null);
	const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

	useEffect(() => {
		apiFetch("/groups").then(({ status, body }) => {
			if (status === 401) {
				setLoadState("unauthorized");
				return;
			}
			setGroups(body?.data ?? []);
			setLoadState("ready");
		});

		if (mockUser.role === "admin") {
			apiFetch("/subjects").then(
				({
					body,
				}: {
					body: { data: { subjectId: string; subjectName: string }[] } | null;
				}) =>
					setSubjects(
						(body?.data ?? []).map((s) => ({
							id: s.subjectId,
							name: s.subjectName,
						})),
					),
			);
			apiFetch("/teachers").then(
				({
					body,
				}: {
					body: { data: { teacherId: string; teacherName: string }[] } | null;
				}) =>
					setTeachers(
						(body?.data ?? []).map((t) => ({
							id: t.teacherId,
							name: t.teacherName,
						})),
					),
			);
			apiFetch("/students").then(
				({
					body,
				}: {
					body: { data: { studentId: string; studentName: string }[] } | null;
				}) =>
					setStudents(
						(body?.data ?? []).map((s) => ({
							id: s.studentId,
							name: s.studentName,
						})),
					),
			);
		}
	}, []);

	async function handleCreate(payload: {
		groupName: string;
		subjectId: string;
		teacherId: string;
		studentIds: string[];
		startDate: string;
		endDate: string | null;
		plannedSessions: PlannedSession[];
	}) {
		const { body } = await apiFetch("/groups", {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (body?.success) {
			setGroups((prev) => [...prev, body.data]);
			setIsModalOpen(false);
		}
	}

	async function handleUpdate(
		groupId: string,
		payload: {
			groupName: string;
			subjectId: string;
			teacherId: string;
			studentIds: string[];
			startDate: string;
			endDate: string | null;
			plannedSessions: PlannedSession[];
		},
	) {
		const { body } = await apiFetch(`/groups/${groupId}`, {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
		if (body?.success) {
			setGroups((prev) =>
				prev.map((g) => (g.groupId === groupId ? body.data : g)),
			);
			setEditingGroup(null);
		}
	}

	async function handleDelete(groupId: string) {
		const { body } = await apiFetch(`/groups/${groupId}`, { method: "DELETE" });
		if (body?.success) {
			setGroups((prev) => prev.filter((g) => g.groupId !== groupId));
			setDeletingGroupId(null);
		}
	}

	if (loadState === "unauthorized") {
		return (
			<section className="p-6 text-center text-stone-500">
				<p className="mb-3">Please log in to view groups.</p>
				<Link to="/login" className="text-green-700 font-semibold underline">
					Go to login
				</Link>
			</section>
		);
	}

	return (
		<section className="p-6">
			{isModalOpen && (
				<CreateGroupModal
					initialData={null}
					subjects={subjects}
					teachers={teachers}
					students={students}
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleCreate}
				/>
			)}
			{editingGroup && (
				<CreateGroupModal
					initialData={editingGroup}
					subjects={subjects}
					teachers={teachers}
					students={students}
					onClose={() => setEditingGroup(null)}
					onSubmit={(payload) => handleUpdate(editingGroup.groupId, payload)}
				/>
			)}
			{deletingGroupId && (
				<ConfirmModal
					onConfirm={() => handleDelete(deletingGroupId)}
					onClose={() => setDeletingGroupId(null)}
				/>
			)}
			<div className="flex justify-between items-center mb-4">
				<h1 className="font-heading text-2xl font-bold text-green-800">
					Groups
				</h1>
				<input
					type="text"
					placeholder="Search Group / Teacher / Subject ..."
					value={selectedQuery}
					onChange={(e) => setSelectedQuery(e.target.value)}
					className="border border-stone-300 focus:border-green-500 rounded-xl px-3 py-2 outline-none transition-colors"
				/>
			</div>
			{mockUser.role === "admin" && (
				<div className="flex justify-items-start mb-4">
					<button
						type="button"
						className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2"
						onClick={() => setIsModalOpen(true)}
					>
						<PlusCircle size={18} />
						Create Group
					</button>
				</div>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
				{groups
					.filter(
						(g) =>
							g.groupName.toLowerCase().includes(selectedQuery.toLowerCase()) ||
							(g.teacherName ?? "")
								.toLowerCase()
								.includes(selectedQuery.toLowerCase()) ||
							(g.subjectName ?? "")
								.toLowerCase()
								.includes(selectedQuery.toLowerCase()),
					)
					.map((g, i) => (
						<Link
							key={g.groupId}
							to="/groups/$groupId/sessions"
							params={{ groupId: g.groupId }}
							className={`animate-fade-slide-up
					rounded-2xl
					text-white p-5 cursor-pointer
					transition-all duration-200
					hover:-translate-y-1 hover:scale-[1.02]
					hover:shadow-xl flex flex-col gap-4
				${g.isActive === false ? "bg-stone-400" : "bg-green-700"}`}
							style={{ animationDelay: `${i * 80}ms` }}
						>
							<div>
								<div className="font-heading font-semibold text-lg">
									{g.groupName}
								</div>
								<div className="text-sm text-green-100">
									{g.subjectName ?? "No subject"} •{" "}
									{g.teacherName ?? "No teacher assigned"}
								</div>
							</div>

							<div className="flex items-center gap-2 text-xs text-green-100">
								<Calendar size={14} />
								<span>{formatDateRange(g.startDate, g.endDate)}</span>
							</div>

							<div className="flex flex-wrap gap-1.5">
								{g.plannedSessions.length === 0 ? (
									<span className="text-xs text-green-200 italic">
										No planned sessions yet
									</span>
								) : (
									g.plannedSessions.map((p) => (
										<span
											key={`${p.dayOfWeek}-${p.time}`}
											className="flex items-center gap-1 bg-white/15 text-xs font-medium px-2 py-1 rounded-full"
										>
											<Clock size={11} />
											{DAY_ABBREV[p.dayOfWeek] ?? p.dayOfWeek}{" "}
											{formatTime(p.time)}
										</span>
									))
								)}
							</div>

							<div className="flex items-center justify-between mt-auto pt-3 border-t border-white/20">
								<div className="flex items-baseline gap-2">
									<span className="text-3xl font-bold">
										{g.studentIds.length}
									</span>
									<span className="text-sm">
										{g.studentIds.length === 1 ? "Student" : "Students"}
									</span>
								</div>
								{mockUser.role === "admin" && (
									<div className="flex gap-3 text-green-100">
										<Pencil
											size="18"
											className="hover:text-white cursor-pointer"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setEditingGroup(g);
											}}
										/>
										<Ban
											size="18"
											className="hover:text-white cursor-pointer"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setDeletingGroupId(g.groupId);
											}}
										/>
									</div>
								)}
							</div>
						</Link>
					))}
			</div>
		</section>
	);
}
