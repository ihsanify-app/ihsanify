import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Ban,
	Check,
	CheckCircle,
	Copy,
	KeyRound,
	Pencil,
	PlusCircle,
	Upload,
	User,
	UserCheck,
	XCircle,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { SettingsTabs } from "../../../components/dashboard/SettingsTabs";
import { useToast } from "../../../components/Toast";
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

type GroupTypeKey = "group" | "private" | "semi_private";

const RATE_GROUP_TYPES: { key: GroupTypeKey; label: string }[] = [
	{ key: "group", label: "Group" },
	{ key: "private", label: "Private" },
	{ key: "semi_private", label: "Semi-Private" },
];

function TeacherRatesEditor({ teacherId }: { teacherId: string }) {
	const [rates, setRates] = useState<Record<GroupTypeKey, string>>({
		group: "",
		private: "",
		semi_private: "",
	});
	const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
		"idle",
	);

	useEffect(() => {
		apiFetch(`/teachers/${teacherId}/rates`).then(({ status, body }) => {
			if (status !== 200) return;
			const byType = new Map<string, number>(
				(body?.data ?? []).map(
					(r: { groupType: string; monthlyRate: number }) => [
						r.groupType,
						r.monthlyRate,
					],
				),
			);
			setRates({
				group: byType.has("group") ? String(byType.get("group")) : "",
				private: byType.has("private") ? String(byType.get("private")) : "",
				semi_private: byType.has("semi_private")
					? String(byType.get("semi_private"))
					: "",
			});
		});
	}, [teacherId]);

	async function saveRates(next: Record<GroupTypeKey, string>) {
		setSaveState("saving");
		await apiFetch(`/teachers/${teacherId}/rates`, {
			method: "PATCH",
			body: JSON.stringify({
				rates: RATE_GROUP_TYPES.map(({ key }) => ({
					groupType: key,
					monthlyRate: Number(next[key] || 0),
				})),
			}),
		});
		setSaveState("saved");
	}

	return (
		<div className="mt-2 rounded-xl border border-stone-200 p-3">
			<p className="mb-2 text-xs font-semibold text-stone-500">
				Monthly rate per group type (Payroll)
			</p>
			<div className="flex flex-col gap-2">
				{RATE_GROUP_TYPES.map(({ key, label }) => (
					<label key={key} className="flex items-center gap-2 text-sm">
						<span className="w-28 shrink-0 text-stone-600">{label}</span>
						<input
							type="number"
							min={0}
							placeholder="e.g. 100000"
							className="flex-1 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={rates[key]}
							onChange={(e) => {
								const next = { ...rates, [key]: e.target.value };
								setRates(next);
								setSaveState("idle");
							}}
							onBlur={() => saveRates(rates)}
						/>
					</label>
				))}
			</div>
			{saveState === "saving" && (
				<p className="mt-1 text-xs text-stone-400">Saving…</p>
			)}
			{saveState === "saved" && (
				<p className="mt-1 text-xs text-green-600">Saved</p>
			)}
		</div>
	);
}

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

const MAX_AVATAR_BYTES = 300 * 1024;
const ACCEPTED_AVATAR_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
];

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

function CreateUserModal({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (payload: {
		name: string;
		email: string;
		password: string;
		role: "teacher" | "student";
		gender: "male" | "female";
		avatarUrl?: string | null;
	}) => Promise<boolean>;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState("");
	const [gender, setGender] = useState("");
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [avatarError, setAvatarError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const canSubmit =
		name.trim().length > 0 &&
		email.trim().length > 0 &&
		password.length >= 6 &&
		(role === "teacher" || role === "student") &&
		(gender === "male" || gender === "female");

	async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
			setAvatarError("Only PNG, JPEG, WEBP, or GIF images are allowed.");
			return;
		}
		if (file.size > MAX_AVATAR_BYTES) {
			setAvatarError("Image must be smaller than 300KB.");
			return;
		}
		setAvatarError("");
		setAvatarUrl(await fileToDataUrl(file));
	}

	async function handleSubmit() {
		if (!canSubmit) return;
		setIsSubmitting(true);
		await onSubmit({
			name: name.trim(),
			email: email.trim(),
			password,
			role: role as "teacher" | "student",
			gender: gender as "male" | "female",
			avatarUrl,
		});
		setIsSubmitting(false);
	}

	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-full max-w-md gap-1 shadow-xl max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-3">
					Create User
				</h2>
				<form>
					<div className="flex flex-col items-center gap-2 mb-3">
						<div className="relative">
							<div className="h-20 w-20 overflow-hidden rounded-full border-2 border-green-200 bg-green-50 flex items-center justify-center text-green-700 font-heading font-bold text-xl">
								{avatarUrl ? (
									<img
										src={avatarUrl}
										alt="Avatar preview"
										className="h-full w-full object-cover"
									/>
								) : (
									initials(name || "?")
								)}
							</div>
							<label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-green-600 text-white shadow-sm hover:bg-green-700 transition-colors">
								<Upload size={14} />
								<input
									type="file"
									accept={ACCEPTED_AVATAR_TYPES.join(",")}
									className="hidden"
									onChange={handleAvatarChange}
								/>
							</label>
						</div>
						{avatarUrl && (
							<button
								type="button"
								className="text-xs text-rose-500 hover:text-rose-600 cursor-pointer font-normal"
								onClick={() => setAvatarUrl(null)}
							>
								Remove photo
							</button>
						)}
						{avatarError && (
							<span className="text-xs text-rose-500 font-normal">
								{avatarError}
							</span>
						)}
						<span className="text-xs text-stone-400 font-normal">
							PNG, JPEG, WEBP, or GIF. Max 300KB.
						</span>
					</div>
					<div className="flex flex-col gap-2">
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							placeholder="e.g. Ibrahim"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							placeholder="e.g. ibrahim@ihsanify.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							placeholder="Initial password (min. 6 characters)"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={role}
							onChange={(e) => setRole(e.target.value as "teacher" | "student")}
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
						disabled={!canSubmit || isSubmitting}
						onClick={handleSubmit}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? "Creating…" : "Create"}
					</button>
				</div>
			</div>
		</div>
	);
}

