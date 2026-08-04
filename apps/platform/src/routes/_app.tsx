import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "../components/dashboard/Header";
import { Sidebar } from "../components/dashboard/Sidebar";

export const Route = createFileRoute("/_app")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex">
			<Sidebar />
			<main className="flex-1">
				<Header />
				<Outlet />
			</main>
		</div>
	);
}
