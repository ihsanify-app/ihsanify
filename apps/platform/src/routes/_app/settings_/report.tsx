import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { SettingsTabs } from "../../../components/dashboard/SettingsTabs";
import { apiFetch } from "../../../lib/apiClient";

export const Route = createFileRoute("/_app/settings_/report")({
	component: RouteComponent,
});

const MAX_COVER_IMAGE_BYTES = 800 * 1024;
const MAX_LOGO_BYTES = 300 * 1024;
const ACCEPTED_IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
];

const FONT_OPTIONS = [
	{ value: "helvetica", label: "Helvetica (default)" },
	{ value: "poppins", label: "Poppins" },
	{ value: "pt_serif", label: "PT Serif" },
] as const;

const PATTERN_OPTIONS = [
	{ value: "none", label: "None (solid color)" },
	{ value: "lines", label: "Lines" },
	{ value: "dots", label: "Dots" },
	{ value: "blocks", label: "Blocks" },
	{ value: "swirl", label: "Swirl" },
] as const;

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

type ReportSettings = {
	title: string;
	organizationName: string;
	logoUrl: string | null;
	websiteUrl: string | null;
	footerPhone: string | null;
	footerEmail: string | null;
	footerInstagram: string | null;
	font: string;
	headerPattern: string;
	coverImageUrl: string | null;
};

