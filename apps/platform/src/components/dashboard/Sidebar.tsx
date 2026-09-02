import { Link, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	ClipboardList,
	GraduationCap,
	LayoutDashboard,
	LineChart,
	Receipt,
	Settings,
	Sprout,
	User,
	Users,
	Wallet,
} from "lucide-react";
import { mockUser } from "../../lib/mockAuth";

const navItems = [
	{ id: 1, icon: LayoutDashboard, title: "Dashboard", path: "/dashboard" },
	{ id: 2, icon: GraduationCap, title: "Groups", path: "/groups" },
	{
		id: 3,
		icon: ClipboardList,
		title: "Assignments",
		path: "/assignments",
	},
	{
		id: 4,
		icon: BarChart3,
		title: "Reports",
		path: "/reports",
	},
	{
		id: 8,
		icon: Receipt,
		title: "Invoices",
		path: "/invoices",
		adminOnly: true,
	},
	{
		id: 9,
		icon: Wallet,
		title: "Payroll",
		path: "/payroll",
		adminOnly: true,
	},
	{
		id: 10,
		icon: LineChart,
		title: "Analytics",
		path: "/analytics",
		adminOnly: true,
	},
	{
		id: 5,
		icon: User,
		title: "Profile",
		path: "/profile",
	},
	{
		id: 6,
		icon: Users,
		title: "Users",
		path: "/users",
	},
	{
		id: 7,
		icon: Settings,
		title: "Settings",
		path: "/settings",
		adminOnly: true,
	},
];

export function Sidebar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const visibleNavItems = navItems.filter(
		(n) => !n.adminOnly || mockUser.role === "admin",
	);

	return (
		<>
			<aside className="hidden lg:flex flex-col bg-green-900 text-white items-center min-h-screen w-24 py-4 gap-2">
				<Sprout size={28} className="text-green-300 mb-4" />
				{visibleNavItems.map((n) => {
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
				<span className="mt-auto text-[10px] text-green-400/70">
					v{__APP_VERSION__}
				</span>
			</aside>

			<nav className="hidden max-lg:flex fixed inset-x-0 bottom-0 z-40 items-center justify-around bg-green-900 px-1 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
				{visibleNavItems.map((n) => {
					const isActive = pathname === n.path;
					return (
						<Link
							to={n.path}
							key={n.id}
							aria-label={n.title}
							className={`flex items-center justify-center rounded-full p-2.5 transition-colors ${
								isActive
									? "bg-green-700 text-white"
									: "text-green-300 active:bg-green-800"
							}`}
						>
							<n.icon size={20} />
						</Link>
					);
				})}
			</nav>
		</>
	);
}
