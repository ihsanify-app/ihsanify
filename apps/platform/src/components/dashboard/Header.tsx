import { Bell, ClipboardList, FileText, User } from "lucide-react";
import { useState } from "react";

export function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="flex flex-row justify-between items-center px-6 py-4 bg-white border-b border-green-100">
			<h1 className="font-heading font-bold text-green-800 text-lg">
				Dashboard
			</h1>
			<div className="flex items-center gap-6">
				<div className="relative">
					<button
						type="button"
						className="relative cursor-pointer text-stone-500 hover:text-green-700 transition-colors"
						onClick={() => setIsOpen(!isOpen)}
					>
						<Bell size={22} />
						<span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
							3
						</span>
					</button>
					{isOpen && (
						<div className="absolute right-0 top-9 z-50 bg-white border border-green-100 shadow-lg py-3 px-2 w-56 rounded-xl">
							<div className="flex items-center gap-2 text-sm text-stone-700 px-2 py-1.5 rounded-lg hover:bg-green-50">
								<ClipboardList size={16} className="text-green-600" />
								New quiz posted
							</div>
							<div className="flex items-center gap-2 text-sm text-stone-700 px-2 py-1.5 rounded-lg hover:bg-green-50">
								<FileText size={16} className="text-green-600" />
								Report updated
							</div>
							<button
								type="button"
								className="text-xs text-green-700 hover:bg-green-50 rounded-lg px-2 py-1.5 mt-1 w-full text-left"
							>
								Mark All as Read
							</button>
						</div>
					)}
				</div>
				<div className="flex items-center gap-2 text-stone-700">
					<div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
						<User size={16} className="text-green-700" />
					</div>
					<span className="text-sm font-medium">Admin</span>
				</div>
			</div>
		</header>
	);
}