function RouteComponent() {
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [settings, setSettings] = useState<ReportSettings | null>(null);
	const [errorMessage, setErrorMessage] = useState("");
	const [savedMessage, setSavedMessage] = useState("");
	const [imageError, setImageError] = useState("");
	const [logoError, setLogoError] = useState("");

	const load = useCallback(async () => {
		const { status, body } = await apiFetch("/report-settings");
		if (status === 401 || status === 403) {
			setLoadState("unauthorized");
			return;
		}
		setSettings(body?.data ?? null);
		setLoadState("ready");
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	function updateField<K extends keyof ReportSettings>(
		key: K,
		value: ReportSettings[K],
	) {
		setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
		setSavedMessage("");
	}

	async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
			setImageError("Only PNG, JPEG, WEBP, or GIF images are allowed.");
			return;
		}
		if (file.size > MAX_COVER_IMAGE_BYTES) {
			setImageError("Image must be smaller than 800KB.");
			return;
		}
		setImageError("");
		updateField("coverImageUrl", await fileToDataUrl(file));
	}

	async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
			setLogoError("Only PNG, JPEG, WEBP, or GIF images are allowed.");
			return;
		}
		if (file.size > MAX_LOGO_BYTES) {
			setLogoError("Image must be smaller than 300KB.");
			return;
		}
		setLogoError("");
		updateField("logoUrl", await fileToDataUrl(file));
	}

	async function handleSave() {
		if (!settings) return;
		const { body } = await apiFetch("/report-settings", {
			method: "PATCH",
			body: JSON.stringify(settings),
		});
		if (body?.success) {
			setSettings(body.data);
			setSavedMessage("Saved.");
			setErrorMessage("");
		} else {
			setErrorMessage(body?.message ?? "Could not save report settings.");
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
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Settings
			</h1>
			<SettingsTabs active="report" />

			<h2 className="font-heading text-lg font-semibold text-stone-700 mb-1">
				Report PDF Template
			</h2>
			<p className="text-stone-500 text-sm mb-6">
				Applies to every report PDF, regardless of subject. Color theme is
				picked per subject — see the Subject tab.
			</p>

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			{loadState === "loading" || !settings ? (
				<p className="text-stone-400">Loading…</p>
			) : (
				<div className="border border-green-100 rounded-2xl bg-white shadow-sm max-w-xl p-6 flex flex-col gap-4">
					<label className="text-xs font-medium text-stone-500">
						Report Title
						<input
							className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
							value={settings.title}
							onChange={(e) => updateField("title", e.target.value)}
						/>
					</label>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<label className="text-xs font-medium text-stone-500">
							Organization Name
							<input
								className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
								value={settings.organizationName}
								onChange={(e) =>
									updateField("organizationName", e.target.value)
								}
							/>
						</label>
						<label className="text-xs font-medium text-stone-500">
							Website URL
							<input
								className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
								placeholder="https://example.com"
								value={settings.websiteUrl ?? ""}
								onChange={(e) =>
									updateField("websiteUrl", e.target.value || null)
								}
							/>
						</label>
					</div>

					<div>
						<p className="text-xs font-medium text-stone-500 mb-1">Logo</p>
						<div className="flex flex-wrap items-center gap-3">
							<div className="h-16 w-16 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-300 text-xs">
								{settings.logoUrl ? (
									<img
										src={settings.logoUrl}
										alt="Logo preview"
										className="h-full w-full object-cover"
									/>
								) : (
									"No logo"
								)}
							</div>
							<div className="flex flex-col gap-1">
								<label className="inline-flex w-fit items-center gap-2 cursor-pointer rounded-xl border border-stone-300 text-stone-600 px-3 py-1.5 text-sm hover:bg-stone-50 transition-colors">
									<Upload size={14} />
									Upload
									<input
										type="file"
										accept={ACCEPTED_IMAGE_TYPES.join(",")}
										className="hidden"
										onChange={handleLogoChange}
									/>
								</label>
								{settings.logoUrl && (
									<button
										type="button"
										className="text-xs text-rose-500 hover:text-rose-600 cursor-pointer text-left"
										onClick={() => updateField("logoUrl", null)}
									>
										Remove
									</button>
								)}
								{logoError && (
									<span className="text-xs text-rose-500">{logoError}</span>
								)}
								<span className="text-xs text-stone-400">
									PNG, JPEG, WEBP, or GIF. Max 300KB. Shown on the cover and
									header.
								</span>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<label className="text-xs font-medium text-stone-500">
							Font
							<select
								className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
								value={settings.font}
								onChange={(e) => updateField("font", e.target.value)}
							>
								{FONT_OPTIONS.map((f) => (
									<option key={f.value} value={f.value}>
										{f.label}
									</option>
								))}
							</select>
						</label>

						<label className="text-xs font-medium text-stone-500">
							Header Pattern
							<select
								className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
								value={settings.headerPattern}
								onChange={(e) => updateField("headerPattern", e.target.value)}
							>
								{PATTERN_OPTIONS.map((p) => (
									<option key={p.value} value={p.value}>
										{p.label}
									</option>
								))}
							</select>
						</label>
					</div>

					<div>
						<p className="text-xs font-medium text-stone-500 mb-1">
							Cover Image
						</p>
						<div className="flex flex-wrap items-center gap-3">
							<div className="h-20 w-16 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-300 text-xs">
								{settings.coverImageUrl ? (
									<img
										src={settings.coverImageUrl}
										alt="Cover preview"
										className="h-full w-full object-cover"
									/>
								) : (
									"No image"
								)}
							</div>
							<div className="flex flex-col gap-1">
								<label className="inline-flex w-fit items-center gap-2 cursor-pointer rounded-xl border border-stone-300 text-stone-600 px-3 py-1.5 text-sm hover:bg-stone-50 transition-colors">
									<Upload size={14} />
									Upload
									<input
										type="file"
										accept={ACCEPTED_IMAGE_TYPES.join(",")}
										className="hidden"
										onChange={handleImageChange}
									/>
								</label>
								{settings.coverImageUrl && (
									<button
										type="button"
										className="text-xs text-rose-500 hover:text-rose-600 cursor-pointer text-left"
										onClick={() => updateField("coverImageUrl", null)}
									>
										Remove
									</button>
								)}
								{imageError && (
									<span className="text-xs text-rose-500">{imageError}</span>
								)}
								<span className="text-xs text-stone-400">
									PNG, JPEG, WEBP, or GIF. Max 800KB. Falls back to the
									subject's theme color when unset.
								</span>
							</div>
						</div>
					</div>

					<div>
						<p className="text-xs font-medium text-stone-500 mb-1">
							Footer Contact Info
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
							<input
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
								placeholder="Phone"
								value={settings.footerPhone ?? ""}
								onChange={(e) =>
									updateField("footerPhone", e.target.value || null)
								}
							/>
							<input
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
								placeholder="Email"
								value={settings.footerEmail ?? ""}
								onChange={(e) =>
									updateField("footerEmail", e.target.value || null)
								}
							/>
							<input
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
								placeholder="Instagram"
								value={settings.footerInstagram ?? ""}
								onChange={(e) =>
									updateField("footerInstagram", e.target.value || null)
								}
							/>
						</div>
						<p className="text-xs text-stone-400 mt-1">
							Leave a field blank to hide the footer bar entirely when none are
							set.
						</p>
					</div>

					<div className="flex items-center gap-3 mt-2">
						<button
							type="button"
							onClick={handleSave}
							className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors font-semibold text-sm w-fit"
						>
							Save Changes
						</button>
						{savedMessage && (
							<span className="text-sm text-green-700">{savedMessage}</span>
						)}
					</div>
				</div>
			)}
		</section>
	);
}
