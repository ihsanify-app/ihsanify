import { Link } from "@tanstack/react-router";
import {
	Bell,
	ClipboardList,
	FileText,
	Users as UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { authUser } from "../../lib/auth";

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

type NotificationType = "report" | "assignment" | "group_assignment";

const NOTIFICATION_ICON: Record<NotificationType, typeof Bell> = {
	report: FileText,
	assignment: ClipboardList,
	group_assignment: UsersIcon,
};

type NotificationItem = {
	notificationId: string;
	type: NotificationType;
	title: string;
	message: string;
	link: string | null;
	read: boolean;
	createdAt: string;
};

export function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [name, setName] = useState(authUser.name);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);

	function loadNotifications() {
		apiFetch("/notifications").then(({ status, body }) => {
			if (status !== 200) return;
			setNotifications(body?.data?.notifications ?? []);
			setUnreadCount(body?.data?.unreadCount ?? 0);
		});
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: loadNotifications is stable per render and only needs to run once on mount
	useEffect(() => {
		apiFetch("/profile").then(({ status, body }) => {
			if (status !== 200) return;
			setName(body?.data?.name ?? authUser.name);
			setAvatarUrl(body?.data?.avatarUrl ?? null);
		});
		loadNotifications();
	}, []);

	async function handleNotificationClick(notification: NotificationItem) {
		setIsOpen(false);
		if (!notification.read) {
			setNotifications((prev) =>
				prev.map((n) =>
					n.notificationId === notification.notificationId
						? { ...n, read: true }
						: n,
				),
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
			apiFetch(`/notifications/${notification.notificationId}/read`, {
				method: "POST",
			});
		}
	}

	async function handleMarkAllRead() {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		setUnreadCount(0);
		await apiFetch("/notifications/read-all", { method: "POST" });
	}

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
						{unreadCount > 0 && (
							<span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-bold">
								{unreadCount > 9 ? "9+" : unreadCount}
							</span>
						)}
					</button>
					{isOpen && (
						<div className="absolute right-0 top-9 z-50 bg-white border border-green-100 shadow-lg py-3 px-2 w-72 max-w-[85vw] rounded-xl max-h-96 overflow-y-auto">
							{notifications.length === 0 && (
								<p className="text-xs text-stone-400 italic px-2 py-1.5">
									No notifications yet.
								</p>
							)}
							{notifications.map((n) => {
								const Icon = NOTIFICATION_ICON[n.type] ?? Bell;
								const content = (
									<div
										key={n.notificationId}
										className={`flex items-start gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-green-50 ${
											n.read ? "text-stone-500" : "text-stone-800 font-medium"
										}`}
									>
										<Icon
											size={16}
											className="text-green-600 shrink-0 mt-0.5"
										/>
										<div className="min-w-0">
											<p className="truncate">{n.title}</p>
											<p className="truncate text-xs font-normal text-stone-500">
												{n.message}
											</p>
										</div>
										{!n.read && (
											<span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
										)}
									</div>
								);
								return n.link ? (
									<Link
										key={n.notificationId}
										to={n.link}
										onClick={() => handleNotificationClick(n)}
									>
										{content}
									</Link>
								) : (
									<button
										key={n.notificationId}
										type="button"
										className="w-full text-left cursor-pointer"
										onClick={() => handleNotificationClick(n)}
									>
										{content}
									</button>
								);
							})}
							{notifications.length > 0 && (
								<button
									type="button"
									onClick={handleMarkAllRead}
									className="text-xs text-green-700 hover:bg-green-50 rounded-lg px-2 py-1.5 mt-1 w-full text-left"
								>
									Mark All as Read
								</button>
							)}
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
