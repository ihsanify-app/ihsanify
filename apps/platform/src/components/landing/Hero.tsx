import { ArrowRight, Sprout } from "lucide-react";
import { useState } from "react";
import { useBrandLogo } from "../../lib/useBrandLogo";
import { RegistrasiFormModal } from "./RegistrasiFormModal";
import { Reveal } from "./Reveal";

export function Hero({ schoolName }: { schoolName: string }) {
	const logoUrl = useBrandLogo();
	const [isFormOpen, setIsFormOpen] = useState(false);
	return (
		<section className="relative overflow-hidden gap-4 min-h-[85vh] bg-linear-to-b from-green-50 via-white to-white flex flex-col items-center justify-center text-center px-4 sm:px-6">
			<div className="absolute -top-24 -right-24 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-70" />
			<div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-60" />
			<Reveal className="relative flex flex-col items-center gap-2">
				{logoUrl ? (
					<img
						src={logoUrl}
						alt={schoolName}
						className="mb-2 h-24 w-24 rounded-full object-cover shadow-sm"
					/>
				) : (
					<div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<Sprout size={32} className="text-green-600" />
					</div>
				)}
				<h1 className="font-heading text-3xl md:text-5xl font-bold text-green-800">
					{schoolName}
				</h1>
				<p className="max-w-xl text-lg font-semibold text-green-700 md:text-xl">
					Belajar Ilmu, Bertumbuh dalam Adab, Dekat dengan Al-Qur'an.
				</p>
				<p className="max-w-xl text-base text-stone-500">
					Pembelajaran Tahsin, Tahfizh Al-Qur'an, Bahasa Arab, Bahasa Inggris,
					dan Calistung untuk anak dan keluarga.
				</p>

				<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						onClick={() => setIsFormOpen(true)}
						className="inline-flex cursor-pointer items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white text-lg font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-green-600/20"
					>
						Daftar Sekarang
						<ArrowRight size={20} />
					</button>
					<a
						href="#program-fasilitas"
						className="inline-flex items-center gap-2 border border-green-300 text-green-700 hover:bg-green-50 transition-colors text-lg font-semibold px-8 py-3.5 rounded-full"
					>
						Lihat Program
					</a>
				</div>
				<p className="mt-4 text-base text-stone-400">
					<i>Powered by Ihsanify ©</i>
				</p>
			</Reveal>
			{isFormOpen && (
				<RegistrasiFormModal onClose={() => setIsFormOpen(false)} />
			)}
		</section>
	);
}
