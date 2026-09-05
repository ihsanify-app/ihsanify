import {
	BookOpen,
	Eye,
	Handshake,
	Heart,
	MessageCircle,
	Star,
	Target,
	Users,
} from "lucide-react";
import { Reveal } from "./Reveal";

const GROWTH_TRAITS = [
	{ icon: Heart, label: "Cinta kepada Al-Qur'an" },
	{ icon: BookOpen, label: "Semangat menuntut ilmu" },
	{ icon: Handshake, label: "Adab dan akhlak" },
	{ icon: MessageCircle, label: "Kemampuan berkomunikasi" },
	{ icon: Star, label: "Kepercayaan diri" },
	{ icon: Users, label: "Kepedulian kepada sesama" },
];

const ITEMS = [
	{
		icon: Eye,
		title: "Visi",
		description:
			"Menjadi tempat bertumbuhnya generasi pecinta ilmu dan Al-Qur'an yang berakhlak mulia, cerdas, percaya diri, dan siap memberi manfaat bagi sesama.",
	},
	{
		icon: Target,
		title: "Misi",
		description: [
			"Menyediakan pembelajaran Islami yang berkualitas dan menyenangkan.",
			"Menanamkan adab dan nilai-nilai Islam dalam setiap aktivitas.",
			"Membimbing anak mencintai Al-Qur'an dan mengamalkannya.",
			"Membangun kolaborasi positif antara guru, orang tua, dan murid.",
			"Menyiapkan generasi berkarakter Islami yang siap menghadapi masa depan.",
		],
	},
];

export function NiatTujuan() {
	return (
		<section
			id="niat-tujuan"
			className="scroll-mt-20 bg-white px-4 py-16 text-center sm:px-6"
		>
			<Reveal>
				<h2 className="font-heading text-3xl font-bold text-green-800">
					Visi & Misi
				</h2>
				<p className="mx-auto mt-2 max-w-xl text-stone-500">
					Landasan kami dalam membersamai perjalanan belajar Anda.
				</p>
			</Reveal>
			<div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
				{ITEMS.map((item, i) => (
					<Reveal key={item.title} delayMs={i * 100}>
						<div className="h-full rounded-2xl border border-green-100 bg-green-50 p-6 text-left shadow-sm">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-green-700 shadow-sm">
								<item.icon size={22} />
							</div>
							<h3 className="mt-3 font-heading text-xl font-bold text-green-800">
								{item.title}
							</h3>
							{Array.isArray(item.description) ? (
								<ol className="mt-2 flex list-decimal flex-col gap-2 pl-4 text-base leading-relaxed text-stone-600">
									{item.description.map((point) => (
										<li key={point}>{point}</li>
									))}
								</ol>
							) : (
								<p className="mt-2 text-base leading-relaxed text-stone-600">
									{item.description}
								</p>
							)}
						</div>
					</Reveal>
				))}
			</div>

			<Reveal delayMs={200}>
				<h3 className="mt-14 font-heading text-lg font-bold text-green-800">
					Apa yang Akan Bertumbuh dalam Diri Anak?
				</h3>
			</Reveal>
			<div className="mx-auto mt-5 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
				{GROWTH_TRAITS.map((trait, i) => (
					<Reveal key={trait.label} delayMs={220 + i * 60}>
						<div className="flex h-full flex-col items-center gap-2 rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-green-700 shadow-sm">
								<trait.icon size={18} />
							</div>
							<p className="text-sm font-medium text-stone-700">
								{trait.label}
							</p>
						</div>
					</Reveal>
				))}
			</div>
		</section>
	);
}
