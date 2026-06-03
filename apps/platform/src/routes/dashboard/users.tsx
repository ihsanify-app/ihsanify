import { createFileRoute } from "@tanstack/react-router";
import {
	Ban,
	CheckCircle,
	Pencil,
	PlusCircle,
	User,
	UserCheck,
	XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { mockUser } from "../../lib/mockAuth";
import { mockUsers } from "../../lib/mockData";

export const Route = createFileRoute("/dashboard/users")({
	component: RouteComponent,
});

function CreateGroupModal({
	initialData,
	onClose,
	onSubmit,
}: {
	initialData: [];
	onClose: () => void;
	onSubmit: (newUser: {
		name: string;
		email: string;
		role: "teacher" | "student";
		gender: "male" | "female";
		isActive: true;
	}) => void;
}) {
	const [name, setName] = useState(initialData?.name ?? "");
	const [email, setEmail] = useState(initialData?.email ?? "");
	const [role, setRole] = useState(initialData?.role ?? "");
	const [gender, setGender] = useState(initialData?.gender ?? "");
	const dropdownRef = useRef<HTMLDivElement>(null);

	// function toggleStudent(id: string) {
	// 	setSelectedStudentIds((prev) =>
	// 		prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
	// 	);
	// }

	// useEffect(() => {
	// 	function handleClickOutside(e: MouseEvent) {
	// 		if (
	// 			dropdownRef.current &&
	// 			!dropdownRef.current.contains(e.target as Node)
	// 		) {
	// 			setIsStudentDropdownOpen(false);
	// 		}
	// 	}
	// 	if (isStudentDropdownOpen) {
	// 		document.addEventListener("click", handleClickOutside);
	// 	}
	// 	return () => document.removeEventListener("click", handleClickOutside);
	// }, [isStudentDropdownOpen]);

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
				className="bg-white rounded-lg p-6 w-96 gap-1"
				onClick={(e) => e.stopPropagation()}
			>
				<h2>Create User</h2>
				<form>
					<div className="flex flex-col gap-2">
						<input
							className="border rounded-md p-2 text-sm"
							placeholder="e.g. Ibrahim"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<input
							className="border rounded-md p-2 text-sm"
							placeholder="e.g. admin@ihsanify.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<select
							className="border rounded-md p-2 text-sm"
							value={role}
							onChange={(e) => setRole(e.target.value)}
						>
							<option value="">Select Role</option>
							<option value="teacher">Teacher</option>
							<option value="student">Student</option>
						</select>
						<select
							className="border rounded-md p-2 text-sm"
							value={gender}
							onChange={(e) => setGender(e.target.value)}
						>
							<option value="">Select teacher</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
						</select>
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
								groupId: initialData?.userId ?? Date.now().toString(),
								name,
								email,
								role,
								gender,
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
	const [users, setUsers] = useState(mockUsers);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState(null);

	return (
		<section className="m-10">
			{isModalOpen && (
				<CreateGroupModal
					initialData={editingUser}
					onClose={() => setIsModalOpen(false)}
					onSubmit={(newUser) => {
						setUsers((prev) => [...prev, newUser]);
						setIsModalOpen(false);
					}}
				/>
			)}
			{editingUser && (
				<CreateGroupModal
					initialData={editingUser}
					onClose={() => setEditingUser(null)}
					onSubmit={(updated) => {
						setUsers((prev) =>
							prev.map((g) => (g.userId === updated.userId ? updated : g)),
						);
						setEditingUser(null);
					}}
				/>
			)}
			<div>
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
							Create User
						</button>
					</div>
				)}
				<div className="mt-3 border border-green-800 min-h-screen rounded-lg p-2">
					<table className="w-full">
						<thead className="bg-green-800 text-white uppercase">
							<tr>
								<th className="px-4 py-3 text-left">User ID</th>
								<th className="px-4 py-3 text-left">Name</th>
								<th className="px-4 py-3 text-left">Role</th>
								<th className="px-4 py-3 text-left">Teacher ID</th>
								<th className="px-4 py-3 text-left">Student ID</th>
								<th className="px-4 py-3 text-left">Subject</th>
								<th className="px-4 py-3 text-left">Active</th>
								<th className="px-4 py-3 text-left">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-300">
							{users.map((u) => (
								<tr
									key={u.userId}
									className={u.isActive ? "hover:bg-green-100" : "bg-red-100"}
								>
									<td className="px-4 py-3">{u.userId}</td>
									<td className="px-4 py-3">{u.name}</td>
									<td className="px-4 py-3">{u.role}</td>
									<td className="px-4 py-3">
										{u.teacherId ? (
											<div className="flex flex-row gap-3">
												<User size={16} className="text-blue-600" />
												<span>{u.teacherId}</span>
											</div>
										) : (
											<div className="flex flex-row gap-3">
												<span>-</span>
											</div>
										)}
									</td>
									<td className="px-4 py-3">
										{u.studentId ? (
											<div className="flex flex-row gap-3">
												<UserCheck size={16} className="text-green-600" />
												<span>{u.studentId}</span>
											</div>
										) : (
											<div className="flex flex-row gap-3">
												<span>-</span>
											</div>
										)}
									</td>
									<td className="px-4 py-3">
										<div className="grid grid-rows gap-1">
											{u.subjectIds
												? u.subjectIds.map((s) => (
														<div
															key={s.subjectId}
															className={
																s.subjectName === "Calistung"
																	? "bg-purple-800 text-white w-fit p-1 rounded-md"
																	: s.subjectName === "Tahsin"
																		? "bg-blue-800 text-white rounded-md w-fit p-1"
																		: s.subjectName === "Tahfizh"
																			? "bg-green-800 text-white w-fit p-1 rounded-md"
																			: s.subjectName === "Bahasa Arab"
																				? "bg-red-800 text-white w-fit p-1 rounded-md"
																				: s.subjectName === "Bahasa Inggris"
																					? "bg-yellow-600 text-white w-fit p-1 rounded-md"
																					: "bg-gray-400 text-white w-fit p-1 rounded-md"
															}
														>
															{s.subjectName}
														</div>
													))
												: "-"}
										</div>
									</td>
									<td className="px-4 py-3 flex flex-row items-center gap-2">
										{u.isActive ? (
											<CheckCircle size={16} className="text-green-600" />
										) : (
											<XCircle size={16} className="text-red-600" />
										)}
										<button
											type="button"
											className={`cursor-pointer rounded-lg border-gray-400 shadow-2xl p-1 hover:text-white ${u.isActive ? "hover:bg-green-800" : "hover:bg-red-800"}`}
											onClick={() =>
												setUsers((prev) =>
													prev.map((user) =>
														user.userId === u.userId
															? { ...user, isActive: !u.isActive }
															: user,
													),
												)
											}
										>
											{u.isActive ? (
												<span>Deactivate</span>
											) : (
												<span>Activate</span>
											)}
										</button>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-row gap-3">
											<button
												type="button"
												onClick={() => setEditingUser(true)}
											>
												<Pencil
													size={16}
													className="text-green-600 hover:cursor-pointer"
												/>
												<span>Edit</span>
											</button>
										</div>
										<div className="flex flex-row gap-3">
											<Ban
												size={16}
												className="text-red-600 hover:cursor-pointer"
											/>
											<span>Delete</span>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}
