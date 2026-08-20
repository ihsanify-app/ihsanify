import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Ban,
	CheckCircle,
	Pencil,
	User,
	UserCheck,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsTabs } from "../../../components/dashboard/SettingsTabs";
import { apiFetch } from "../../../lib/apiClient";

export const Route = createFileRoute("/_app/settings_/user")({
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
	studentNumber: number | null;
	isActive: boolean;
	avatarUrl: string | null;
};

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

function EditUserModal({
	user,
	onClose,
	onSubmit,
}: {
	user: AppUser;
	onClose: () => void;
	onSubmit: (payload: {
		name: string;
		email: string;
		gender: "male" | "female";
	}) => void;
}) {
	const [name, setName] = useState(user.name);
	const [email, setEmail] = useState(user.email);
	const [gender, setGender] = useState(user.gender ?? "male");

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
				<h2 className="font-heading text-lg text-green-800 mb-3">Edit User</h2>
				<form>
					<div className="flex flex-col gap-2">
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={gender}
							onChange={(e) => setGender(e.target.value as "male" | "female")}
						>
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
						onClick={() => onSubmit({ name, email, gender })}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
					>
						Save Changes
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
	const [errorMessage, setErrorMessage] = useState("");
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
		} else {
			setErrorMessage(body?.message ?? "Could not update user.");
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
		} else {
			setErrorMessage(body?.message ?? "Could not update user.");
		}
	}

	async function handleStudentNumberChange(userId: string, value: string) {
		const studentNumber = value === "" ? null : Number(value);
		const { body } = await apiFetch(`/users/${userId}`, {
			method: "PATCH",
			body: JSON.stringify({ studentNumber }),
		});
		if (body?.success) {
			setUsers((prev) =>
				prev.map((u) => (u.userId === userId ? body.data : u)),
			);
			setErrorMessage("");
		} else {
			setErrorMessage(body?.message ?? "Could not update student number.");
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
			{editingUser && (
				<EditUserModal
					user={editingUser}
					onClose={() => setEditingUser(null)}
					onSubmit={(payload) => handleUpdate(editingUser.userId, payload)}
				/>
			)}

			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Settings
			</h1>
			<SettingsTabs active="user" />

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			{loadState === "loading" ? (
				<p className="text-stone-400">Loading…</p>
			) : (
				<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm">
					<table className="w-full">
						<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
							<tr>
								<th className="px-4 py-3 text-left">Name</th>
								<th className="px-4 py-3 text-left">Username</th>
								<th className="px-4 py-3 text-left">Role</th>
								<th className="px-4 py-3 text-left">Teacher ID</th>
								<th className="px-4 py-3 text-left">Student ID</th>
								<th className="px-4 py-3 text-left">Student Number</th>
								<th className="px-4 py-3 text-left">Active</th>
								<th className="px-4 py-3 text-left">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{users.length === 0 && (
								<tr>
									<td
										colSpan={8}
										className="px-4 py-6 text-center text-stone-400 italic"
									>
										No users yet.
									</td>
								</tr>
							)}
							{users.map((u) => (
								<tr
									key={u.userId}
									className={u.isActive ? "hover:bg-green-50" : "bg-rose-50"}
								>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-green-200 bg-green-50 flex items-center justify-center text-green-700 text-xs font-heading font-bold">
												{u.avatarUrl ? (
													<img
														src={u.avatarUrl}
														alt={u.name}
														className="h-full w-full object-cover"
													/>
												) : (
													initials(u.name)
												)}
											</div>
											{u.name}
										</div>
									</td>
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
											<span>-</span>
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
											<span>-</span>
										)}
									</td>
									<td className="px-4 py-3">
										{u.role === "student" ? (
											<input
												key={u.studentNumber ?? ""}
												type="number"
												min={0}
												max={999}
												placeholder="e.g. 001"
												className="w-24 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
												defaultValue={u.studentNumber ?? ""}
												onBlur={(e) => {
													const value = e.target.value;
													if (
														Number(value || 0) !== (u.studentNumber ?? 0) ||
														(value === "" && u.studentNumber !== null)
													) {
														handleStudentNumberChange(u.userId, value);
													}
												}}
											/>
										) : (
											<span>-</span>
										)}
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
			)}
		</section>
	);
}
