import { createFileRoute } from "@tanstack/react-router";
import { SettingsTabs } from "../../../components/dashboard/SettingsTabs";

export const Route = createFileRoute("/_app/settings_/assignment")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<section className="m-10">
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Settings
			</h1>
			<SettingsTabs active="assignment" />
			<p className="text-stone-400 text-sm italic">Not planned yet.</p>
		</section>
	);
}
