import { createFileRoute } from "@tanstack/react-router";
import { WeeklySchedule } from "../../components/dashboard/WeeklySchedule";

export const Route = createFileRoute("/_app/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	return <WeeklySchedule />;
}
