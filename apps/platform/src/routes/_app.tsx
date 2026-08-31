import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "../components/dashboard/Header";
import { Sidebar } from "../components/dashboard/Sidebar";
import { ToastProvider } from "../components/Toast";

export const Route = createFileRoute("/_app")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<ToastProvider>
			<div className="flex">
				<Sidebar />
				<main className="flex-1 min-w-0 pb-20 lg:pb-0">
					<Header />
					<Outlet />
				</main>
			</div>
		</ToastProvider>
	);
}