function ResetPasswordModal({
	userName,
	onClose,
	onGenerate,
}: {
	userName: string;
	onClose: () => void;
	onGenerate: () => Promise<{
		ok: boolean;
		temporaryPassword?: string;
		message?: string;
	}>;
}) {
	const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);

	async function handleGenerate() {
		setIsSubmitting(true);
		const result = await onGenerate();
		setIsSubmitting(false);
		if (result.ok && result.temporaryPassword) {
			setTemporaryPassword(result.temporaryPassword);
		} else {
			setError(result.message ?? "Could not reset password.");
		}
	}

	async function handleCopy() {
		if (!temporaryPassword) return;
		await navigator.clipboard.writeText(temporaryPassword);
		setCopied(true);
	}

	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				{temporaryPassword ? (
					<>
						<h2 className="font-heading text-lg text-green-800 mb-2">
							New password for {userName}
						</h2>
						<p className="text-sm font-normal text-stone-500 mb-3">
							Share this with them now — it won't be shown again.
						</p>
						<div className="flex items-center gap-2 mb-4">
							<code className="flex-1 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-base font-mono font-bold text-green-800 tracking-wide">
								{temporaryPassword}
							</code>
							<button
								type="button"
								onClick={handleCopy}
								className="shrink-0 cursor-pointer rounded-xl border border-stone-300 p-2.5 text-stone-600 hover:bg-stone-50 transition-colors"
								aria-label="Copy password"
							>
								{copied ? (
									<Check size={16} className="text-green-600" />
								) : (
									<Copy size={16} />
								)}
							</button>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="w-full cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
						>
							Done
						</button>
					</>
				) : (
					<>
						<h2 className="font-heading text-lg text-green-800 mb-2">
							Reset password?
						</h2>
						<p className="text-sm font-normal text-stone-500 mb-4">
							This immediately invalidates {userName}'s current password. A new
							one will be generated for you to share with them.
						</p>
						{error && (
							<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-3 font-normal">
								{error}
							</p>
						)}
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={onClose}
								className="cursor-pointer rounded-xl border border-stone-300 text-stone-600 px-4 py-2 hover:bg-stone-50 transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								disabled={isSubmitting}
								onClick={handleGenerate}
								className="cursor-pointer rounded-xl bg-rose-600 text-white px-4 py-2 hover:bg-rose-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSubmitting ? "Generating…" : "Reset Password"}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
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
				className="bg-white rounded-2xl p-6 w-[90vw] max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
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
				{user.role === "teacher" && user.teacherId && (
					<TeacherRatesEditor teacherId={user.teacherId} />
				)}
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
	const toast = useToast();
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [users, setUsers] = useState<AppUser[]>([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [editingUser, setEditingUser] = useState<AppUser | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [resettingUser, setResettingUser] = useState<AppUser | null>(null);

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
		password: string;
		role: "teacher" | "student";
		gender: "male" | "female";
		avatarUrl?: string | null;
	}) {
		const { body } = await apiFetch("/users", {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (body?.success) {
			setUsers((prev) => [...prev, body.data]);
			setIsCreateModalOpen(false);
			toast.success("User created.");
			return true;
		}
		toast.error(body?.message ?? "Could not create user.");
		return false;
	}

	async function handleResetPassword(userId: string) {
		const { body } = await apiFetch(`/users/${userId}/reset-password`, {
			method: "POST",
		});
		if (body?.success) {
			return { ok: true, temporaryPassword: body.data.temporaryPassword };
		}
		return { ok: false, message: body?.message ?? "Could not reset password." };
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
			<section className="m-3 sm:m-10 text-center text-stone-500">
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
		<section className="m-3 sm:m-10">
			{editingUser && (
				<EditUserModal
					user={editingUser}
					onClose={() => setEditingUser(null)}
					onSubmit={(payload) => handleUpdate(editingUser.userId, payload)}
				/>
			)}
			{isCreateModalOpen && (
				<CreateUserModal
					onClose={() => setIsCreateModalOpen(false)}
					onSubmit={handleCreate}
				/>
			)}
			{resettingUser && (
				<ResetPasswordModal
					userName={resettingUser.name}
					onClose={() => setResettingUser(null)}
					onGenerate={() => handleResetPassword(resettingUser.userId)}
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

			<div className="flex justify-end mb-4">
				<button
					type="button"
					className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2"
					onClick={() => setIsCreateModalOpen(true)}
				>
					<PlusCircle size={18} />
					Create User
				</button>
			</div>

			{loadState === "loading" ? (
				<p className="text-stone-400">Loading…</p>
			) : (
				<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm">
					<div className="overflow-x-auto">
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
													<span
														className="truncate max-w-24"
														title={u.teacherId}
													>
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
													<span
														className="truncate max-w-24"
														title={u.studentId}
													>
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
													className="flex items-center gap-1 text-amber-600 hover:text-amber-700 cursor-pointer"
													onClick={() => setResettingUser(u)}
												>
													<KeyRound size={16} />
													<span>Reset Password</span>
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
			)}
		</section>
	);
}
