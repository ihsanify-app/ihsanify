import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusCircle, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { mockUser } from "../../lib/mockAuth";

export const Route = createFileRoute("/_app/users")({
	component: RouteComponent,
});

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

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

type AppUser = {
	userId: string;
	name: string;
	email: string;
	role: "teacher" | "student";
	gender: "male" | "female" | null;
	subjectIds: { subjectId: string; subjectName: string }[];
	isActive: boolean;
	avatarUrl: string | null;
};

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
	}) => void;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState("");
	const [gender, setGender] = useState("");
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [avatarError, setAvatarError] = useState("");

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
				className="bg-white rounded-2xl p-6 w-[90vw] max-w-md gap-1 shadow-xl max-h-[90vh] overflow-y-auto"
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
							placeholder="e.g. admin@ihsanify.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							placeholder="Initial password"
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
						onClick={() =>
							onSubmit({
								name,
								email,
								password,
								role: role as "teacher" | "student",
								gender: gender as "male" | "female",
								avatarUrl,
							})
						}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
					>
						Create
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
			setIsModalOpen(false);
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
		<section className="m-3 sm:m-10">
			{isModalOpen && (
				<CreateUserModal
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleCreate}
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
					<div className="overflow-x-auto">
						<table className="w-full min-w-160">
							<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
								<tr>
									<th className="px-4 py-3 text-left">Name</th>
									<th className="px-4 py-3 text-left">Email</th>
									<th className="px-4 py-3 text-left">Role</th>
									<th className="px-4 py-3 text-left">Subject</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
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
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</section>
	);
}
