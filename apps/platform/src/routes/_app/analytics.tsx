import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";

export const Route = createFileRoute("/_app/analytics")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<section className="max-sm:p-3 sm:p-6">
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-4">
				Web Analytics
			</h1>
			<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-green-100 bg-white p-12 text-center shadow-sm">
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
					<LineChart size={28} />
				</div>
				<p className="font-heading text-lg font-bold text-stone-800">
					Coming Soon
				</p>
				<p className="max-w-sm text-sm text-stone-500">
					Web analytics for the platform is on the roadmap — this menu is a
					placeholder for now.
				</p>
			</div>
		</section>
	);
}
