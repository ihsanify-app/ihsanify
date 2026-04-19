export function Navbar() {
	return (
		<nav className="flex justify-between items-center px-6 py-4 shadow-sm bg-gray-50 ">
			<span className="text-green-700 font-bold text-xl">Ihsanify</span>
			<button
				type="button"
				className="bg-green-600 text-white px-8 py-3 rounded-full"
			>
				Login
			</button>
		</nav>
	);
}
