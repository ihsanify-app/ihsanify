import { Sprout } from "lucide-react";

export function Footer() {
	return (
		<footer className="bg-forest text-white px-10 py-10 mt-10">
			<div className="flex max-sm:flex-col sm:flex-row justify-center gap-8 sm:gap-32 max-sm:items-center sm:items-start w-full mb-8 text-center sm:text-left">
				<div className="flex items-center gap-2 text-2xl font-heading font-bold text-white">
					<Sprout size={24} className="text-green-300" />
					Ihsanify
				</div>
				<div className="flex items-center gap-3">
					{/* Icons are the same dark-green-recolored assets used in the
					    Hero — against this footer's identical bg-forest background
					    they'd otherwise disappear, so each gets a small cream
					    backing plate for contrast instead of a second icon color
					    variant to maintain. */}
					<a
						href="https://www.instagram.com/ilmin_naafi/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Instagram Madrasatul 'Ilmin Naafi'"
						className="block rounded-xl bg-cream p-1.5 transition-opacity hover:opacity-80"
					>
						<img src="/landing/instagram-icon.png" alt="" className="h-6 w-6" />
					</a>
					<a
						href="https://www.threads.net/@ilmin_naafi"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Threads Madrasatul 'Ilmin Naafi'"
						className="block rounded-xl bg-cream p-1.5 transition-opacity hover:opacity-80"
					>
						<img src="/landing/threads-icon.png" alt="" className="h-6 w-6" />
					</a>
				</div>
			</div>
			<div className="border-t border-emerald pt-4 text-center text-base text-green-300">
				© 2026 Ihsanify. All rights reserved.
			</div>
		</footer>
	);
}
