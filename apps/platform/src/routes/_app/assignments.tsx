import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/assignments")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/Assignments"!</div>;
}
