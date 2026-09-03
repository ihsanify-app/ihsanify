import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, useState } from "react";
import { Reveal } from "./Reveal";

type Shot = {
	src: string;
	alt: string;
};

const DESKTOP_SHOTS: Shot[] = [
	{
		src: "/landing/screenshots/desktop-calendar.png",
		alt: "Kalender jadwal kelas mingguan di dashboard Ihsanify",
	},
	{
		src: "/landing/screenshots/desktop-reports.png",
		alt: "Daftar laporan belajar pelajar di dashboard Ihsanify",
	},
	{
		src: "/landing/screenshots/desktop-sessions.png",
		alt: "Log sesi dan presensi kelas di dashboard Ihsanify",
	},
];

const MOBILE_SHOTS: Shot[] = [
	{
		src: "/landing/screenshots/mobile-calendar.png",
		alt: "Dashboard dan jadwal kelas di ponsel",
	},
	{
		src: "/landing/screenshots/mobile-report.png",
		alt: "Laporan belajar bulanan di ponsel",
	},
	{
		src: "/landing/screenshots/mobile-report-pdf-1.png",
		alt: "Sampul laporan belajar yang bisa diunduh",
	},
	{
		src: "/landing/screenshots/mobile-report-pdf-2.png",
		alt: "Isi laporan belajar — progress dan saran dari pengajar",
	},
];

function BrowserFrame({ shot }: { shot: Shot }) {
	return (
		<div className="w-full overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
			<div className="flex items-center gap-1.5 border-b border-green-100 bg-stone-50 px-3 py-2.5">
				<span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
				<span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
				<span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
				<span className="ml-2 truncate rounded-full bg-white px-3 py-0.5 text-[11px] text-stone-400">
					ilminnaafi.com
				</span>
			</div>
			<img
				src={shot.src}
				alt={shot.alt}
				className="aspect-[1900/988] w-full object-cover object-top"
				loading="lazy"
			/>
		</div>
	);
}

function PhoneFrame({ shot }: { shot: Shot }) {
	return (
		<div className="mx-auto w-full max-w-xs rounded-4xl border-4 border-stone-800 bg-stone-800 p-1.5 shadow-sm">
			<div className="relative aspect-[9/17] overflow-hidden rounded-3xl bg-stone-50">
				<div className="absolute inset-x-0 top-0 z-10 flex justify-center">
					<div className="h-4 w-20 rounded-b-xl bg-stone-800" />
				</div>
				<img
					src={shot.src}
					alt={shot.alt}
					className="h-full w-full object-contain"
					loading="lazy"
				/>
			</div>
		</div>
	);
}

// One full-width slide visible at a time (scroll-snap), with arrow buttons
// and dot indicators for discoverability — a plain scroll-only carousel has
// no visual hint that more slides exist for a mouse/keyboard visitor.
//
// `expandOnDesktop` swaps the carousel for a static grid (every shot visible
// at once, no paging) at the `lg` breakpoint — paging one at a time only
// makes sense where a single slide is all that fits; a desktop-width screen
// has room to show a set of compact phone mockups side by side instead of
// leaving most of the row empty.
function ScreenshotCarousel({
	shots,
	renderFrame,
	onOpenLightbox,
	expandOnDesktop = false,
}: {
	shots: Shot[];
	renderFrame: (shot: Shot) => React.ReactNode;
	onOpenLightbox: (shot: Shot) => void;
	expandOnDesktop?: boolean;
}) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	function scrollToIndex(index: number) {
		const track = trackRef.current;
		const slide = track?.children[index];
		slide?.scrollIntoView({
			behavior: "smooth",
			inline: "center",
			block: "nearest",
		});
	}

	function handleScroll() {
		const track = trackRef.current;
		if (!track) return;
		const index = Math.round(track.scrollLeft / track.clientWidth);
		setActiveIndex(Math.min(shots.length - 1, Math.max(0, index)));
	}

	return (
		<>
			{/* Carousel — the only view below `lg`, and (when expandOnDesktop is
			    set) also hidden at `lg` in favor of the static grid below. Kept
			    as its own subtree with an unconditional `flex` track rather than
			    trying to switch one element between flex and grid responsively:
			    this project's Tailwind build was found not to let a later `lg:`
			    variant override a plain `flex` base on the same element. */}
			<div className={`relative ${expandOnDesktop ? "lg:hidden" : ""}`}>
				<div
					ref={trackRef}
					onScroll={handleScroll}
					className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
				>
					{shots.map((shot) => (
						<div key={shot.src} className="w-full shrink-0 snap-center px-4">
							<button
								type="button"
								onClick={() => onOpenLightbox(shot)}
								aria-label={`Perbesar tampilan: ${shot.alt}`}
								className="w-full cursor-zoom-in"
							>
								{renderFrame(shot)}
							</button>
						</div>
					))}
				</div>

				{shots.length > 1 && (
					<>
						<button
							type="button"
							aria-label="Sebelumnya"
							onClick={() => scrollToIndex(activeIndex - 1)}
							disabled={activeIndex === 0}
							className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-green-700 shadow-sm transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0"
						>
							<ChevronLeft size={20} />
						</button>
						<button
							type="button"
							aria-label="Berikutnya"
							onClick={() => scrollToIndex(activeIndex + 1)}
							disabled={activeIndex === shots.length - 1}
							className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-green-700 shadow-sm transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0"
						>
							<ChevronRight size={20} />
						</button>
						<div className="mt-4 flex justify-center gap-2">
							{shots.map((shot, i) => (
								<button
									key={shot.src}
									type="button"
									aria-label={`Ke gambar ${i + 1}`}
									onClick={() => scrollToIndex(i)}
									className={`h-2 rounded-full transition-all ${
										i === activeIndex ? "w-6 bg-green-600" : "w-2 bg-green-200"
									}`}
								/>
							))}
						</div>
					</>
				)}
			</div>

			{expandOnDesktop && (
				<div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
					{shots.map((shot) => (
						<button
							key={shot.src}
							type="button"
							onClick={() => onOpenLightbox(shot)}
							aria-label={`Perbesar tampilan: ${shot.alt}`}
							className="cursor-zoom-in"
						>
							{renderFrame(shot)}
						</button>
					))}
				</div>
			)}
		</>
	);
}

