import { Link } from "@tanstack/react-router";

const TABS = [
	{ key: "report", label: "Report", to: "/settings/report" },
	{ key: "subject", label: "Subject", to: "/settings/subject" },
	{ key: "user", label: "User", to: "/settings/user" },
	{ key: "group", label: "Group", to: "/settings/group" },
	{ key: "invoice", label: "Invoice", to: "/settings/invoice" },
	{ key: "assignment", label: "Assignment", to: "/settings/assignment" },
	{ key: "landing", label: "Landing", to: "/settings/landing" },
] as const;

export type SettingsTabKey = (typeof TABS)[number]["key"];

export function SettingsTabs({ active }: { active: SettingsTabKey }) {
	return (
		<div className="flex gap-1 overflow-x-auto border-b border-stone-200 mb-6">
			{TABS.map((tab) => (
				<Link
					key={tab.key}
					to={tab.to}
					className={
						active === tab.key
							? "px-4 py-2 text-sm font-semibold text-green-700 border-b-2 border-green-600 -mb-px whitespace-nowrap shrink-0"
							: "px-4 py-2 text-sm font-medium text-stone-500 hover:text-green-700 transition-colors whitespace-nowrap shrink-0"
					}
				>
					{tab.label}
				</Link>
			))}
		</div>
	);
}
