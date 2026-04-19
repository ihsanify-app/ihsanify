// import { Sidebar, SidebarItem } from "@lmsproject/ui";
import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "../components/Hero";
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
		</div>
	);
}
