import { createFileRoute } from "@tanstack/react-router";
import { Ban, Pencil, PlusCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { mockUser } from "../../lib/mockAuth";
import {
	mockGroups,
	mockStudents,
	mockSubjects,
	mockTeachers,
} from "../../lib/mockData";

export const Route = createFileRoute("/dashboard/groups")({
	component: RouteComponent,
});

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
	onClose,
	onSubmit,
}: {
	initialData: [];
	onClose: () => void;
	onSubmit: (newGroup: {
		groupId: string;
		groupName: string;
		subjectId: string;
		teacherId: string;
		teacherName: string;
		studentIds: [];
		isActive: true;
	}) => void;
}) {
	const [groupName, setGroupName] = useState(initialData?.groupName ?? "");
	const [subjectId, setSubjectId] = useState(initialData?.subjectId ?? "");
	const [teacherId, setTeacherId] = useState(initialData?.teacherId ?? "");
	const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
		initialData?.studentIds.map((s) => s.studentId) ?? [],
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
				className="bg-white rounded-2xl p-6 w-96 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-3">
					Create Group
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
							{mockSubjects.map((s) => (
								<option key={s.subjectId} value={s.subjectId}>
									{s.subjectName}
								</option>
							))}
						</select>
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={teacherId}
							onChange={(e) => setTeacherId(e.target.value)}
						>
							<option value="">Select teacher</option>
							{mockTeachers.map((t) => (
								<option key={t.teacherId} value={t.teacherId}>
									{t.teacherName}
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
									: mockStudents
											.filter((s) => selectedStudentIds.includes(s.studentId))
											.map((s) => s.studentName)
											.join(", ")}
							</button>
							{isStudentDropdownOpen && (
								<div className="border border-stone-200 rounded-xl mt-1 p-2 grid grid-cols-3 gap-1 max-h-30 overflow-y-auto">
									{mockStudents.map((s) => (
										<label
											key={s.studentId}
											onClick={(e) => e.stopPropagation()}
											onKeyDown={(e) => e.stopPropagation()}
											className="flex items-center gap-2 text-sm cursor-pointer text-stone-600 hover:text-green-700"
										>
											<input
												type="checkbox"
												onChange={() => toggleStudent(s.studentId)}
												checked={selectedStudentIds.includes(s.studentId)}
											/>
											{s.studentName}
										</label>
									))}
								</div>
							)}
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
								groupId: initialData?.groupId ?? Date.now().toString(),
								groupName,
								subjectId,
								subjectName: mockSubjects.find((s) => subjectId === s.subjectId)
									?.subjectName,
								teacherId,
								teacherName: mockTeachers.find((t) => teacherId === t.teacherId)
									?.teacherName,
								studentIds: mockStudents.filter((s) =>
									selectedStudentIds.includes(s.studentId),
								),
								isActive: true,
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
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedQuery, setSelectedQuery] = useState("");
	const [groups, setGroups] = useState(mockGroups);
	const [editingGroup, setEditingGroup] = useState(null);
	const [deletingGroupId, setDeletingGroupId] = useState(null);

	return (
		<section className="p-6">
			{isModalOpen && (
				<CreateGroupModal
					initialData={editingGroup}
					onClose={() => setIsModalOpen(false)}
					onSubmit={(newGroup) => {
						setGroups((prev) => [...prev, newGroup]);
						setIsModalOpen(false);
					}}
				/>
			)}
			{editingGroup && (
				<CreateGroupModal
					initialData={editingGroup}
					onClose={() => setEditingGroup(null)}
					onSubmit={(updated) => {
						setGroups((prev) =>
							prev.map((g) => (g.groupId === updated.groupId ? updated : g)),
						);
						setEditingGroup(null);
					}}
				/>
			)}
			{deletingGroupId && (
				<ConfirmModal
					onConfirm={() => {
						setGroups((prev) =>
							prev.filter((g) => g.groupId !== deletingGroupId),
						);
						setDeletingGroupId(null);
					}}
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

			<div className="grid grid-cols-3 gap-4">
				{groups
					.filter(
						(g) =>
							g.groupName.toLowerCase().includes(selectedQuery.toLowerCase()) ||
							g.teacherName
								.toLowerCase()
								.includes(selectedQuery.toLowerCase()) ||
							g.subjectName.toLowerCase().includes(selectedQuery.toLowerCase()),
					)
					.map((g, i) => (
						<div
							key={g.groupId}
							className={`animate-fade-slide-up
					rounded-2xl
					text-white p-5 cursor-pointer
					transition-all duration-200
					hover:-translate-y-1 hover:scale-105
					hover:shadow-xl flex flex-col gap-3
				${g.isActive === false ? "bg-stone-400" : "bg-green-700"}`}
							style={{ animationDelay: `${i * 80}ms` }}
						>
							<div className="font-heading font-semibold">{g.groupName}</div>
							<div className="text-sm text-green-100">{g.teacherName}</div>
							<div className="flex flex-row gap-3 items-baseline">
								<div className="text-4xl font-bold">{g.studentIds.length} </div>
								<div>{g.studentIds.length === 1 ? "Student" : "Students"}</div>
							</div>
							{mockUser.role === "admin" && (
								<div className="flex justify-end gap-3 text-green-100">
									<Pencil
										size="18"
										className="hover:text-white cursor-pointer"
										onClick={() => setEditingGroup(g)}
									/>
									<Ban
										size="18"
										className="hover:text-white cursor-pointer"
										onClick={() => setDeletingGroupId(g.groupId)}
									/>
								</div>
							)}
						</div>
					))}
			</div>
		</section>
	);
}
