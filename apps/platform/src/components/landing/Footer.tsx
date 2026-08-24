import { Sprout } from "lucide-react";

export function Footer() {
	return (
		<footer className="bg-green-900 text-white px-10 py-10 mt-10">
			<div className="flex max-sm:flex-col sm:flex-row justify-center gap-8 sm:gap-32 max-sm:items-center sm:items-start w-full mb-8 text-center sm:text-left">
				<div className="flex items-center gap-2 text-2xl font-heading font-bold text-white">
					<Sprout size={24} className="text-green-300" />
					Ihsanify
				</div>
				<div className="flex flex-col gap-2 text-sm text-green-200">
					<a
						href="https://www.instagram.com/ilmin_naafi/"
						className="hover:text-white transition-colors"
					>
						About
					</a>
					<a
						href="https://www.instagram.com/ilmin_naafi/"
						className="hover:text-white transition-colors"
					>
						Contact
					</a>
					<a
						href="https://www.instagram.com/ilmin_naafi/"
						className="hover:text-white transition-colors"
					>
						Privacy Policy
					</a>
				</div>
			</div>
			<div className="border-t border-green-800 pt-4 text-center text-sm text-green-300">
				© 2026 Ihsanify. All rights reserved.
			</div>
		</footer>
	);
}
