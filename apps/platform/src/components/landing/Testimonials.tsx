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
		<section className="bg-gray-70 py-10 px-6 text-center">
			<h2 className="text-3xl font-bold text-green-700 ">Testimonials</h2>
			<div className="grid grid-cols-4 gap-6 bg-white">
				{testimonials.map((t) => (
					<div key={t.id}>
						<span className="text-4xl">{t.icon}</span>
						<h4 className="text-lg font-semibold mt-3">{t.name}</h4>
						<p className="text-gray-500 text-sm mt-1">
							<i>{t.subject}</i>
						</p>
						<div className="bg-green-100 py-10 px-1 rounded-2xl ml-10 mr-10 mt-5 opacity-200 text-amber-800">
							<p className="text-gray-700 text-lg">{t.content}</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
