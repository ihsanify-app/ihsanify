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
		userId: string;
		name: string;
		email: string;
		role: "teacher" | "student";
		teacherId: string | null;
		studentId: string | null;
		gender: "male" | "female";
		isActive: true;
	}) => void;
}) {
	const [name, setName] = useState(initialData?.name ?? "");
	const [email, setEmail] = useState(initialData?.email ?? "");
	const [role, setRole] = useState(initialData?.role ?? "");
	const [gender, setGender] = useState(initialData?.gender ?? "");
	const [userId, setUserId] = useState(initialData?.userId ?? "");
	const [studentId, setStudentId] = useState(initialData?.studentId ?? "");
	const [teacherId, setTeacherId] = useState(initialData?.teacherId ?? "");
	const _dropdownRef = useRef<HTMLDivElement>(null);

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
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-96 gap-1 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-3">
					Create User
				</h2>
				<form>
					<div className="flex flex-col gap-2">
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							placeholder="e.g. usr-01"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
						/>
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							placeholder="e.g. Ibrahim"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							placeholder="e.g. admin@ihsanify.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={role}
							onChange={(e) => {
								setRole(e.target.value);
								setTeacherId("");
								setStudentId("");
							}}
						>
							<option value="">Select Role</option>
							<option value="teacher">Teacher</option>
							<option value="student">Student</option>
						</select>
						{role === "teacher" && (
							<input
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
								placeholder="e.g. te-01"
								value={teacherId}
								onChange={(e) => setTeacherId(e.target.value)}
							/>
						)}
						{role === "student" && (
							<input
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
								placeholder="e.g. st-01"
								value={studentId}
								onChange={(e) => setStudentId(e.target.value)}
							/>
						)}
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={gender}
							onChange={(e) => setGender(e.target.value)}
						>
							<option value="">Select Gender</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
						</select>
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
								userId, //initialData?.userId ?? Date.now().toString(),
								name,
								email,
								role,
								studentId,
								teacherId,
								gender,
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
							className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2"
							onClick={() => setIsModalOpen(true)}
						>
							<PlusCircle size={18} />
							Create User
						</button>
					</div>
				)}
				<div className="mt-3 border border-green-100 min-h-screen rounded-2xl overflow-hidden bg-white shadow-sm">
					<table className="w-full">
						<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
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
						<tbody className="divide-y divide-stone-100">
							{users.map((u) => (
								<tr
									key={u.userId}
									className={u.isActive ? "hover:bg-green-50" : "bg-rose-50"}
								>
									<td className="px-4 py-3">{u.userId}</td>
									<td className="px-4 py-3">{u.name}</td>
									<td className="px-4 py-3 capitalize">{u.role}</td>
									<td className="px-4 py-3">
										{u.teacherId ? (
											<div className="flex flex-row items-center gap-2">
												<User size={16} className="text-sky-600" />
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
											<div className="flex flex-row items-center gap-2">
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
																	? "bg-violet-100 text-violet-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																	: s.subjectName === "Tahsin"
																		? "bg-sky-100 text-sky-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																		: s.subjectName === "Tahfizh"
																			? "bg-green-100 text-green-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																			: s.subjectName === "Bahasa Arab"
																				? "bg-rose-100 text-rose-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																				: s.subjectName === "Bahasa Inggris"
																					? "bg-amber-100 text-amber-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																					: "bg-stone-100 text-stone-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
															}
														>
															{s.subjectName}
														</div>
													))
												: "-"}
										</div>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-row items-center gap-2">
											{u.isActive ? (
												<CheckCircle size={16} className="text-green-600" />
											) : (
												<XCircle size={16} className="text-rose-500" />
											)}
											<button
												type="button"
												className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
													u.isActive
														? "bg-green-100 text-green-700 hover:bg-green-200"
														: "bg-rose-100 text-rose-700 hover:bg-rose-200"
												}`}
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
												{u.isActive ? "Deactivate" : "Activate"}
											</button>
										</div>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-row gap-3">
											<button
												type="button"
												className="flex items-center gap-1 text-green-700 hover:text-green-800 cursor-pointer"
												onClick={() => setEditingUser(u)}
											>
												<Pencil size={16} />
												<span>Edit</span>
											</button>
											<button
												type="button"
												className="flex items-center gap-1 text-rose-500 hover:text-rose-600 cursor-pointer"
											>
												<Ban size={16} />
												<span>Delete</span>
											</button>
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
