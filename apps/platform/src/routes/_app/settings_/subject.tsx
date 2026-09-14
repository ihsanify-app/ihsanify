import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, PlusCircle, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { SettingsTabs } from "../../../components/dashboard/SettingsTabs";
import { apiFetch } from "../../../lib/apiClient";
import {
	ACCEPTED_IMAGE_TYPES,
	fileToDataUrl,
	MAX_IMAGE_BYTES,
} from "../../../lib/imageUpload";

export const Route = createFileRoute("/_app/settings_/subject")({
	component: RouteComponent,
});

type Subject = {
	subjectId: string;
	subjectName: string;
	subjectCode: string | null;
	reportThemeId: string | null;
	reportThemeName: string | null;
	description: string | null;
	iconUrl: string | null;
	videoUrl: string | null;
};

type ReportTheme = {
	reportThemeId: string;
	name: string;
	primaryColor: string;
};

function AddSubjectModal({
	themes,
	onClose,
	onSubmit,
}: {
	themes: ReportTheme[];
	onClose: () => void;
	onSubmit: (
		name: string,
		subjectCode: string,
		reportThemeId: string,
		description: string,
		iconUrl: string | null,
		videoUrl: string,
	) => void;
}) {
	const [name, setName] = useState("");
	const [subjectCode, setSubjectCode] = useState("");
	const [reportThemeId, setReportThemeId] = useState("");
	const [description, setDescription] = useState("");
	const [iconUrl, setIconUrl] = useState<string | null>(null);
	const [iconError, setIconError] = useState("");
	const [videoUrl, setVideoUrl] = useState("");

	async function handleIconChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
			setIconError("Only PNG, JPEG, WEBP, or GIF images are allowed.");
			return;
		}
		if (file.size > MAX_IMAGE_BYTES) {
			setIconError("Image must be smaller than 300KB.");
			return;
		}
		setIconError("");
		setIconUrl(await fileToDataUrl(file));
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
				className="bg-white rounded-2xl p-6 w-[90vw] max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-3">
					Add Subject
				</h2>
				<div className="flex flex-col items-center gap-2 mb-3">
					<div className="relative">
						<div className="h-16 w-16 overflow-hidden rounded-full border-2 border-green-200 bg-green-50 flex items-center justify-center text-green-700 shadow-sm">
							{iconUrl ? (
								<img
									src={iconUrl}
									alt="Icon preview"
									className="h-full w-full object-cover"
								/>
							) : (
								<PlusCircle size={22} className="opacity-30" />
							)}
						</div>
						<label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-green-600 text-white shadow-sm hover:bg-green-700 transition-colors">
							<Upload size={12} />
							<input
								type="file"
								accept={ACCEPTED_IMAGE_TYPES.join(",")}
								className="hidden"
								onChange={handleIconChange}
							/>
						</label>
					</div>
					{iconError && (
						<span className="text-xs text-rose-500 font-normal">
							{iconError}
						</span>
					)}
					<span className="text-xs text-stone-400 font-normal">
						Icon (optional) — PNG, JPEG, WEBP, or GIF. Max 300KB.
					</span>
				</div>
				<div className="flex flex-col gap-2">
					<input
						className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
						placeholder="e.g. Fiqih"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<label className="text-xs font-normal text-stone-500">
						Subject Code
						<input
							className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal uppercase"
							placeholder="e.g. AR"
							value={subjectCode}
							onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
						/>
					</label>
					<label className="text-xs font-normal text-stone-500">
						Report Theme
						<select
							className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
							value={reportThemeId}
							onChange={(e) => setReportThemeId(e.target.value)}
						>
							<option value="">No theme (default)</option>
							{themes.map((t) => (
								<option key={t.reportThemeId} value={t.reportThemeId}>
									{t.name}
								</option>
							))}
						</select>
					</label>
					<label className="text-xs font-normal text-stone-500">
						Description (shown on the landing page)
						<textarea
							rows={2}
							className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal resize-none"
							placeholder="e.g. Belajar membaca Al-Qur'an dengan tajwid yang benar."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</label>
					<label className="text-xs font-normal text-stone-500">
						Video URL (YouTube — "Watch" button on the card)
						<input
							className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
							placeholder="e.g. https://youtu.be/..."
							value={videoUrl}
							onChange={(e) => setVideoUrl(e.target.value)}
						/>
					</label>
				</div>
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
							onSubmit(
								name,
								subjectCode,
								reportThemeId,
								description,
								iconUrl,
								videoUrl,
							)
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

