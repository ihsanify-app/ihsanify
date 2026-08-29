import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { buildWhatsappUrl, joinNaturally } from "../../lib/whatsapp";

type Subject = { subjectId: string; subjectName: string };

// The label shown in the chip vs. how it reads mid-sentence in the WhatsApp
// message (e.g. "Teman/Keluarga" the chip -> "teman/keluarga" in prose).
const REFERRAL_SOURCES = [
	{ id: "teman", label: "Teman/Keluarga", messageText: "teman/keluarga" },
	{ id: "instagram", label: "Instagram", messageText: "Instagram" },
	{ id: "google", label: "Google", messageText: "Google" },
	{ id: "lainnya", label: "Lainnya", messageText: "sumber lain" },
];

const GENDERS = [
	{ id: "male", label: "Laki-laki", messageText: "laki-laki" },
	{ id: "female", label: "Perempuan", messageText: "perempuan" },
];

export function RegistrasiFormModal({ onClose }: { onClose: () => void }) {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [name, setName] = useState("");
	const [domicile, setDomicile] = useState("");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [genderId, setGenderId] = useState<string | null>(null);
	const [referralSourceId, setReferralSourceId] = useState<string | null>(null);

	useEffect(() => {
		apiFetch("/public/subjects").then(({ status, body }) => {
			if (status === 200) setSubjects(body?.data ?? []);
		});
	}, []);

	function toggleSubject(id: string) {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
		);
	}

	const selectedNames = subjects
		.filter((s) => selectedIds.includes(s.subjectId))
		.map((s) => s.subjectName);
	const canSubmit =
		name.trim().length > 0 &&
		domicile.trim().length > 0 &&
		selectedNames.length > 0 &&
		genderId !== null &&
		referralSourceId !== null;

	function handleSubmit() {
		const gender = GENDERS.find((g) => g.id === genderId);
		const referralSource = REFERRAL_SOURCES.find(
			(r) => r.id === referralSourceId,
		);
		const message = `Assalamu'alaikum, saya ${name.trim()} (${gender?.messageText}), domisili di ${domicile.trim()}, ingin mendaftar mata pelajaran ${joinNaturally(
			selectedNames,
		)}. Saya mengetahui Ihsanify dari ${referralSource?.messageText}. Mohon arahannya, terima kasih`;
		window.open(buildWhatsappUrl(message), "_blank", "noopener,noreferrer");
		onClose();
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between border-b border-stone-100 p-6 pb-4">
					<h2 className="font-heading text-xl font-bold text-green-800">
						Form Registrasi
					</h2>
					<button
						type="button"
						aria-label="Tutup"
						onClick={onClose}
						className="cursor-pointer rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
					>
						<X size={20} />
					</button>
				</div>

				<div className="flex flex-col gap-4 overflow-y-auto p-6 pt-4">
					<label className="flex flex-col gap-1 text-left text-sm font-medium text-stone-600">
						Nama Calon Murid
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Nama calon murid"
							className="rounded-xl border border-stone-300 p-2.5 text-base font-normal text-stone-800 outline-none transition-colors focus:border-green-500"
						/>
					</label>

					<div className="flex flex-col gap-1 text-left text-sm font-medium text-stone-600">
						Jenis Kelamin
						<div className="flex flex-wrap gap-2">
							{GENDERS.map((g) => {
								const isSelected = genderId === g.id;
								return (
									<button
										key={g.id}
										type="button"
										onClick={() => setGenderId(g.id)}
										className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
											isSelected
												? "border-green-600 bg-green-600 text-white"
												: "border-stone-300 text-stone-600 hover:bg-green-50"
										}`}
									>
										{isSelected && <Check size={14} />}
										{g.label}
									</button>
								);
							})}
						</div>
					</div>

					<label className="flex flex-col gap-1 text-left text-sm font-medium text-stone-600">
						Domisili
						<input
							type="text"
							value={domicile}
							onChange={(e) => setDomicile(e.target.value)}
							placeholder="Kota domisili"
							className="rounded-xl border border-stone-300 p-2.5 text-base font-normal text-stone-800 outline-none transition-colors focus:border-green-500"
						/>
					</label>

					<div className="flex flex-col gap-1 text-left text-sm font-medium text-stone-600">
						Mata Pelajaran
						<div className="flex flex-wrap gap-2">
							{subjects.map((s) => {
								const isSelected = selectedIds.includes(s.subjectId);
								return (
									<button
										key={s.subjectId}
										type="button"
										onClick={() => toggleSubject(s.subjectId)}
										className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
											isSelected
												? "border-green-600 bg-green-600 text-white"
												: "border-stone-300 text-stone-600 hover:bg-green-50"
										}`}
									>
										{isSelected && <Check size={14} />}
										{s.subjectName}
									</button>
								);
							})}
							{subjects.length === 0 && (
								<p className="text-sm italic text-stone-400">Memuat...</p>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-1 text-left text-sm font-medium text-stone-600">
						Kenal darimana?
						<div className="flex flex-wrap gap-2">
							{REFERRAL_SOURCES.map((r) => {
								const isSelected = referralSourceId === r.id;
								return (
									<button
										key={r.id}
										type="button"
										onClick={() => setReferralSourceId(r.id)}
										className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
											isSelected
												? "border-green-600 bg-green-600 text-white"
												: "border-stone-300 text-stone-600 hover:bg-green-50"
										}`}
									>
										{isSelected && <Check size={14} />}
										{r.label}
									</button>
								);
							})}
						</div>
					</div>
				</div>

				<div className="border-t border-stone-100 p-6 pt-4">
					<button
						type="button"
						disabled={!canSubmit}
						onClick={handleSubmit}
						className="w-full cursor-pointer rounded-full bg-green-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Kirim Form Registrasi ke Admin
					</button>
				</div>
			</div>
		</div>
	);
}
