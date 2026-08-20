import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { mockUser } from "../../lib/mockAuth";

const TABS = [
	{
		key: "sessions",
		label: "Sessions",
		to: "/groups/$groupId/sessions",
		adminOnly: false,
	},
	{
		key: "reports",
		label: "Reports",
		to: "/groups/$groupId/reports",
		adminOnly: false,
	},
	{
		key: "assignments",
		label: "Assignments",
		to: "/groups/$groupId/assignments",
		adminOnly: false,
	},
] as const;

export function GroupTabs({
	groupId,
	active,
}: {
	groupId: string;
	active: "sessions" | "reports" | "assignments";
}) {
	return (
		<div className="flex items-center gap-3 mb-6">
			<Link
				to="/groups"
				className="text-stone-500 hover:text-green-700 transition-colors"
			>
				<ArrowLeft size={20} />
			</Link>
			<div className="flex gap-1 border-b border-stone-200 flex-1">
				{TABS.filter((tab) => !tab.adminOnly || mockUser.role === "admin").map(
					(tab) => (
						<Link
							key={tab.key}
							to={tab.to}
							params={{ groupId }}
							className={
								active === tab.key
									? "px-4 py-2 text-sm font-semibold text-green-700 border-b-2 border-green-600 -mb-px"
									: "px-4 py-2 text-sm font-medium text-stone-500 hover:text-green-700 transition-colors"
							}
						>
							{tab.label}
						</Link>
					),
				)}
			</div>
		</div>
	);
}
