import { createFileRoute } from "@tanstack/react-router";
import { LogOut, PlusCircle, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/Toast";
import { apiFetch } from "../../lib/apiClient";
import { clearStoredAuth } from "../../lib/mockAuth";

export const Route = createFileRoute("/_app/profile")({
	component: RouteComponent,
});

const MAX_AVATAR_BYTES = 300 * 1024;
const ACCEPTED_AVATAR_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
];
const MAX_BIO_WORDS = 300;

const SCHOOLS = [
	{
		value: "medina_international_school",
		label: "Medina International School",
	},
	{
		value: "al_wildan_international_islamic_school",
		label: "Al Wildan International Islamic School",
	},
];

const TITLES = [
	{ value: "s_pd", label: "S.Pd" },
	{ value: "s_t", label: "S.T." },
	{ value: "lc", label: "L.c" },
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

function countWords(text: string) {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

type TeachingHistoryEntry = {
	id: string;
	startYear: number;
	endYear: number;
	organization: string;
};

type Profile = {
	userId: string;
	name: string;
	email: string;
	role: "admin" | "teacher" | "student";
	gender: "male" | "female" | null;
	avatarUrl: string | null;
	bio: string | null;
	address: string | null;
	phone: string | null;
	school: string | null;
	title: string | null;
	teachingHistory: TeachingHistoryEntry[];
};

function TeachingHistoryEditor({
	entries,
	onAdd,
	onDelete,
}: {
	entries: TeachingHistoryEntry[];
	onAdd: (entry: {
		startYear: number;
		endYear: number;
		organization: string;
	}) => void;
	onDelete: (id: string) => void;
}) {
	const [startYear, setStartYear] = useState("");
	const [endYear, setEndYear] = useState("");
	const [organization, setOrganization] = useState("");
	const [error, setError] = useState("");

	function handleAdd() {
		const start = Number(startYear);
		const end = Number(endYear);
		if (!startYear || !endYear || !organization.trim()) {
			setError("Start year, end year, and organization are all required.");
			return;
		}
		if (end < start) {
			setError("End year cannot be before start year.");
			return;
		}
		setError("");
		onAdd({
			startYear: start,
			endYear: end,
			organization: organization.trim(),
		});
		setStartYear("");
		setEndYear("");
		setOrganization("");
	}

	return (
		<div>
			<h2 className="font-heading text-lg font-bold text-green-800 mb-2">
				Teaching History
			</h2>
			{entries.length === 0 && (
				<p className="text-sm text-stone-400 italic mb-3">
					No prior teaching history added yet.
				</p>
			)}
			<div className="flex flex-col gap-2 mb-3">
				{entries.map((entry) => (
					<div
						key={entry.id}
						className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3"
					>
						<div>
							<p className="font-semibold text-stone-800">
								{entry.organization}
							</p>
							<p className="text-xs text-stone-500">
								{entry.startYear} — {entry.endYear}
							</p>
						</div>
						<button
							type="button"
							className="text-rose-500 hover:text-rose-600 cursor-pointer"
							onClick={() => onDelete(entry.id)}
						>
							<Trash2 size={16} />
						</button>
					</div>
				))}
			</div>
			<div className="rounded-xl border border-stone-200 p-3">
				<p className="mb-2 text-xs font-semibold text-stone-500">
					Add teaching history
				</p>
				<div className="flex flex-wrap gap-2">
					<input
						type="number"
						placeholder="Start year"
						className="w-28 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
						value={startYear}
						onChange={(e) => setStartYear(e.target.value)}
					/>
					<input
						type="number"
						placeholder="End year"
						className="w-28 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
						value={endYear}
						onChange={(e) => setEndYear(e.target.value)}
					/>
					<input
						type="text"
						placeholder="Organization / school"
						className="flex-1 min-w-40 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
						value={organization}
						onChange={(e) => setOrganization(e.target.value)}
					/>
					<button
						type="button"
						className="flex items-center gap-1 rounded-xl bg-green-600 text-white px-3 py-2 text-sm font-semibold hover:bg-green-700 transition-colors cursor-pointer"
						onClick={handleAdd}
					>
						<PlusCircle size={16} />
						Add
					</button>
				</div>
				{error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
			</div>
		</div>
	);
}

function ChangePasswordSection() {
	const toast = useToast();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit() {
		if (!currentPassword || !newPassword || !confirmPassword) {
			setError("All fields are required.");
			return;
		}
		if (newPassword.length < 6) {
			setError("New password must be at least 6 characters.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("New password and confirmation do not match.");
			return;
		}
		setError("");
		setIsSubmitting(true);
		const { body } = await apiFetch("/profile/password", {
			method: "PATCH",
			body: JSON.stringify({ currentPassword, newPassword }),
		});
		setIsSubmitting(false);
		if (body?.success) {
			toast.success("Password changed.");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} else {
			setError(body?.message ?? "Could not change password.");
		}
	}

	return (
		<div className="mt-8 border-t border-stone-200 pt-6">
			<h2 className="font-heading text-lg font-bold text-green-800 mb-2">
				Change Password
			</h2>
			{error && (
				<p className="mb-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
					{error}
				</p>
			)}
			<div className="flex flex-col gap-2 max-w-sm">
				<input
					type="password"
					placeholder="Current password"
					className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
					value={currentPassword}
					onChange={(e) => setCurrentPassword(e.target.value)}
				/>
				<input
					type="password"
					placeholder="New password (min. 6 characters)"
					className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
				/>
				<input
					type="password"
					placeholder="Confirm new password"
					className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
				/>
			</div>
			<button
				type="button"
				disabled={isSubmitting}
				onClick={handleSubmit}
				className="mt-3 cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
			>
				{isSubmitting ? "Changing…" : "Change Password"}
			</button>
		</div>
	);
}

function RouteComponent() {
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [profile, setProfile] = useState<Profile | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [bio, setBio] = useState("");
	const [address, setAddress] = useState("");
	const [phone, setPhone] = useState("");
	const [gender, setGender] = useState<"male" | "female" | "">("");
	const [school, setSchool] = useState("");
	const [title, setTitle] = useState("");
	const [avatarError, setAvatarError] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
		"idle",
	);

	function loadProfile() {
		apiFetch("/profile").then(({ status, body }) => {
			if (status === 401 || status === 403) {
				setLoadState("unauthorized");
				return;
			}
			const data: Profile | null = body?.data ?? null;
			setProfile(data);
			if (data) {
				setAvatarUrl(data.avatarUrl);
				setBio(data.bio ?? "");
				setAddress(data.address ?? "");
				setPhone(data.phone ?? "");
				setGender(data.gender ?? "");
				setSchool(data.school ?? "");
				setTitle(data.title ?? "");
			}
			setLoadState("ready");
		});
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: loadProfile is stable per render and only needs to run once on mount
	useEffect(() => {
		loadProfile();
	}, []);

	const bioWordCount = useMemo(() => countWords(bio), [bio]);

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

	async function handleSave() {
		if (bioWordCount > MAX_BIO_WORDS) {
			setErrorMessage(`Status must be ${MAX_BIO_WORDS} words or fewer.`);
			return;
		}
		setErrorMessage("");
		setSaveState("saving");
		const { status, body } = await apiFetch("/profile", {
			method: "PATCH",
			body: JSON.stringify({
				avatarUrl,
				bio: bio || null,
				address: address || null,
				gender: gender || null,
				phone: phone || null,
				...(profile?.role === "student" && { school: school || null }),
				...(profile?.role === "teacher" && { title: title || null }),
			}),
		});
		if (status === 200) {
			setProfile(body?.data ?? null);
			setSaveState("saved");
		} else {
			setSaveState("idle");
			setErrorMessage(body?.message ?? "Could not save profile.");
		}
	}

	async function handleAddHistory(entry: {
		startYear: number;
		endYear: number;
		organization: string;
	}) {
		const { status, body } = await apiFetch("/profile/teaching-history", {
			method: "POST",
			body: JSON.stringify(entry),
		});
		if (status === 201) {
			loadProfile();
		} else {
			setErrorMessage(body?.message ?? "Could not add teaching history.");
		}
	}

	function handleLogout() {
		clearStoredAuth();
		// Full page navigation, not router.navigate — mockUser is read once at
		// module load (see login.tsx), so only a fresh page load picks up the
		// now-cleared auth instead of leaving the stale logged-in identity in
		// memory.
		window.location.href = "/login";
	}

	async function handleDeleteHistory(id: string) {
		const { status, body } = await apiFetch(`/profile/teaching-history/${id}`, {
			method: "DELETE",
		});
		if (status === 200) {
			loadProfile();
		} else {
			setErrorMessage(body?.message ?? "Could not delete teaching history.");
		}
	}

	if (loadState === "unauthorized") {
		return (
			<section className="max-sm:p-3 sm:p-6 text-center text-stone-500">
				<p>You need to be logged in to view this page.</p>
			</section>
		);
	}

	if (loadState === "loading" || !profile) {
		return (
			<section className="max-sm:p-3 sm:p-6">
				<p className="text-stone-400">Loading…</p>
			</section>
		);
	}

	return (
		<section className="max-sm:p-3 sm:p-6 max-w-2xl mx-auto">
			<div className="flex items-center justify-between mb-4">
				<h1 className="font-heading text-2xl font-bold text-green-800">
					My Profile
				</h1>
				<button
					type="button"
					onClick={handleLogout}
					className="flex items-center gap-1.5 cursor-pointer rounded-xl border border-stone-300 text-stone-600 px-3 py-2 text-sm hover:bg-red-400 hover:text-white transition-colors"
				>
					<LogOut size={16} />
					Log Out
				</button>
			</div>

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			<div className="flex flex-col items-center gap-2 mb-6">
				<div className="relative">
					<div className="h-24 w-24 overflow-hidden rounded-full border-2 border-green-200 bg-green-50 flex items-center justify-center text-green-700 font-heading font-bold text-2xl">
						{avatarUrl ? (
							<img
								src={avatarUrl}
								alt="Avatar preview"
								className="h-full w-full object-cover"
							/>
						) : (
							initials(profile.name)
						)}
					</div>
					<label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-green-600 text-white shadow-sm hover:bg-green-700 transition-colors">
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
						className="text-xs text-rose-500 hover:text-rose-600 cursor-pointer"
						onClick={() => setAvatarUrl(null)}
					>
						Remove photo
					</button>
				)}
				{avatarError && (
					<span className="text-xs text-rose-500">{avatarError}</span>
				)}
				<p className="font-heading text-lg font-bold text-stone-800">
					{profile.name}
				</p>
				<p className="text-sm text-stone-500 capitalize">{profile.role}</p>
			</div>

			<div className="flex flex-col gap-4 mb-6">
				<div>
					<div className="flex items-center justify-between mb-1">
						<label
							htmlFor="bio"
							className="text-xs font-semibold text-stone-500"
						>
							Status
						</label>
						<span
							className={`text-xs ${bioWordCount > MAX_BIO_WORDS ? "text-rose-500" : "text-stone-400"}`}
						>
							{bioWordCount}/{MAX_BIO_WORDS} words
						</span>
					</div>
					<textarea
						id="bio"
						rows={3}
						placeholder="Say a little about yourself…"
						className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors resize-none"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
					/>
				</div>

				<div>
					<label
						htmlFor="address"
						className="text-xs font-semibold text-stone-500 mb-1 block"
					>
						Address
					</label>
					<input
						id="address"
						type="text"
						className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
					/>
				</div>

				<div className="flex flex-wrap gap-4">
					<div className="flex-1 min-w-40">
						<label
							htmlFor="gender"
							className="text-xs font-semibold text-stone-500 mb-1 block"
						>
							Gender
						</label>
						<select
							id="gender"
							className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={gender}
							onChange={(e) =>
								setGender(e.target.value as "male" | "female" | "")
							}
						>
							<option value="">Not set</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
						</select>
					</div>
					<div className="flex-1 min-w-40">
						<label
							htmlFor="phone"
							className="text-xs font-semibold text-stone-500 mb-1 block"
						>
							Phone Number
						</label>
						<input
							id="phone"
							type="text"
							className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
						/>
					</div>
				</div>

				{profile.role === "student" && (
					<div>
						<label
							htmlFor="school"
							className="text-xs font-semibold text-stone-500 mb-1 block"
						>
							School
						</label>
						<select
							id="school"
							className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={school}
							onChange={(e) => setSchool(e.target.value)}
						>
							<option value="">Not set</option>
							{SCHOOLS.map((s) => (
								<option key={s.value} value={s.value}>
									{s.label}
								</option>
							))}
						</select>
					</div>
				)}

				{profile.role === "teacher" && (
					<div>
						<label
							htmlFor="title"
							className="text-xs font-semibold text-stone-500 mb-1 block"
						>
							Title (optional)
						</label>
						<select
							id="title"
							className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						>
							<option value="">None</option>
							{TITLES.map((t) => (
								<option key={t.value} value={t.value}>
									{t.label}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			<div className="flex items-center gap-3 mb-8">
				<button
					type="button"
					onClick={handleSave}
					disabled={saveState === "saving"}
					className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
				>
					{saveState === "saving" ? "Saving…" : "Save Changes"}
				</button>
				{saveState === "saved" && (
					<span className="text-sm text-green-600">Saved</span>
				)}
			</div>

			{profile.role === "teacher" && (
				<TeachingHistoryEditor
					entries={profile.teachingHistory}
					onAdd={handleAddHistory}
					onDelete={handleDeleteHistory}
				/>
			)}

			<ChangePasswordSection />
		</section>
	);
}
