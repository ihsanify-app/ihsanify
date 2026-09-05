import { Link } from "@tanstack/react-router";
import { Menu, Sprout, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useBrandLogo } from "../../lib/useBrandLogo";

const NAV_ITEMS = [
	{ id: "tentang-kami", label: "Tentang Kami" },
	{ id: "niat-tujuan", label: "Visi & Misi" },
	{ id: "program-fasilitas", label: "Program & Fasilitas" },
	{ id: "mengapa-kami", label: "Mengapa Kami" },
	{ id: "testimoni", label: "Testimoni" },
	{ id: "registrasi", label: "Registrasi" },
	{ id: "faq", label: "FAQ" },
];

export function Navbar() {
	const logoUrl = useBrandLogo();
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
		<nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-green-100">
			<div className="flex items-center justify-between px-4 py-4 sm:px-6">
				<span className="flex items-center gap-2 text-green-700 font-heading font-bold text-sm sm:text-xl">
					{logoUrl ? (
						<img
							src={logoUrl}
							alt="Madrasatul 'Ilmin Naafi'"
							className="h-8 w-8 shrink-0 rounded-full object-cover"
						/>
					) : (
						<Sprout className="shrink-0 text-green-600" size={24} />
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
									? "bg-green-100 text-green-800"
									: "text-stone-600 hover:bg-green-50 hover:text-green-700"
							}`}
						>
							{item.label}
						</a>
					))}
				</div>

				<div className="flex items-center gap-2">
					<Link
						to="/login"
						className="hidden bg-green-600 hover:bg-green-700 transition-colors text-white font-semibold px-6 py-2.5 rounded-full sm:inline-block"
					>
						Login
					</Link>
					<button
						type="button"
						aria-label="Buka menu navigasi"
						onClick={() => setIsMenuOpen((v) => !v)}
						className="rounded-full p-2 text-green-700 hover:bg-green-50 lg:hidden"
					>
						{isMenuOpen ? <X size={22} /> : <Menu size={22} />}
					</button>
				</div>
			</div>

			{isMenuOpen && (
				<div className="max-h-[70vh] overflow-y-auto border-t border-green-100 px-4 py-3 lg:hidden">
					<div className="flex flex-col gap-1">
						{NAV_ITEMS.map((item) => (
							<a
								key={item.id}
								href={`#${item.id}`}
								onClick={() => setIsMenuOpen(false)}
								className={`rounded-xl px-4 py-2.5 text-base font-medium transition-colors ${
									activeId === item.id
										? "bg-green-100 text-green-800"
										: "text-stone-600 hover:bg-green-50 hover:text-green-700"
								}`}
							>
								{item.label}
							</a>
						))}
						<Link
							to="/login"
							onClick={() => setIsMenuOpen(false)}
							className="mt-2 rounded-xl bg-green-600 px-4 py-2.5 text-center font-semibold text-white transition-colors hover:bg-green-700 sm:hidden"
						>
							Login
						</Link>
					</div>
				</div>
			)}
		</nav>
	);
}
