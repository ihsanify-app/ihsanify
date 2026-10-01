import { Link } from "@tanstack/react-router";
import { Menu, Sprout, X } from "lucide-react";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
	{ id: "about-us", label: "Tentang Kami" },
	{ id: "filosofi", label: "Filosofi" },
	{ id: "vision-mission", label: "Visi & Misi" },
	{ id: "programs-facilities", label: "Program & Fasilitas" },
	{ id: "why-us", label: "Mengapa Kami" },
	{ id: "testimonials", label: "Testimoni" },
	{ id: "registration", label: "Registrasi" },
	{ id: "faq", label: "FAQ" },
];

export function Navbar({ logoUrl }: { logoUrl: string | null }) {
	const [activeId, setActiveId] = useState(NAV_ITEMS[0].id);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	useEffect(() => {
		const sections = NAV_ITEMS.map((n) => document.getElementById(n.id)).filter(
			(el): el is HTMLElement => el !== null,
		);
		if (sections.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.filter((e) => e.isIntersecting);
				if (visible.length > 0) {
					setActiveId(visible[0].target.id);
				}
			},
			{ rootMargin: "-45% 0px -50% 0px" },
		);
		for (const section of sections) observer.observe(section);
		return () => observer.disconnect();
	}, []);

	return (
		<nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-cream-2">
			<div className="flex items-center justify-between px-4 py-4 sm:px-6">
				<span className="flex items-center gap-2 text-emerald font-heading font-bold text-sm sm:text-xl">
					{logoUrl ? (
						<img
							src={logoUrl}
							alt="Madrasatul 'Ilmin Naafi'"
							className="h-8 w-8 shrink-0 rounded-full object-cover"
						/>
					) : (
						<Sprout className="shrink-0 text-emerald" size={24} />
					)}
					<span className="truncate">Madrasatul 'Ilmin Naafi'</span>
				</span>

				<div className="hidden items-center gap-1 lg:flex">
					{NAV_ITEMS.map((item) => (
						<a
							key={item.id}
							href={`#${item.id}`}
							className={`rounded-full px-3.5 py-2 text-base font-medium transition-colors ${
								activeId === item.id
									? "bg-cream-2 text-emerald"
									: "text-stone-600 hover:bg-cream hover:text-emerald"
							}`}
						>
							{item.label}
						</a>
					))}
				</div>

				<div className="flex items-center gap-2">
					<Link
						to="/login"
						className="hidden bg-emerald hover:bg-emerald-dark transition-colors text-white font-semibold px-6 py-2.5 rounded-full sm:inline-block"
					>
						Login
					</Link>
					<button
						type="button"
						aria-label="Buka menu navigasi"
						onClick={() => setIsMenuOpen((v) => !v)}
						className="rounded-full p-2 text-emerald hover:bg-cream lg:hidden"
					>
						{isMenuOpen ? <X size={22} /> : <Menu size={22} />}
					</button>
				</div>
			</div>

			{isMenuOpen && (
				<div className="max-h-[70vh] overflow-y-auto border-t border-cream-2 px-4 py-3 lg:hidden">
					<div className="flex flex-col gap-1">
						{NAV_ITEMS.map((item) => (
							<a
								key={item.id}
								href={`#${item.id}`}
								onClick={() => setIsMenuOpen(false)}
								className={`rounded-xl px-4 py-2.5 text-base font-medium transition-colors ${
									activeId === item.id
										? "bg-cream-2 text-emerald"
										: "text-stone-600 hover:bg-cream hover:text-emerald"
								}`}
							>
								{item.label}
							</a>
						))}
						<Link
							to="/login"
							onClick={() => setIsMenuOpen(false)}
							className="mt-2 rounded-xl bg-emerald px-4 py-2.5 text-center font-semibold text-white transition-colors hover:bg-emerald-dark sm:hidden"
						>
							Login
						</Link>
					</div>
				</div>
			)}
		</nav>
	);
}