function ConfirmDeleteModal({
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
				className="bg-white rounded-2xl p-6 w-[90vw] max-w-md flex flex-col gap-4 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-stone-800">
					Are you sure you want to delete this record?
				</h2>
				<div className="flex flex-col gap-2">
					<button
						type="button"
						className="cursor-pointer rounded-xl bg-rose-600 text-white p-2 hover:bg-rose-700 transition-colors"
						onClick={onConfirm}
					>
						Confirm
					</button>
					<button
						type="button"
						className="cursor-pointer rounded-xl border border-stone-300 text-stone-600 p-2 hover:bg-stone-50 transition-colors"
						onClick={onClose}
					>
						Cancel
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
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [themes, setThemes] = useState<ReportTheme[]>([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(
		null,
	);

	const load = useCallback(async () => {
		const [subjectsRes, themesRes] = await Promise.all([
			apiFetch("/subjects"),
			apiFetch("/report-themes"),
		]);
		if (subjectsRes.status === 401 || subjectsRes.status === 403) {
			setLoadState("unauthorized");
			return;
		}
		setSubjects(subjectsRes.body?.data ?? []);
		setThemes(themesRes.body?.data ?? []);
		setLoadState("ready");
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	async function handleCreate(
		name: string,
		subjectCode: string,
		reportThemeId: string,
		description: string,
		iconUrl: string | null,
		videoUrl: string,
	) {
		const { body } = await apiFetch("/subjects", {
			method: "POST",
			body: JSON.stringify({
				name,
				subjectCode: subjectCode || null,
				reportThemeId: reportThemeId || null,
				description: description || null,
				iconUrl,
				videoUrl: videoUrl || null,
			}),
		});
		if (body?.success) {
			setSubjects((prev) =>
				[...prev, body.data].sort((a, b) =>
					a.subjectName.localeCompare(b.subjectName),
				),
			);
			setIsModalOpen(false);
			setErrorMessage("");
		} else {
			setErrorMessage(body?.message ?? "Could not create subject.");
		}
	}

	async function handleThemeChange(subjectId: string, reportThemeId: string) {
		const { body } = await apiFetch(`/subjects/${subjectId}`, {
			method: "PATCH",
			body: JSON.stringify({ reportThemeId: reportThemeId || null }),
		});
		if (body?.success) {
			setSubjects((prev) =>
				prev.map((s) => (s.subjectId === subjectId ? body.data : s)),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update report theme.");
		}
	}

	async function handleDescriptionChange(
		subjectId: string,
		description: string,
	) {
		const { body } = await apiFetch(`/subjects/${subjectId}`, {
			method: "PATCH",
			body: JSON.stringify({ description: description || null }),
		});
		if (body?.success) {
			setSubjects((prev) =>
				prev.map((s) => (s.subjectId === subjectId ? body.data : s)),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update description.");
		}
	}

	async function handleVideoUrlChange(subjectId: string, videoUrl: string) {
		const { body } = await apiFetch(`/subjects/${subjectId}`, {
			method: "PATCH",
			body: JSON.stringify({ videoUrl: videoUrl || null }),
		});
		if (body?.success) {
			setSubjects((prev) =>
				prev.map((s) => (s.subjectId === subjectId ? body.data : s)),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update video URL.");
		}
	}

	async function handleIconChange(subjectId: string, file: File) {
		if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
			setErrorMessage("Only PNG, JPEG, WEBP, or GIF images are allowed.");
			return;
		}
		if (file.size > MAX_IMAGE_BYTES) {
			setErrorMessage("Image must be smaller than 300KB.");
			return;
		}
		const iconUrl = await fileToDataUrl(file);
		const { body } = await apiFetch(`/subjects/${subjectId}`, {
			method: "PATCH",
			body: JSON.stringify({ iconUrl }),
		});
		if (body?.success) {
			setSubjects((prev) =>
				prev.map((s) => (s.subjectId === subjectId ? body.data : s)),
			);
			setErrorMessage("");
		} else {
			setErrorMessage(body?.message ?? "Could not update icon.");
		}
	}

	async function handleCodeChange(subjectId: string, subjectCode: string) {
		const { body } = await apiFetch(`/subjects/${subjectId}`, {
			method: "PATCH",
			body: JSON.stringify({ subjectCode: subjectCode.toUpperCase() || null }),
		});
		if (body?.success) {
			setSubjects((prev) =>
				prev.map((s) => (s.subjectId === subjectId ? body.data : s)),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update subject code.");
		}
	}

	async function handleDelete(subjectId: string) {
		const { body } = await apiFetch(`/subjects/${subjectId}`, {
			method: "DELETE",
		});
		if (body?.success) {
			setSubjects((prev) => prev.filter((s) => s.subjectId !== subjectId));
			setDeletingSubjectId(null);
			setErrorMessage("");
		} else {
			setErrorMessage(body?.message ?? "Could not delete subject.");
			setDeletingSubjectId(null);
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
			{isModalOpen && (
				<AddSubjectModal
					themes={themes}
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleCreate}
				/>
			)}
			{deletingSubjectId && (
				<ConfirmDeleteModal
					onConfirm={() => handleDelete(deletingSubjectId)}
					onClose={() => setDeletingSubjectId(null)}
				/>
			)}

			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Settings
			</h1>
			<SettingsTabs active="subject" />

			<div className="flex max-sm:flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
				<p className="text-stone-500 text-sm">
					Subjects available to assign to groups, each with a report PDF color
					theme.
				</p>
				<button
					type="button"
					className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2 w-fit"
					onClick={() => setIsModalOpen(true)}
				>
					<PlusCircle size={18} />
					Add Subject
				</button>
			</div>

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			{loadState === "loading" ? (
				<p className="text-stone-400">Loading…</p>
			) : (
				<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm max-w-5xl">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
								<tr>
									<th className="px-4 py-3 text-left">Icon</th>
									<th className="px-4 py-3 text-left">Subject</th>
									<th className="px-4 py-3 text-left">Code</th>
									<th className="px-4 py-3 text-left">Report Theme</th>
									<th className="px-4 py-3 text-left">Description</th>
									<th className="px-4 py-3 text-left">Video URL</th>
									<th className="px-4 py-3 text-left">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{subjects.length === 0 && (
									<tr>
										<td
											colSpan={7}
											className="px-4 py-6 text-center text-stone-400 italic"
										>
											No subjects yet.
										</td>
									</tr>
								)}
								{subjects.map((s) => (
									<tr key={s.subjectId} className="hover:bg-green-50">
										<td className="px-4 py-3">
											<div className="relative w-fit">
												<div className="h-10 w-10 overflow-hidden rounded-full border border-green-200 bg-green-50 flex items-center justify-center text-green-700">
													{s.iconUrl ? (
														<img
															src={s.iconUrl}
															alt={s.subjectName}
															className="h-full w-full object-cover"
														/>
													) : (
														<PlusCircle size={16} className="opacity-30" />
													)}
												</div>
												<label className="absolute -bottom-1 -right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-green-600 text-white shadow-sm hover:bg-green-700 transition-colors">
													<Upload size={9} />
													<input
														type="file"
														accept={ACCEPTED_IMAGE_TYPES.join(",")}
														className="hidden"
														onChange={(e) => {
															const file = e.target.files?.[0];
															e.target.value = "";
															if (file) handleIconChange(s.subjectId, file);
														}}
													/>
												</label>
											</div>
										</td>
										<td className="px-4 py-3">{s.subjectName}</td>
										<td className="px-4 py-3">
											<input
												key={s.subjectCode ?? ""}
												className="w-20 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors uppercase"
												placeholder="e.g. AR"
												defaultValue={s.subjectCode ?? ""}
												onBlur={(e) => {
													const value = e.target.value.toUpperCase();
													if (value !== (s.subjectCode ?? "")) {
														handleCodeChange(s.subjectId, value);
													}
												}}
											/>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												<span
													className="h-4 w-4 shrink-0 rounded-full border border-stone-300"
													style={{
														backgroundColor:
															themes.find(
																(t) => t.reportThemeId === s.reportThemeId,
															)?.primaryColor ?? "transparent",
													}}
												/>
												<select
													className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
													value={s.reportThemeId ?? ""}
													onChange={(e) =>
														handleThemeChange(s.subjectId, e.target.value)
													}
												>
													<option value="">No theme (default)</option>
													{themes.map((t) => (
														<option
															key={t.reportThemeId}
															value={t.reportThemeId}
														>
															{t.name}
														</option>
													))}
												</select>
											</div>
										</td>
										<td className="px-4 py-3">
											<textarea
												key={s.description ?? ""}
												rows={2}
												className="w-48 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors resize-none"
												placeholder="Shown on the landing page"
												defaultValue={s.description ?? ""}
												onBlur={(e) => {
													const value = e.target.value;
													if (value !== (s.description ?? "")) {
														handleDescriptionChange(s.subjectId, value);
													}
												}}
											/>
										</td>
										<td className="px-4 py-3">
											<input
												key={s.videoUrl ?? ""}
												className="w-40 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
												placeholder="https://youtu.be/..."
												defaultValue={s.videoUrl ?? ""}
												onBlur={(e) => {
													const value = e.target.value;
													if (value !== (s.videoUrl ?? "")) {
														handleVideoUrlChange(s.subjectId, value);
													}
												}}
											/>
										</td>
										<td className="px-4 py-3">
											<button
												type="button"
												className="text-rose-500 hover:text-rose-600 cursor-pointer"
												onClick={() => setDeletingSubjectId(s.subjectId)}
											>
												<Ban size={16} />
											</button>
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
