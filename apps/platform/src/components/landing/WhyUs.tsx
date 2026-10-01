import {
	BookOpenText,
	ClipboardCheck,
	HeartHandshake,
	MessageCircleHeart,
	Users,
} from "lucide-react";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

const REASONS = [
	{
		icon: BookOpenText,
		title: "Berlandaskan Al-Qur'an dan As-Sunnah",
		description:
			"Pembelajaran diarahkan sesuai pemahaman Salafus Shalih, bukan sekadar mengejar target hafalan.",
	},
	{
		icon: HeartHandshake,
		title: "Mengutamakan Adab dalam Belajar",
		description:
			"Anak tidak hanya belajar apa yang dipelajari, tetapi juga bagaimana menjadi penuntut ilmu yang beradab.",
	},
	{
		icon: Users,
		title: "Pendampingan yang Dekat",
		description:
			"Pengajar memperhatikan perkembangan setiap pembelajar, bukan sekadar menyampaikan materi.",
	},
	{
		icon: ClipboardCheck,
		title: "Perkembangan Belajar Terpantau",
		description:
			"Laporan belajar bulanan memberi orang tua gambaran nyata perkembangan anaknya, bukan sekadar nilai.",
	},
	{
		icon: MessageCircleHeart,
		title: "Bersinergi dengan Orang Tua",
		description:
			"Pendidikan tidak berhenti ketika kelas selesai — orang tua adalah bagian penting dari proses ini.",
	},
];

export function WhyUs() {
	return (
		<section
			id="why-us"
			className="scroll-mt-20 bg-forest px-4 py-16 text-center sm:px-6"
		>
			<Reveal>
				<Eyebrow className="mb-3" tone="amber">
					Kelebihan
				</Eyebrow>
				<h2 className="font-heading text-3xl font-bold text-white">
					Mengapa Madrasatul 'Ilmin Naafi'?
				</h2>
			</Reveal>
			<Reveal delayMs={80}>
				<p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-green-200">
					Bukan sekadar tempat les — kami hadir untuk menemani anak bertumbuh
					dalam ilmu, adab, dan Al-Qur'an.
				</p>
			</Reveal>
			<div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{REASONS.map((r, i) => (
					<Reveal key={r.title} delayMs={140 + i * 80}>
						<div className="flex h-full flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
							<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
								<r.icon size={20} />
							</div>
							<h3 className="font-heading font-bold text-gold-soft">
								{r.title}
							</h3>
							<p className="text-base leading-relaxed text-green-200">
								{r.description}
							</p>
						</div>
					</Reveal>
				))}
			</div>
		</section>
	);
}
