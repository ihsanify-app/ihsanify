import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SettingsTabs } from "../../../components/dashboard/SettingsTabs";
import { apiFetch } from "../../../lib/apiClient";

export const Route = createFileRoute("/_app/settings_/group")({
	component: RouteComponent,
});

type GroupRow = {
	groupId: string;
	groupName: string;
	subjectName: string | null;
	cardColor: string | null;
	groupType: "group" | "private" | "semi-private";
};

const DEFAULT_CARD_COLOR = "#15803d";

function RouteComponent() {
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [groups, setGroups] = useState<GroupRow[]>([]);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		apiFetch("/groups").then(({ status, body }) => {
			if (status === 401 || status === 403) {
				setLoadState("unauthorized");
				return;
			}
			setGroups(body?.data ?? []);
			setLoadState("ready");
		});
	}, []);

	async function handleCardColorChange(groupId: string, cardColor: string) {
		const { body } = await apiFetch(`/groups/${groupId}`, {
			method: "PATCH",
			body: JSON.stringify({ cardColor }),
		});
		if (body?.success) {
			setGroups((prev) =>
				prev.map((g) => (g.groupId === groupId ? body.data : g)),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update card color.");
		}
	}

	async function handleGroupTypeChange(
		groupId: string,
		groupType: "group" | "private" | "semi-private",
	) {
		const { body } = await apiFetch(`/groups/${groupId}`, {
			method: "PATCH",
			body: JSON.stringify({ groupType }),
		});
		if (body?.success) {
			setGroups((prev) =>
				prev.map((g) => (g.groupId === groupId ? body.data : g)),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update group type.");
		}
	}

	if (loadState === "unauthorized") {
		return (
			<section className="m-3 sm:m-10 text-center text-stone-500">
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
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Settings
			</h1>
			<SettingsTabs active="group" />

			<p className="text-stone-500 text-sm mb-6">
				Card color and type shown on each group's card, and reflected on its
				report and invoice PDFs.
			</p>

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			{loadState === "loading" ? (
				<p className="text-stone-400">Loading…</p>
			) : (
				<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm max-w-2xl">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
								<tr>
									<th className="px-4 py-3 text-left">Group</th>
									<th className="px-4 py-3 text-left">Subject</th>
									<th className="px-4 py-3 text-left">Card Color</th>
									<th className="px-4 py-3 text-left">Type</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{groups.length === 0 && (
									<tr>
										<td
											colSpan={4}
											className="px-4 py-6 text-center text-stone-400 italic"
										>
											No groups yet.
										</td>
									</tr>
								)}
								{groups.map((g) => (
									<tr key={g.groupId} className="hover:bg-green-50">
										<td className="px-4 py-3">{g.groupName}</td>
										<td className="px-4 py-3 text-stone-500">
											{g.subjectName ?? "-"}
										</td>
										<td className="px-4 py-3">
											<input
												type="color"
												className="h-9 w-14 cursor-pointer border border-stone-300 rounded-lg p-1"
												value={g.cardColor ?? DEFAULT_CARD_COLOR}
												onChange={(e) =>
													handleCardColorChange(g.groupId, e.target.value)
												}
											/>
										</td>
										<td className="px-4 py-3">
											<select
												className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
												value={g.groupType}
												onChange={(e) =>
													handleGroupTypeChange(
														g.groupId,
														e.target.value as
															| "group"
															| "private"
															| "semi-private",
													)
												}
											>
												<option value="group">Group</option>
												<option value="private">Private</option>
												<option value="semi-private">Semi-Private</option>
											</select>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</section>
	);
}
