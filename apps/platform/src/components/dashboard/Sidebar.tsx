import { Link } from "@tanstack/react-router";

const navItems = [
	{ id: 1, icon: "📊", title: "Dashboard", path: "/dashboard" },
	{ id: 2, icon: "📚", title: "Classes", path: "/dashboard/classes" },
	{
		id: 3,
		icon: "📝",
		title: "Assignments",
		path: "/dashboard/assignments",
	},
	{
		id: 4,
		icon: "📈",
		title: "Reports",
		path: "/dashboard/reports",
	},
	{
		id: 5,
		icon: "👤",
		title: "Profile",
		path: "/profile",
	},
	{
		id: 6,
		icon: "🗃️",
		title: "Resources",
		path: "/resources",
	},
	{
		id: 7,
		icon: "⚙️",
		title: "Settings",
		path: "/settings",
	},
];

export function Sidebar() {
	return (
		<section className="flex flex-col bg-green-900 text-white items-center min-h-screen p-3 gap-3">
			<span className="text-3xl">🌱</span>
			{navItems.map((n) => (
				<Link
					to={n.path}
					key={n.id}
					className="flex flex-col items-center justify-center gap-2 hover:bg-green-700 rounded-lg w-full h-full p-1"
				>
					<div className="text-2xl">{n.icon}</div>
					<h2 className="text-sm">{n.title}</h2>
				</Link>
			))}
		</section>
	);
}
