import { Link, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	BookOpen,
	ClipboardList,
	LayoutDashboard,
	Settings,
	Sprout,
	User,
	Users,
} from "lucide-react";

const navItems = [
	{ id: 1, icon: LayoutDashboard, title: "Dashboard", path: "/dashboard" },
	{ id: 2, icon: BookOpen, title: "Groups", path: "/dashboard/groups" },
	{
		id: 3,
		icon: ClipboardList,
		title: "Assignments",
		path: "/dashboard/assignments",
	},
	{
		id: 4,
		icon: BarChart3,
		title: "Reports",
		path: "/dashboard/reports",
	},
	{
		id: 5,
		icon: User,
		title: "Profile",
		path: "/dashboard/profile",
	},
	{
		id: 6,
		icon: Users,
		title: "Users",
		path: "/dashboard/users",
	},
	{
		id: 7,
		icon: Settings,
		title: "Settings",
		path: "/settings",
	},
];

export function Sidebar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<aside className="flex flex-col bg-green-900 text-white items-center min-h-screen w-24 py-4 gap-2">
			<Sprout size={28} className="text-green-300 mb-4" />
			{navItems.map((n) => {
				const isActive = pathname === n.path;
				return (
					<Link
						to={n.path}
						key={n.id}
						className={`flex flex-col items-center justify-center gap-1.5 rounded-xl w-20 py-3 transition-colors ${
							isActive
								? "bg-green-700 text-white"
								: "text-green-200 hover:bg-green-800 hover:text-white"
						}`}
					>
						<n.icon size={20} />
						<span className="text-xs">{n.title}</span>
					</Link>
				);
			})}
		</aside>
	);
}
