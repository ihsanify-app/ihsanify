import { Sprout } from "lucide-react";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

// Both objects below are parts of the one real mark (apps/platform/public/
// landing/logo-mark.png), not separate icons — so the same transparent
// icon-only export is used as the badge for both cards.
const PHILOSOPHY_ITEMS = [
	{
		title: "Objek Berbentuk Daun",
		description: "Objek ini merupakan gabungan dari beberapa bentuk:",
		points: [
			"Bentuk buku berjenjang, representasi proses bertahap dalam menuntut ilmu — untuk memahami ilmu yang lebih dalam, seorang penuntut ilmu harus mempelajari ilmu yang lebih sederhana terlebih dahulu.",
			"Bentuk daun bertumbuh, menunjukkan harapan serta optimisme untuk terus berproses dan berkembang menjadi lebih baik.",
			"Warna hijau, dari muda di bagian bawah menuju lebih tua di bagian atas, menunjukkan semakin tinggi tingkat keilmuan seseorang maka akan menghasilkan pemahaman yang semakin dalam.",
			"Garis lekuk halus menunjukkan kelembutan adab seorang penuntut ilmu.",
		],
	},
	{
		title: "Objek Cahaya Matahari",
		description: "Objek ini merupakan representasi dari:",
		points: [
			"Ilmu yang bermanfaat, menyinari kegelapan yang disebabkan kebodohan.",
			"Adab, memberikan cahaya yang menenangkan, bukan yang menyakitkan mata.",
		],
	},
];

export function Filosofi({ logoUrl }: { logoUrl: string | null }) {
	return (
		<section
			id="filosofi"
			className="scroll-mt-20 bg-white px-4 py-16 text-center sm:px-6"
		>
			<Reveal>
				<Eyebrow className="mb-3">Identitas</Eyebrow>
				<h2 className="font-heading text-3xl font-bold text-emerald">
					Filosofi Logo
				</h2>
				<p className="mx-auto mt-2 max-w-xl text-base text-stone-700">
					Setiap bentuk dan warna pada lambang kami menyimpan makna tentang
					bagaimana ilmu seharusnya ditempuh.
				</p>
			</Reveal>

			<Reveal delayMs={80}>
				<div className="mx-auto mt-8 flex h-48 w-48 items-center justify-center rounded-full bg-cream shadow-sm">
					{logoUrl ? (
						<img
							src={logoUrl}
							alt="Lambang Madrasatul 'Ilmin Naafi'"
							className="h-full w-full rounded-full object-cover"
						/>
					) : (
						<Sprout size={40} className="text-emerald" />
					)}
				</div>
			</Reveal>

			<div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
				{PHILOSOPHY_ITEMS.map((item, i) => (
					<Reveal key={item.title} delayMs={120 + i * 100}>
						<div className="h-full rounded-2xl bg-forest p-6 text-left shadow-sm">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
								<img
									src="/landing/logo-mark.png"
									alt=""
									className="h-7 w-7 object-contain"
								/>
							</div>
							<h3 className="mt-3 font-heading text-xl font-bold text-white">
								{item.title}
							</h3>
							<p className="mt-2 text-base leading-relaxed text-green-100">
								{item.description}
							</p>
							<ol className="mt-2 flex list-decimal flex-col gap-2 pl-4 text-base leading-relaxed text-green-100">
								{item.points.map((point) => (
									<li key={point}>{point}</li>
								))}
							</ol>
						</div>
					</Reveal>
				))}
			</div>
		</section>
	);
}
