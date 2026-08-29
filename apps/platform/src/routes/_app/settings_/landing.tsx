import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, Pencil, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsTabs } from "../../../components/dashboard/SettingsTabs";
import { apiFetch } from "../../../lib/apiClient";

export const Route = createFileRoute("/_app/settings_/landing")({
	component: RouteComponent,
});

type Testimonial = {
	testimonialId: string;
	name: string;
	message: string;
	givenAt: string;
	createdAt: string;
};

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time, not
// the ISO/UTC string the API sends and expects.
function toDatetimeLocal(iso: string) {
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TestimonialModal({
	initialData,
	onClose,
	onSubmit,
}: {
	initialData: Testimonial | null;
	onClose: () => void;
	onSubmit: (payload: {
		name: string;
		message: string;
		givenAt: string;
	}) => void;
}) {
	const [name, setName] = useState(initialData?.name ?? "");
	const [message, setMessage] = useState(initialData?.message ?? "");
	const [givenAt, setGivenAt] = useState(
		toDatetimeLocal(initialData?.givenAt ?? new Date().toISOString()),
	);

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
				className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="font-heading text-lg text-green-800 mb-3">
					{initialData ? "Edit Testimonial" : "Add Testimonial"}
				</h2>
				<div className="flex flex-col gap-2">
					<input
						className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
						placeholder="Name (e.g. Bunda Aisyah)"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<textarea
						className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors resize-none font-normal"
						rows={4}
						placeholder="What did they say?"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					/>
					<label className="text-xs font-normal text-stone-500">
						When was this given?
						<input
							type="datetime-local"
							className="mt-1 w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors font-normal"
							value={givenAt}
							onChange={(e) => setGivenAt(e.target.value)}
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
						disabled={!name.trim() || !message.trim() || !givenAt}
						onClick={() =>
							onSubmit({
								name: name.trim(),
								message: message.trim(),
								givenAt: new Date(givenAt).toISOString(),
							})
						}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
					>
						Save
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
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-stone-800">Delete this testimonial?</h2>
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

function HistoricalHoursEditor() {
	const [hours, setHours] = useState("0");
	const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
		"idle",
	);

	useEffect(() => {
		apiFetch("/landing-stats").then(({ status, body }) => {
			if (status !== 200) return;
			setHours(String(body?.data?.historicalSessionHours ?? 0));
		});
	}, []);

	async function save(value: string) {
		setSaveState("saving");
		const { body } = await apiFetch("/landing-stats", {
			method: "PATCH",
			body: JSON.stringify({ historicalSessionHours: Number(value || 0) }),
		});
		setSaveState(body?.success ? "saved" : "idle");
	}

	return (
		<div className="mb-6 rounded-2xl border border-green-100 bg-white p-4 shadow-sm max-w-md">
			<p className="mb-1 text-xs font-semibold text-stone-500">
				Historical Session Hours
			</p>
			<p className="mb-2 text-xs text-stone-400">
				Real teaching hours from before this LMS existed (since 2021) — added to
				the live-computed total shown on the public "Jam Pembelajaran" stat.
			</p>
			<input
				type="number"
				min={0}
				className="w-full border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
				value={hours}
				onChange={(e) => {
					setHours(e.target.value);
					setSaveState("idle");
				}}
				onBlur={(e) => save(e.target.value)}
			/>
			{saveState === "saving" && (
				<p className="mt-1 text-xs text-stone-400">Saving…</p>
			)}
			{saveState === "saved" && (
				<p className="mt-1 text-xs text-green-600">Saved</p>
			)}
		</div>
	);
}

function RouteComponent() {
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [editingTestimonial, setEditingTestimonial] = useState<
		Testimonial | "new" | null
	>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	useEffect(() => {
		apiFetch("/public/testimonials").then(({ status, body }) => {
			if (status === 401 || status === 403) {
				setLoadState("unauthorized");
				return;
			}
			setTestimonials(body?.data ?? []);
			setLoadState("ready");
		});
	}, []);

	async function handleSubmit(payload: {
		name: string;
		message: string;
		givenAt: string;
	}) {
		const isEditing = editingTestimonial && editingTestimonial !== "new";
		const { body } = await apiFetch(
			isEditing
				? `/testimonials/${editingTestimonial.testimonialId}`
				: "/testimonials",
			{
				method: isEditing ? "PATCH" : "POST",
				body: JSON.stringify(payload),
			},
		);
		if (body?.success) {
			setTestimonials((prev) =>
				isEditing
					? prev.map((t) =>
							t.testimonialId === body.data.testimonialId ? body.data : t,
						)
					: [body.data, ...prev],
			);
			setEditingTestimonial(null);
			setErrorMessage("");
		} else {
			setErrorMessage(body?.message ?? "Could not save testimonial.");
		}
	}

	async function handleDelete(testimonialId: string) {
		const { body } = await apiFetch(`/testimonials/${testimonialId}`, {
			method: "DELETE",
		});
		if (body?.success) {
			setTestimonials((prev) =>
				prev.filter((t) => t.testimonialId !== testimonialId),
			);
			setDeletingId(null);
		} else {
			setErrorMessage(body?.message ?? "Could not delete testimonial.");
			setDeletingId(null);
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
			{editingTestimonial && (
				<TestimonialModal
					initialData={editingTestimonial === "new" ? null : editingTestimonial}
					onClose={() => setEditingTestimonial(null)}
					onSubmit={handleSubmit}
				/>
			)}
			{deletingId && (
				<ConfirmDeleteModal
					onConfirm={() => handleDelete(deletingId)}
					onClose={() => setDeletingId(null)}
				/>
			)}

			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Settings
			</h1>
			<SettingsTabs active="landing" />

			<HistoricalHoursEditor />

			<div className="flex max-sm:flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
				<p className="text-stone-500 text-sm">
					Testimonials shown on the public landing page's "Kata Mereka" section.
				</p>
				<button
					type="button"
					className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2 w-fit"
					onClick={() => setEditingTestimonial("new")}
				>
					<PlusCircle size={18} />
					Add Testimonial
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
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
					{testimonials.length === 0 && (
						<p className="text-stone-400 italic text-sm">
							No testimonials yet.
						</p>
					)}
					{testimonials.map((t) => (
						<div
							key={t.testimonialId}
							className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm flex flex-col"
						>
							<div className="flex items-baseline justify-between gap-2">
								<p className="font-heading font-bold text-stone-800">
									{t.name}
								</p>
								<span className="shrink-0 text-xs text-stone-400">
									{new Date(t.givenAt).toLocaleDateString("en-GB", {
										day: "numeric",
										month: "short",
										year: "numeric",
									})}
								</span>
							</div>
							<p className="text-sm text-stone-600 mt-1 flex-1 whitespace-pre-line">
								{t.message}
							</p>
							<div className="flex justify-end gap-3 mt-3">
								<button
									type="button"
									className="text-green-700 hover:text-green-800 cursor-pointer"
									onClick={() => setEditingTestimonial(t)}
								>
									<Pencil size={16} />
								</button>
								<button
									type="button"
									className="text-rose-500 hover:text-rose-600 cursor-pointer"
									onClick={() => setDeletingId(t.testimonialId)}
								>
									<Ban size={16} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
}
