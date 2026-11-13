import { ArrowRight, Sprout } from "lucide-react";
import { useState } from "react";
import { RegistrationFormModal } from "./RegistrationFormModal";
import { Reveal } from "./Reveal";

export function Hero({
	schoolName,
	logoUrl,
}: {
	schoolName: string;
	logoUrl: string | null;
}) {
	const [isFormOpen, setIsFormOpen] = useState(false);
	return (
		<section className="relative overflow-hidden bg-linear-to-b from-cream via-white to-white px-4 py-16 sm:px-6 sm:py-24">
			<div className="absolute -top-24 -right-24 w-72 h-72 bg-cream-2 rounded-full blur-3xl opacity-70" />
			<div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gold-soft rounded-full blur-3xl opacity-60" />
			<div className="relative mx-auto max-w-2xl">
				<Reveal className="flex flex-col items-start text-left">
					{logoUrl ? (
						<img
							src={logoUrl}
							alt={schoolName}
							className="mb-3 h-16 w-16 rounded-full object-cover shadow-sm"
						/>
					) : (
						<div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-cream-2">
							<Sprout size={32} className="text-emerald" />
						</div>
					)}
					<p className="max-w-xl text-base font-semibold text-emerald">
						{schoolName}
					</p>
					<h1 className="mt-3 font-heading text-3xl md:text-5xl font-bold text-emerald">
						Tumbuh bersama <br /> mempelajari & mengamalkan <br /> ilmu yang
						bermanfaat.
					</h1>
					<p className="mt-2 max-w-xl text-base text-stone-700">
						Pembelajaran Tahsin, Tahfizh Al-Qur'an, Bahasa Arab, Bahasa Inggris,
						dan Calistung untuk orang tua dan anak.
					</p>

					<div className="mt-5 flex flex-wrap items-center justify-start gap-2 sm:mt-6 sm:gap-3">
						<button
							type="button"
							onClick={() => setIsFormOpen(true)}
							className="inline-flex cursor-pointer items-center gap-1.5 bg-emerald hover:bg-emerald-dark transition-colors text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-emerald/20 sm:text-lg sm:gap-2 sm:px-8 sm:py-3.5"
						>
							Daftar Sekarang
							<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
						</button>
						{/* Secondary action: a touch lighter than the primary CTA on
						    phone screens (thinner border, regular weight, no fill) so
						    it visually recedes — same tap target size, just quieter. */}
						<a
							href="#programs-facilities"
							className="inline-flex items-center gap-2 border border-emerald/40 text-emerald hover:bg-cream transition-colors text-sm font-medium px-5 py-2.5 rounded-full sm:border-emerald sm:text-lg sm:font-semibold sm:px-8 sm:py-3.5"
						>
							Lihat Program
						</a>
					</div>
					<div className="mt-3 flex items-center gap-2 sm:mt-4 sm:gap-3">
						<a
							href="https://www.instagram.com/ilmin_naafi/"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Instagram Madrasatul 'Ilmin Naafi'"
							className="block h-7 w-7 overflow-hidden rounded-lg transition-opacity hover:opacity-80 sm:h-9 sm:w-9 sm:rounded-xl"
						>
							<img
								src="/landing/instagram-icon.png"
								alt=""
								className="h-full w-full object-cover"
							/>
						</a>
						<a
							href="https://www.threads.net/@ilmin_naafi"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Threads Madrasatul 'Ilmin Naafi'"
							className="block h-7 w-7 overflow-hidden rounded-lg transition-opacity hover:opacity-80 sm:h-9 sm:w-9 sm:rounded-xl"
						>
							<img
								src="/landing/threads-icon.png"
								alt=""
								className="h-full w-full object-cover"
							/>
						</a>
					</div>
					<p className="mt-3 text-base text-stone-600">
						<i>Powered by Ihsanify ©</i>
					</p>
				</Reveal>
			</div>
			{isFormOpen && (
				<RegistrationFormModal onClose={() => setIsFormOpen(false)} />
			)}
		</section>
	);
}
