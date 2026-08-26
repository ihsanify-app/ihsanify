import { Link } from "@tanstack/react-router";
import { ArrowRight, Sprout } from "lucide-react";
import { useBrandLogo } from "../../lib/useBrandLogo";
import { Reveal } from "./Reveal";

export function Hero({ schoolName }: { schoolName: string }) {
	const logoUrl = useBrandLogo();
	return (
		<section className="relative overflow-hidden gap-4 min-h-[85vh] bg-linear-to-b from-green-50 via-white to-white flex flex-col items-center justify-center text-center px-4 sm:px-6">
			<div className="absolute -top-24 -right-24 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-70" />
			<div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-60" />
			<Reveal className="relative flex flex-col items-center gap-2">
				{logoUrl ? (
					<img
						src={logoUrl}
						alt={schoolName}
						className="mb-2 h-28 w-28 rounded-full object-cover shadow-sm"
					/>
				) : (
					<div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<Sprout size={32} className="text-green-600" />
					</div>
				)}
				<h1
					dir="rtl"
					lang="ar"
					className="font-heading text-3xl md:text-4xl text-green-800 font-bold leading-relaxed"
				>
					وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ
				</h1>
				<p className="max-w-xl text-lg text-stone-500">
					"Dan sungguh, telah Kami mudahkan Al-Qur'an untuk peringatan, maka
					adakah orang yang mau mengambil pelajaran?"
				</p>
				<p className="text-sm text-stone-400">— QS. Al-Qamar: 17</p>

				<Link
					to="/login"
					className="mt-6 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white text-lg font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-green-600/20"
				>
					Mulai Sekarang
					<ArrowRight size={20} />
				</Link>
				<p className="mt-4 text-sm text-stone-400">
					<i>Powered by Ihsanify ©</i>
				</p>
			</Reveal>
		</section>
	);
}