function Lightbox({ shot, onClose }: { shot: Shot; onClose: () => void }) {
	return (
		<div
			role="dialog"
			aria-modal="true"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 p-4"
			onClick={onClose}
		>
			<button
				type="button"
				onClick={onClose}
				aria-label="Tutup"
				className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-stone-700 hover:bg-white"
			>
				<X size={20} />
			</button>
			<img
				src={shot.src}
				alt={shot.alt}
				className="max-h-full max-w-full cursor-zoom-out rounded-lg object-contain shadow-xl"
			/>
		</div>
	);
}

export function AppScreenshots() {
	const [lightboxShot, setLightboxShot] = useState<Shot | null>(null);

	return (
		<section
			id="app-screenshots"
			className="scroll-mt-20 bg-green-50 px-4 py-16 text-center sm:px-6"
		>
			<Reveal>
				<h2 className="font-heading text-3xl font-bold text-green-800">
					Dikelola dengan Sistem yang Transparan
				</h2>
			</Reveal>
			<Reveal delayMs={80}>
				<p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
					Ihsanify menghubungkan pengajar, pelajar, dan orang tua dalam satu
					aplikasi — mulai dari jadwal, presensi, hingga laporan belajar
					bulanan.
				</p>
			</Reveal>

			<Reveal delayMs={140}>
				<h3 className="mt-12 font-heading text-lg font-bold text-green-800">
					Untuk Admin & Pengajar
				</h3>
				<p className="mt-1 text-base text-stone-600">
					Kelola jadwal, presensi, dan laporan dari satu dashboard.
				</p>
			</Reveal>
			<Reveal delayMs={180} className="mt-6">
				<ScreenshotCarousel
					shots={DESKTOP_SHOTS}
					renderFrame={(shot) => <BrowserFrame shot={shot} />}
					onOpenLightbox={setLightboxShot}
				/>
			</Reveal>

			<Reveal delayMs={140}>
				<h3 className="mt-14 font-heading text-lg font-bold text-green-800">
					Untuk Pelajar & Orang Tua
				</h3>
				<p className="mt-1 text-base text-stone-600">
					Pantau jadwal dan perkembangan belajar kapan saja, langsung dari
					ponsel.
				</p>
			</Reveal>
			<Reveal delayMs={180} className="mt-6">
				<ScreenshotCarousel
					shots={MOBILE_SHOTS}
					renderFrame={(shot) => <PhoneFrame shot={shot} />}
					onOpenLightbox={setLightboxShot}
					expandOnDesktop
				/>
			</Reveal>

			{lightboxShot && (
				<Lightbox shot={lightboxShot} onClose={() => setLightboxShot(null)} />
			)}
		</section>
	);
}
