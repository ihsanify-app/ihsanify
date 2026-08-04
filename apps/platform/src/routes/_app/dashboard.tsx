import { createFileRoute } from "@tanstack/react-router";
import { AdminView } from "../../components/dashboard/AdminView";
import { StudentView } from "../../components/dashboard/StudentView";
import { TeacherView } from "../../components/dashboard/TeacherView";
import { mockUser } from "../../lib/mockAuth";

export const Route = createFileRoute("/_app/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	if (mockUser.role === "admin") return <AdminView />;
	if (mockUser.role === "teacher") return <TeacherView />;
	return <StudentView />;
}
