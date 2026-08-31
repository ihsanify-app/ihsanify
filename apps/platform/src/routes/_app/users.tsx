import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";

export const Route = createFileRoute("/_app/users")({
	component: RouteComponent,
});

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

type AppUser = {
	userId: string;
	name: string;
	email: string;
	role: "teacher" | "student";
	gender: "male" | "female" | null;
	subjectIds: { subjectId: string; subjectName: string }[];
	isActive: boolean;
	avatarUrl: string | null;
};

function RouteComponent() {
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [users, setUsers] = useState<AppUser[]>([]);

	useEffect(() => {
		apiFetch("/users").then(({ status, body }) => {
			if (status === 401 || status === 403) {
				setLoadState("unauthorized");
				return;
			}
			setUsers(body?.data ?? []);
			setLoadState("ready");
		});
	}, []);

	if (loadState === "unauthorized") {
		return (
			<section className="m-10 text-center text-stone-500">
				<p className="mb-3">
					You need to be logged in as an admin to view this page.
				</p>
				<Link to="/login" className="text-green-700 font-semibold underline">
					Go to login
				</Link>
			</section>
		);
	}

	return (
		<section className="m-3 sm:m-10">
			<div>
				<div className="mt-3 border border-green-100 min-h-screen rounded-2xl overflow-hidden bg-white shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full min-w-160">
							<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
								<tr>
									<th className="px-4 py-3 text-left">Name</th>
									<th className="px-4 py-3 text-left">Email</th>
									<th className="px-4 py-3 text-left">Role</th>
									<th className="px-4 py-3 text-left">Subject</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{users.map((u) => (
									<tr
										key={u.userId}
										className={u.isActive ? "hover:bg-green-50" : "bg-rose-50"}
									>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												<div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-green-200 bg-green-50 flex items-center justify-center text-green-700 text-xs font-heading font-bold">
													{u.avatarUrl ? (
														<img
															src={u.avatarUrl}
															alt={u.name}
															className="h-full w-full object-cover"
														/>
													) : (
														initials(u.name)
													)}
												</div>
												{u.name}
											</div>
										</td>
										<td className="px-4 py-3">{u.email}</td>
										<td className="px-4 py-3 capitalize">{u.role}</td>
										<td className="px-4 py-3">
											<div className="grid grid-rows gap-1">
												{u.subjectIds.length > 0
													? u.subjectIds.map((s) => (
															<div
																key={s.subjectId}
																className={
																	s.subjectName === "Calistung"
																		? "bg-violet-100 text-violet-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																		: s.subjectName === "Tahsin"
																			? "bg-sky-100 text-sky-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																			: s.subjectName === "Tahfizh"
																				? "bg-green-100 text-green-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																				: s.subjectName === "Bahasa Arab"
																					? "bg-rose-100 text-rose-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																					: s.subjectName === "Bahasa Inggris"
																						? "bg-amber-100 text-amber-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																						: "bg-stone-100 text-stone-700 w-fit px-2 py-1 rounded-full text-xs font-medium"
																}
															>
																{s.subjectName}
															</div>
														))
													: "-"}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</section>
	);
}
