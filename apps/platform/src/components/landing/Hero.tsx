import { ArrowRight, Sprout } from "lucide-react";
import { useState } from "react";
import { MOBILE_SHOTS, PhoneFrame } from "./AppScreenshots";
import { RegistrationFormModal } from "./RegistrationFormModal";
import { Reveal } from "./Reveal";

// Fanned like a hand of cards, progressively more upright left-to-right at
// rest. Hovering one card brings it to center (straightened, scaled up,
// frontmost); the others slide apart — left of the hovered card shifts
// further left, right shifts further right — and shrink, since they're no
// longer the focus.
const FAN_ROTATIONS = [30, 15, 0];

function PhoneStack() {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const shots = MOBILE_SHOTS.slice(0, FAN_ROTATIONS.length);

	return (
		<div className="relative mx-auto h-full w-56">
			{shots.map((shot, i) => {
				const isHovered = hoveredIndex === i;
				const distanceFromHovered =
					hoveredIndex === null ? 0 : i - hoveredIndex;

				const translateX = isHovered ? 0 : distanceFromHovered * 90;
				const scale = isHovered ? 1.15 : hoveredIndex === null ? 1 : 0.85;
				const rotate = isHovered ? 0 : FAN_ROTATIONS[i];
				const visualZIndex = isHovered
					? shots.length + 1
					: shots.length - Math.abs(distanceFromHovered);

				return (
					<div key={shot.src} className="absolute inset-0">
						{/* Visual card — this is the one that animates. It never
						    intercepts the pointer, so the hit-box below it stays a
						    stable hover target even while this layer is mid-transition
						    (otherwise the card's shape changing under the cursor as it
						    straightens/grows could slip out from under the mouse and
						    cancel its own hover). */}
						<div
							className="pointer-events-none absolute inset-0 transition-transform duration-400 ease-out"
							style={{
								zIndex: visualZIndex,
								transform: `translateX(${translateX}px) rotate(${rotate}deg) scale(${scale})`,
							}}
						>
							<PhoneFrame shot={shot} />
						</div>
						{/* Hover hit-box — stays fixed at the resting fan rotation so
						    its exposed "peeking corner" area never moves. A real
						    <button> (not a div) so it's keyboard-focusable and
						    announced to screen readers; onFocus/onBlur give keyboard
						    users the same spotlight effect as a mouse hover. */}
						<button
							type="button"
							aria-label={shot.alt}
							className="absolute inset-0 cursor-default border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-emerald focus-visible:outline-offset-2"
							style={{
								zIndex: shots.length + 2 + i,
								transform: `rotate(${FAN_ROTATIONS[i]}deg)`,
							}}
							onMouseEnter={() => setHoveredIndex(i)}
							onMouseLeave={() => setHoveredIndex(null)}
							onFocus={() => setHoveredIndex(i)}
							onBlur={() => setHoveredIndex(null)}
						/>
					</div>
				);
			})}
		</div>
	);
}

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
			<div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
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

					<div className="mt-6 flex flex-wrap items-center justify-start gap-3">
						<button
							type="button"
							onClick={() => setIsFormOpen(true)}
							className="inline-flex cursor-pointer items-center gap-2 bg-emerald hover:bg-emerald-dark transition-colors text-white text-lg font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-emerald/20"
						>
							Daftar Sekarang
							<ArrowRight size={20} />
						</button>
						<a
							href="#programs-facilities"
							className="inline-flex items-center gap-2 border border-emerald text-emerald hover:bg-cream transition-colors text-lg font-semibold px-8 py-3.5 rounded-full"
						>
							Lihat Program
						</a>
					</div>
					<p className="mt-4 text-base text-stone-600">
						<i>Powered by Ihsanify ©</i>
					</p>
				</Reveal>

				<Reveal delayMs={120} className="hidden h-120 lg:block">
					<PhoneStack />
				</Reveal>
			</div>
			{isFormOpen && (
				<RegistrationFormModal onClose={() => setIsFormOpen(false)} />
			)}
		</section>
	);
}
