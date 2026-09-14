import { createFileRoute } from "@tanstack/react-router";
import { AboutUs } from "../components/landing/AboutUs";
import { AlmaMater } from "../components/landing/AlmaMater";
import { AppScreenshots } from "../components/landing/AppScreenshots";
import { Faq } from "../components/landing/Faq";
import { Footer } from "../components/landing/Footer";
import { Hero } from "../components/landing/Hero";
import { InstagramMarquee } from "../components/landing/InstagramMarquee";
import { Navbar } from "../components/landing/Navbar";
import { ProgramsFacilities } from "../components/landing/ProgramsFacilities";
import { QuranVerse } from "../components/landing/QuranVerse";
import { Registration } from "../components/landing/Registration";
import { Stats } from "../components/landing/Stats";
import { Teachers } from "../components/landing/Teachers";
import { Testimonials } from "../components/landing/Testimonials";
import { VisionMission } from "../components/landing/VisionMission";
import { WhyUs } from "../components/landing/WhyUs";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="font-sans">
			<Navbar />
			<Hero schoolName="Madrasatul 'Ilmin Naafi'" />
			<QuranVerse />
			<Stats />
			<InstagramMarquee />
			<AboutUs />
			<VisionMission />
			<ProgramsFacilities />
			<WhyUs />
			<Teachers />
			<AlmaMater />
			<AppScreenshots />
			<Testimonials />
			<Faq />
			<Registration />
			<Footer />
		</div>
	);
}
