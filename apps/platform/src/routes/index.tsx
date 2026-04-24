// import { Sidebar, SidebarItem } from "@lmsproject/ui";
import { createFileRoute } from "@tanstack/react-router";
import { Features } from "../components/landing/Features";
import { Hero } from "../components/landing/Hero";
import { Stats } from "../components/landing/Stats";
import { Teachers } from "../components/landing/Teachers";
import { Testimonials } from "../components/landing/Testimonials";
export const Route = createFileRoute("/")({ component: App });

// https://www.youtube.com/watch?v=NFrFhBJPTmI
function App() {
	console.log("Environment Variable TEST:", import.meta.env.VITE_TEST);
	return (
		<div>
			{/* <Sidebar>
				<SidebarItem icon={<LayoutDashboard size={20} />} />
			</Sidebar> */}
			<Hero schoolName="Madrasatul Ilmin Naafi" />
			<Features />
			<Teachers />
			<Testimonials />
			<Stats />
		</div>
	);
}
