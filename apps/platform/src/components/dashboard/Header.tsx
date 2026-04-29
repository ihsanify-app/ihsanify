import { useState } from "react";

export function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="flex flex-row justify-between p-3 bg-green-900 text-white">
			<h1 className="font-bold">Dashboard</h1>
			<div className="relative flex gap-7">
				<span className="absolute -top-2 right-21 bg-red-500 rounded-full w-4 h-4 items-center flex font-bold justify-center text-xs">
					3
				</span>
				<button
					type="button"
					className="relative cursor-pointer"
					onClick={() => setIsOpen(!isOpen)}
				>
					🔔
				</button>
				{isOpen && (
					<div className="absolute right-1 top-8 z-50 text-white bg-gray-800 py-3 px-2 w-full rounded-lg">
						<div className="text-sm">⚪ Quiz</div>
						<div className="text-sm">⚪ Report</div>
						<button
							type="button"
							className="text-xs text-white hover:bg-amber-50 rounded-lg p-1 hover:text-gray-800 mt-2"
						>
							Mark All as Read
						</button>
					</div>
				)}
				<span>👤 Admin</span>
			</div>
		</header>
	);
}
