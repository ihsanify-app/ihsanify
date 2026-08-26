import { Link } from "@tanstack/react-router";
import { Bell, ClipboardList, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { mockUser } from "../../lib/mockAuth";

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [name, setName] = useState(mockUser.name);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

	useEffect(() => {
		apiFetch("/profile").then(({ status, body }) => {
			if (status !== 200) return;
			setName(body?.data?.name ?? mockUser.name);
			setAvatarUrl(body?.data?.avatarUrl ?? null);
		});
	}, []);

	return (
		<header className="flex flex-row justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-green-100">
			<h1 className="font-heading font-bold text-green-800 text-base sm:text-lg">
				Dashboard
			</h1>
			<div className="flex items-center gap-3 sm:gap-6">
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
						<div className="absolute right-0 top-9 z-50 bg-white border border-green-100 shadow-lg py-3 px-2 w-64 max-w-[85vw] rounded-xl">
							<div className="flex items-center gap-2 text-sm text-stone-700 px-2 py-1.5 rounded-lg hover:bg-green-50">
								<ClipboardList size={16} className="text-green-600 shrink-0" />
								New quiz posted
							</div>
							<div className="flex items-center gap-2 text-sm text-stone-700 px-2 py-1.5 rounded-lg hover:bg-green-50">
								<FileText size={16} className="text-green-600 shrink-0" />
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
				<Link
					to="/profile"
					className="flex items-center gap-2 text-stone-700 hover:text-green-700 transition-colors"
				>
					<div className="w-8 h-8 overflow-hidden rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-700 text-xs font-heading font-bold">
						{avatarUrl ? (
							<img
								src={avatarUrl}
								alt={name}
								className="h-full w-full object-cover"
							/>
						) : (
							initials(name)
						)}
					</div>
					<span className="hidden sm:inline text-sm font-medium">{name}</span>
				</Link>
			</div>
		</header>
	);
}
