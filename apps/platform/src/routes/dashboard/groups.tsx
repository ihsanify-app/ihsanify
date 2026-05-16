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
			className="fixed inset-0 bg-black/50 flex items-center justify-center font-bold z-50"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-lg p-6 w-96"
				onClick={(e) => e.stopPropagation()}
			>
				<h2>Create Group</h2>
				<form>
					<div className="flex flex-col gap-2">
						<input
							className="border rounded-md p-2 text-sm"
							placeholder="e.g. Tahsin Dasar 01"
							value={groupName}
							onChange={(e) => setGroupName(e.target.value)}
						/>
						<select
							className="border rounded-md p-2 text-sm"
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
							className="border rounded-md p-2 text-sm"
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
								className="border rounded-md p-2 text-sm cursor-pointer min-h-9 w-full text-left"
							>
								{selectedStudentIds.length === 0
									? "Select Students"
									: mockStudents
											.filter((s) => selectedStudentIds.includes(s.studentId))
											.map((s) => s.studentName)
											.join(", ")}
							</button>
							{isStudentDropdownOpen && (
								<div className="border rounded-md mt-1 p-2 grid grid-cols-3 gap-1 max-h-30 overflow-y-auto">
									{mockStudents.map((s) => (
										<label
											key={s.studentId}
											onClick={(e) => e.stopPropagation()}
											onKeyDown={(e) => e.stopPropagation()}
											className="flex items-center gap-2 text-sm cursor-pointer hover:text-green-800 hover:underline"
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
						className="cursor-pointer rounded-lg border shadow-2xl p-2 hover:bg-green-800 hover:text-white"
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
						className="cursor-pointer rounded-lg border shadow-2xl p-2 hover:bg-green-800 hover:text-white"
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
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-xl font-bold">Groups</h1>
				<input
					type="text"
					placeholder="Search Group / Teacher / Subject ..."
					value={selectedQuery}
					onChange={(e) => setSelectedQuery(e.target.value)}
					className="border rounded-md p-2"
				/>
			</div>
			{mockUser.role === "admin" && (
				<div className="flex justify-items-start mb-4">
					<button
						type="button"
						className="flex font-bold items-center gap-2 cursor-pointer hover:text-white hover:bg-green-800 hover:rounded-md p-2"
						onClick={() => setIsModalOpen(true)}
					>
						<PlusCircle
							size={18}
							className="cursor-pointer hover:bg-yellow-400 rounded-full"
						/>
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
					border rounded-lg
					text-white p-5 cursor-pointer
					transition-all duration-200
					hover:-translate-y-1 hover:scale-105
					hover:shadow-xl flex flex-col gap-3
				${g.isActive === false ? "bg-gray-400" : "bg-green-800"}`}
							style={{ animationDelay: `${i * 80}ms` }}
						>
							<div className="font-semibold">{g.groupName}</div>
							<div className="text-sm">{g.teacherName}</div>
							<div className="flex flex-row gap-3">
								<div className="text-4xl text-white font-bold hover:text-yellow-400">
									{g.studentIds.length}{" "}
								</div>
								<div className="items-baseline">
									{g.studentIds.length === 1 ? "Student" : "Students"}
								</div>
							</div>
							{mockUser.role === "admin" && (
								<div className="flex justify-end gap-3">
									<Pencil
										size="18"
										className="hover:text-yellow-400"
										onClick={() => setEditingGroup(g)}
									/>
									<Ban size="18" className="hover:text-yellow-400" />
								</div>
							)}
						</div>
					))}
			</div>
		</section>
	);
}
