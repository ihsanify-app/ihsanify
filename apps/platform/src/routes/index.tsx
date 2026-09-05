import { createFileRoute } from "@tanstack/react-router";
import { AppScreenshots } from "../components/landing/AppScreenshots";
import { Faq } from "../components/landing/Faq";
import { Footer } from "../components/landing/Footer";
import { Hero } from "../components/landing/Hero";
import { InstagramMarquee } from "../components/landing/InstagramMarquee";
import { MengapaKami } from "../components/landing/MengapaKami";
import { Navbar } from "../components/landing/Navbar";
import { NiatTujuan } from "../components/landing/NiatTujuan";
import { ProgramFasilitas } from "../components/landing/ProgramFasilitas";
import { QuranVerse } from "../components/landing/QuranVerse";
import { Registrasi } from "../components/landing/Registrasi";
import { Stats } from "../components/landing/Stats";
import { TentangKami } from "../components/landing/TentangKami";
import { Testimonials } from "../components/landing/Testimonials";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="font-sans">
			<Navbar />
			<Hero schoolName="Madrasatul 'Ilmin Naafi'" />
			<QuranVerse />
			<Stats />
			<InstagramMarquee />
			<TentangKami />
			<NiatTujuan />
			<ProgramFasilitas />
			<MengapaKami />
			<AppScreenshots />
			<Testimonials />
			<Faq />
			<Registrasi />
			<Footer />
		</div>
	);
}
