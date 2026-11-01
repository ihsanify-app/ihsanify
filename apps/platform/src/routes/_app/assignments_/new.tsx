import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuestionSetForm } from "../../../components/assignments/QuestionSetForm";

export const Route = createFileRoute("/_app/assignments_/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	return (
		<QuestionSetForm
			mode="create"
			cancelHref="/assignments"
			onSaved={() => navigate({ to: "/assignments" })}
		/>
	);
}
