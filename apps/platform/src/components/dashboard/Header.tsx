export function Header() {
	return (
		<header className="flex flex-row justify-between p-3 bg-green-900 text-white">
			<h1 className="font-bold">Dashboard</h1>
			<div className="flex gap-7">
				<span>🔔</span>
				<span>👤 Admin</span>
			</div>
		</header>
	);
}
