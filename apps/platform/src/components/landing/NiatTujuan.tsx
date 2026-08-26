import { Eye, Target } from "lucide-react";
import { Reveal } from "./Reveal";

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
								<ol className="mt-2 flex list-decimal flex-col gap-2 pl-4 text-sm leading-relaxed text-stone-600">
									{item.description.map((point) => (
										<li key={point}>{point}</li>
									))}
								</ol>
							) : (
								<p className="mt-2 text-sm leading-relaxed text-stone-600">
									{item.description}
								</p>
							)}
						</div>
					</Reveal>
				))}
			</div>
		</section>
	);
}
