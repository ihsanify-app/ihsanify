import { createFileRoute } from "@tanstack/react-router";
import { AboutUs } from "../components/landing/AboutUs";
import { AlmaMater } from "../components/landing/AlmaMater";
import { AppScreenshots } from "../components/landing/AppScreenshots";
import { Faq } from "../components/landing/Faq";
import { Filosofi } from "../components/landing/Filosofi";
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
import { apiFetch } from "../lib/apiClient";

export const Route = createFileRoute("/")({
	component: App,
	// Resolved server-side during SSR (and cached for client navigations),
	// so the brand logo ships in the first HTML instead of swapping in
	// after a client-only fetch — see useBrandLogo.ts for the pattern this
	// replaces on this page specifically.
	loader: async () => {
		const { status, body } = await apiFetch("/public/branding");
		const logoUrl: string | null =
			status === 200 ? (body?.data?.logoUrl ?? null) : null;
		return { logoUrl };
	},
});

function App() {
	const { logoUrl } = Route.useLoaderData();
	return (
		<div className="font-sans">
			<Navbar logoUrl={logoUrl} />
			<Hero schoolName="Madrasatul 'Ilmin Naafi'" logoUrl={logoUrl} />
			<Stats />
			<QuranVerse />
			<InstagramMarquee />
			<AboutUs />
			<Filosofi logoUrl={logoUrl} />
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
