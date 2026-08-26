import { createFileRoute } from "@tanstack/react-router";
import { Faq } from "../components/landing/Faq";
import { Footer } from "../components/landing/Footer";
import { Hero } from "../components/landing/Hero";
import { InstagramMarquee } from "../components/landing/InstagramMarquee";
import { Navbar } from "../components/landing/Navbar";
import { NiatTujuan } from "../components/landing/NiatTujuan";
import { ProgramFasilitas } from "../components/landing/ProgramFasilitas";
import { Registrasi } from "../components/landing/Registrasi";
import { TentangKami } from "../components/landing/TentangKami";
import { Testimonials } from "../components/landing/Testimonials";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div>
			<Navbar />
			<Hero schoolName="Madrasatul Ilmin Naafi" />
			<InstagramMarquee />
			<TentangKami />
			<NiatTujuan />
			<ProgramFasilitas />
			<Testimonials />
			<Registrasi />
			<Faq />
			<Footer />
		</div>
	);
}
