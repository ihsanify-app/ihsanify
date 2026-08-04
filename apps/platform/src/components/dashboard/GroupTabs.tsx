import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const TABS = [
	{
		key: "sessions",
		label: "Sessions",
		to: "/dashboard/groups/$groupId/sessions",
	},
	{
		key: "reports",
		label: "Reports",
		to: "/dashboard/groups/$groupId/reports",
	},
	{ key: "tests", label: "Tests", to: "/dashboard/groups/$groupId/tests" },
	{
		key: "invoices",
		label: "Invoices",
		to: "/dashboard/groups/$groupId/invoices",
	},
] as const;

export function GroupTabs({
	groupId,
	active,
}: {
	groupId: string;
	active: "sessions" | "reports" | "tests" | "invoices";
}) {
	return (
		<div className="flex items-center gap-3 mb-6">
			<Link
				to="/dashboard/groups"
				className="text-stone-500 hover:text-green-700 transition-colors"
			>
				<ArrowLeft size={20} />
			</Link>
			<div className="flex gap-1 border-b border-stone-200 flex-1">
				{TABS.map((tab) => (
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
				))}
			</div>
		</div>
	);
}
