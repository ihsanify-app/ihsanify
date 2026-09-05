import { Reveal } from "./Reveal";

const TIMELINE = [
	{
		year: 2021,
		event:
			"Madrasatul 'Ilmin Naafi' didirikan sebagai aktivitas belajar Tahsin dan Tahfizh secara online, berawal dari inisiatif kecil untuk tetap menuntut ilmu di tengah keterbatasan akibat pandemi Covid-19.",
	},
	{
		year: 2022,
		event:
			"Seiring bertambahnya animo dari orang tua dan murid, Madrasatul 'Ilmin Naafi' membuka program Bahasa Arab untuk memperkaya pemahaman terhadap Al-Qur'an dan kitab-kitab berbahasa Arab.",
	},
	{
		year: 2023,
		event:
			"Madrasatul 'Ilmin Naafi' memperluas cakupan pembelajaran dengan menghadirkan program Bahasa Inggris, guna membekali murid dengan kemampuan berbahasa asing yang bermanfaat dalam kehidupan sehari-hari.",
	},
	{
		year: 2024,
		event:
			"Untuk memberikan gambaran perkembangan belajar yang lebih transparan kepada orang tua, Madrasatul 'Ilmin Naafi' mulai menerapkan sistem laporan belajar bulanan bagi setiap murid.",
	},
	{
		year: 2025,
		event:
			"Animo murid terus bertambah dari berbagai kota di Indonesia. Di tahun ini juga hadir program Calistung untuk membekali anak-anak usia dini dengan kemampuan membaca, menulis, dan berhitung.",
	},
	{
		year: 2026,
		event:
			"Madrasatul 'Ilmin Naafi' mengembangkan teknologi Learning Management System bernama Ihsanify, sebuah platform terpadu yang memudahkan kegiatan belajar-mengajar mulai dari jadwal, laporan, ujian, hingga administrasi pembayaran.",
	},
];

export function TentangKami() {
	return (
		<section
			id="tentang-kami"
			className="scroll-mt-20 bg-green-50 px-4 py-16 text-center sm:px-6"
		>
			<Reveal>
				<h2 className="font-heading text-3xl font-bold text-green-800">
					Tentang Kami
				</h2>
			</Reveal>

			<Reveal delayMs={100}>
				<div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-green-100 bg-white p-6 text-left shadow-sm sm:p-8">
					<p className="text-base leading-relaxed text-stone-600">
						Madrasatul 'Ilmin Naafi' adalah pusat pembelajaran Islam yang hadir
						untuk mendampingi tumbuh kembang anak-anak dan orang tua dengan ilmu
						yang bermanfaat, adab yang mulia, dan cinta kepada Al-Qur'an.
					</p>
					<p className="mt-3 text-base leading-relaxed text-stone-600">
						Kami berkomitmen menciptakan lingkungan belajar yang aman, nyaman,
						menyenangkan, dan berlandaskan Al-Qur'an dan As-Sunnah sesuai
						pemahaman Salafus Shalih.
					</p>
				</div>
			</Reveal>

			<Reveal delayMs={150}>
				<div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-green-100 bg-white p-6 text-left shadow-sm sm:p-8">
					<h3 className="font-heading text-lg font-bold text-green-800">
						Sejarah
					</h3>
					<div className="mt-4">
						{TIMELINE.map((item, i) => {
							const isLast = i === TIMELINE.length - 1;
							return (
								<Reveal key={item.year} delayMs={i * 80}>
									<div className="grid grid-cols-[2rem_1fr] gap-x-4">
										<div className="flex flex-col items-center">
											<span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-green-600 ring-4 ring-white" />
											{!isLast && <span className="w-px flex-1 bg-green-200" />}
										</div>
										<div className={isLast ? "" : "pb-6"}>
											<span className="font-heading text-lg font-bold text-green-700">
												{item.year}
											</span>
											<p className="mt-1 text-base leading-relaxed text-stone-600">
												{item.event}
											</p>
										</div>
									</div>
								</Reveal>
							);
						})}
					</div>
				</div>
			</Reveal>
		</section>
	);
}
