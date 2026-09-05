import { Reveal } from "./Reveal";

export function QuranVerse() {
	return (
		<section className="relative overflow-hidden bg-linear-to-b from-white via-green-50/60 to-white">
			<div className="absolute -top-20 -left-20 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-50" />
			<div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-40" />
			<div className="absolute -bottom-20 left-1/4 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-40" />
			<Reveal className="relative flex flex-col items-center gap-2 text-center py-24 px-4 sm:px-6">
				<h2
					dir="rtl"
					lang="ar"
					className="font-heading text-2xl md:text-3xl text-green-800 font-bold leading-relaxed"
				>
					وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ
				</h2>
				<p className="max-w-xl text-base text-stone-500">
					"Dan sungguh, telah Kami mudahkan Al-Qur'an untuk peringatan, maka
					adakah orang yang mau mengambil pelajaran?"
				</p>
				<p className="text-sm text-stone-400">— QS. Al-Qamar: 17</p>
			</Reveal>
		</section>
	);
}
