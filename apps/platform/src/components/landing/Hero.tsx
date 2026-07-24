import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function Hero({ schoolName }: { schoolName: string }) {
	return (
		<section className="relative overflow-hidden gap-4 min-h-[85vh] bg-linear-to-b from-green-50 via-white to-white flex flex-col items-center justify-center text-center px-6">
			<div className="absolute -top-24 -right-24 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-70" />
			<div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-60" />
			<span className="relative text-5xl mb-2">🌱</span>
			<h1 className="relative font-heading text-4xl md:text-5xl text-green-800 mb-2 font-extrabold">
				Welcome to {schoolName}
			</h1>
			<p className="relative text-lg text-stone-500 mb-8">
				Powered by Ihsanify — learning made warm and simple.
			</p>
			<Link
				to="/login"
				className="relative inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white text-lg font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-green-600/20"
			>
				Get Started
				<ArrowRight size={20} />
			</Link>
		</section>
	);
}
