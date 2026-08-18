import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";

export const Route = createFileRoute("/_app/settings")({
	component: RouteComponent,
});

type Subject = {
	subjectId: string;
	subjectName: string;
	reportThemeId: string | null;
	reportThemeName: string | null;
};

type ReportTheme = {
	reportThemeId: string;
	name: string;
	primaryColor: string;
};

function RouteComponent() {
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [themes, setThemes] = useState<ReportTheme[]>([]);
	const [errorMessage, setErrorMessage] = useState("");

	const load = useCallback(async () => {
		const [subjectsRes, themesRes] = await Promise.all([
			apiFetch("/subjects"),
			apiFetch("/report-themes"),
		]);
		if (subjectsRes.status === 401 || subjectsRes.status === 403) {
			setLoadState("unauthorized");
			return;
		}
		setSubjects(subjectsRes.body?.data ?? []);
		setThemes(themesRes.body?.data ?? []);
		setLoadState("ready");
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	async function handleThemeChange(subjectId: string, reportThemeId: string) {
		const { body } = await apiFetch(`/subjects/${subjectId}`, {
			method: "PATCH",
			body: JSON.stringify({ reportThemeId: reportThemeId || null }),
		});
		if (body?.success) {
			setSubjects((prev) =>
				prev.map((s) => (s.subjectId === subjectId ? body.data : s)),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update report theme.");
		}
	}

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
		<section className="m-10">
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Settings
			</h1>
			<p className="text-stone-500 text-sm mb-6">
				Assign a report PDF color theme to each subject.
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
					<table className="w-full">
						<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
							<tr>
								<th className="px-4 py-3 text-left">Subject</th>
								<th className="px-4 py-3 text-left">Report Theme</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{subjects.map((s) => (
								<tr key={s.subjectId} className="hover:bg-green-50">
									<td className="px-4 py-3">{s.subjectName}</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<span
												className="h-4 w-4 shrink-0 rounded-full border border-stone-300"
												style={{
													backgroundColor:
														themes.find(
															(t) => t.reportThemeId === s.reportThemeId,
														)?.primaryColor ?? "transparent",
												}}
											/>
											<select
												className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
												value={s.reportThemeId ?? ""}
												onChange={(e) =>
													handleThemeChange(s.subjectId, e.target.value)
												}
											>
												<option value="">No theme (default)</option>
												{themes.map((t) => (
													<option key={t.reportThemeId} value={t.reportThemeId}>
														{t.name}
													</option>
												))}
											</select>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
