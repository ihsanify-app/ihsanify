import { Reveal } from "./Reveal";

const testimonials = [
	{
		id: 1,
		name: "Maryam",
		icon: "👧🏼",
		subject: "Tahsin",
		content:
			"Belajar Tahsin jadi lebih mudah dan menyenangkan. Gurunya sabar dan materinya sangat terstruktur!",
	},
	{
		id: 2,
		name: "Ibrahim",
		icon: "👶🏻",
		subject: "Bahasa Arab",
		content:
			"Sekarang saya bisa baca kitab dengan lebih lancar. Platform ini benar-benar membantu belajar Bahasa Arab dari nol.",
	},
	{
		id: 3,
		name: "Ahmad",
		icon: "👶🏼",
		subject: "Bahasa Inggris",
		content:
			"Cara belajarnya seru dan tidak membosankan. Nilai Bahasa Inggris saya meningkat pesat sejak belajar di sini.",
	},
	{
		id: 4,
		name: "Thalia",
		icon: "👩",
		subject: "Calistung",
		content:
			"Anak saya yang tadinya belum bisa baca, kini sudah lancar membaca dalam 2 bulan. Alhamdulillah!",
	},
];

export function Testimonials() {
	return (
		<section
			id="testimoni"
			className="scroll-mt-20 bg-green-50 py-16 px-4 text-center sm:px-6"
		>
			<Reveal>
				<h2 className="font-heading text-3xl font-bold text-green-800 mb-10">
					Kata Mereka
				</h2>
			</Reveal>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
				{testimonials.map((t, i) => (
					<Reveal key={t.id} delayMs={i * 80}>
						<div className="h-full bg-white rounded-2xl p-6 shadow-sm border border-green-100 flex flex-col items-center">
							<div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mb-3">
								{t.icon}
							</div>
							<h4 className="text-lg font-semibold text-stone-800">{t.name}</h4>
							<p className="text-sm text-stone-500 mb-3">
								<i>{t.subject}</i>
							</p>
							<p className="text-stone-600 text-sm leading-relaxed">
								{t.content}
							</p>
						</div>
					</Reveal>
				))}
			</div>
		</section>
	);
}
