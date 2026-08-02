import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Ban,
	CheckCircle,
	Pencil,
	PlusCircle,
	User,
	UserCheck,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { mockUser } from "../../lib/mockAuth";

export const Route = createFileRoute("/dashboard/users")({
	component: RouteComponent,
});

type AppUser = {
	userId: string;
	name: string;
	email: string;
	role: "teacher" | "student";
	gender: "male" | "female" | null;
	teacherId: string | null;
	studentId: string | null;
	subjectIds: { subjectId: string; subjectName: string }[];
	isActive: boolean;
};

function CreateUserModal({
	initialData,
	onClose,
	onSubmit,
}: {
	initialData: AppUser | null;
	onClose: () => void;
	onSubmit: (payload: {
		name: string;
		email: string;
		password?: string;
		role: "teacher" | "student";
		gender: "male" | "female";
	}) => void;
}) {
	const [name, setName] = useState(initialData?.name ?? "");
	const [email, setEmail] = useState(initialData?.email ?? "");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState(initialData?.role ?? "");
	const [gender, setGender] = useState(initialData?.gender ?? "");

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
					{initialData ? "Edit User" : "Create User"}
				</h2>
				<form>
					<div className="flex flex-col gap-2">
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
						{!initialData && (
							<input
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
								placeholder="Initial password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						)}
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors disabled:bg-stone-100 disabled:text-stone-400"
							value={role}
							onChange={(e) => setRole(e.target.value as "teacher" | "student")}
							disabled={!!initialData}
						>
							<option value="">Select Role</option>
							<option value="teacher">Teacher</option>
							<option value="student">Student</option>
						</select>
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={gender}
							onChange={(e) => setGender(e.target.value as "male" | "female")}
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
								name,
								email,
								...(password ? { password } : {}),
								role: role as "teacher" | "student",
								gender: gender as "male" | "female",
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
	const [users, setUsers] = useState<AppUser[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<AppUser | null>(null);

	useEffect(() => {
		apiFetch("/users").then(({ status, body }) => {
			if (status === 401 || status === 403) {
				setLoadState("unauthorized");
				return;
			}
			setUsers(body?.data ?? []);
			setLoadState("ready");
		});
	}, []);

	async function handleCreate(payload: {
		name: string;
		email: string;
		password?: string;
		role: "teacher" | "student";
		gender: "male" | "female";
	}) {
		const { body } = await apiFetch("/users", {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (body?.success) {
			setUsers((prev) => [...prev, body.data]);
			setIsModalOpen(false);
		}
	}

	async function handleUpdate(
		userId: string,
		payload: { name: string; email: string; gender: "male" | "female" },
	) {
		const { body } = await apiFetch(`/users/${userId}`, {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
		if (body?.success) {
			setUsers((prev) =>
				prev.map((u) => (u.userId === userId ? body.data : u)),
			);
			setEditingUser(null);
		}
	}

	async function handleToggleActive(user: AppUser) {
		const { body } = await apiFetch(`/users/${user.userId}`, {
			method: "PATCH",
			body: JSON.stringify({ isActive: !user.isActive }),
		});
		if (body?.success) {
			setUsers((prev) =>
				prev.map((u) => (u.userId === user.userId ? body.data : u)),
			);
		}
	}

	if (loadState === "unauthorized") {
		return (
			<section className="m-10 text-center text-stone-500">
				<p className="mb-3">
					You need to be logged in as an admin to view this page.
				</p>
				<Link to="/login" className="text-green-700 font-semibold underline">
					Go to login
				</Link>
			</section>
		);
	}

	return (
		<section className="m-10">
			{isModalOpen && (
				<CreateUserModal
					initialData={null}
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleCreate}
				/>
			)}
			{editingUser && (
				<CreateUserModal
					initialData={editingUser}
					onClose={() => setEditingUser(null)}
					onSubmit={(payload) => handleUpdate(editingUser.userId, payload)}
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
								<th className="px-4 py-3 text-left">Name</th>
								<th className="px-4 py-3 text-left">Email</th>
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
									<td className="px-4 py-3">{u.name}</td>
									<td className="px-4 py-3">{u.email}</td>
									<td className="px-4 py-3 capitalize">{u.role}</td>
									<td className="px-4 py-3">
										{u.teacherId ? (
											<div className="flex flex-row items-center gap-2">
												<User size={16} className="text-sky-600" />
												<span className="truncate max-w-24" title={u.teacherId}>
													{u.teacherId}
												</span>
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
												<span className="truncate max-w-24" title={u.studentId}>
													{u.studentId}
												</span>
											</div>
										) : (
											<div className="flex flex-row gap-3">
												<span>-</span>
											</div>
										)}
									</td>
									<td className="px-4 py-3">
										<div className="grid grid-rows gap-1">
											{u.subjectIds.length > 0
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
												onClick={() => handleToggleActive(u)}
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
