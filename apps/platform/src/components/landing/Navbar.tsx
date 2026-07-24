import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

export function Navbar() {
	return (
		<nav className="sticky top-0 z-40 flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur border-b border-green-100">
			<span className="flex items-center gap-2 text-green-700 font-heading font-bold text-xl">
				<Sprout className="text-green-600" size={24} />
				Ihsanify
			</span>
			<Link
				to="/login"
				className="bg-green-600 hover:bg-green-700 transition-colors text-white font-semibold px-6 py-2.5 rounded-full"
			>
				Login
			</Link>
		</nav>
	);
}
