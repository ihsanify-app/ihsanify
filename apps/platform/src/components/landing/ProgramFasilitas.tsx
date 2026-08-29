import {
	BookMarked,
	BookOpen,
	BookOpenCheck,
	CalendarCheck2,
	FileText,
	Globe,
	PencilLine,
	Video,
} from "lucide-react";
import { Reveal } from "./Reveal";

// lucide-react's "Languages" icon depicts a CJK character (文) next to a
// Latin "A" — visually reads as Mandarin, not Arabic. No Arabic-script icon
// exists in lucide, so render the letter itself instead, sized to match.
function ArabicLetterIcon({ size = 24 }: { size?: number }) {
	return (
		<span
			dir="rtl"
			lang="ar"
			className="font-bold leading-none"
			style={{ fontSize: size }}
		>
			ا
		</span>
	);
}

const PROGRAMS = [
	{
		icon: BookOpen,
		title: "Tahsin",
		description:
			"Belajar membaca Al-Qur'an dengan tajwid yang benar dan tartil.",
	},
	{
		icon: BookMarked,
		title: "Tahfizh",
		description:
			"Menghafal Al-Qur'an dengan bimbingan sabar dan muroja'ah terjadwal.",
	},
	{
		icon: ArabicLetterIcon,
		title: "Bahasa Arab",
		description:
			"Memahami kaidah dan percakapan Bahasa Arab dari dasar hingga mahir.",
	},
	{
		icon: Globe,
		title: "Bahasa Inggris",
		description: "Percakapan dan tata bahasa Inggris untuk segala usia.",
	},
	{
		icon: PencilLine,
		title: "Calistung",
		description:
			"Membaca, menulis, dan berhitung — pondasi dasar bagi si kecil sebelum memasuki jenjang berikutnya.",
	},
];

const FACILITIES = [
	{
		icon: Video,
		title: "Zoom Premium",
		description: "Sesi belajar tatap muka online tanpa batas waktu.",
	},
	{
		icon: FileText,
		title: "Aplikasi Learning Management System",
		description:
			"Laporan perkembangan belajar, ujian, dan invoice pembayaran — semua dalam satu aplikasi.",
	},
];

export function ProgramFasilitas() {
	return (
		<section
			id="program-fasilitas"
			className="scroll-mt-20 bg-white px-4 py-16 text-center sm:px-6"
		>
			<Reveal>
				<h2 className="font-heading text-3xl font-bold text-green-800">
					Program & Fasilitas
				</h2>
			</Reveal>

			<Reveal delayMs={100}>
				<h3 className="mt-10 flex items-center justify-center gap-2 font-heading text-lg font-bold text-green-800">
					<BookOpenCheck size={20} className="text-green-600" />
					Program Belajar
				</h3>
			</Reveal>
			<div className="mx-auto mt-5 grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
				{PROGRAMS.map((p, i) => (
					<Reveal key={p.title} delayMs={i * 80}>
						<div className="h-full rounded-2xl border border-green-100 bg-green-50 p-6 shadow-sm">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-green-700 shadow-sm">
								<p.icon size={22} />
							</div>
							<h4 className="mt-3 font-heading font-bold text-green-800">
								{p.title}
							</h4>
							<p className="mt-2 text-base leading-relaxed text-stone-600">
								{p.description}
							</p>
						</div>
					</Reveal>
				))}
			</div>

			<Reveal delayMs={100}>
				<h3 className="mt-14 font-heading text-lg font-bold text-green-800">
					Fasilitas
				</h3>
			</Reveal>
			<div className="mx-auto mt-5 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
				{FACILITIES.map((f, i) => (
					<Reveal key={f.title} delayMs={i * 100}>
						<div className="flex h-full items-start gap-4 rounded-2xl border border-green-100 bg-green-50 p-6 text-left shadow-sm">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-green-700 shadow-sm">
								<f.icon size={22} />
							</div>
							<div>
								<h4 className="font-heading font-bold text-green-800">
									{f.title}
								</h4>
								<p className="mt-1 text-base leading-relaxed text-stone-600">
									{f.description}
								</p>
							</div>
						</div>
					</Reveal>
				))}
			</div>

			<Reveal delayMs={200}>
				<div className="mx-auto mt-10 inline-flex items-center gap-2 rounded-full bg-amber-100 px-5 py-2.5 text-base font-medium text-amber-800">
					<CalendarCheck2 size={18} />
					Jadwal Fleksibel — 4x atau 8x pertemuan sebulan, sesuai kesepakatan
				</div>
			</Reveal>
		</section>
	);
}
