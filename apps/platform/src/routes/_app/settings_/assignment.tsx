import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SettingsTabs } from "../../../components/dashboard/SettingsTabs";
import { apiFetch } from "../../../lib/apiClient";
import { authUser } from "../../../lib/auth";

export const Route = createFileRoute("/_app/settings_/assignment")({
	component: RouteComponent,
});

type ApiLevel = "beginner" | "intermediate" | "advanced";

type LevelRow = {
	studentId: string;
	studentName: string;
	subjectId: string | null;
	subjectName: string | null;
	level: ApiLevel | null;
};

function RouteComponent() {
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [rows, setRows] = useState<LevelRow[]>([]);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		if (authUser.role !== "admin") {
			setLoadState("unauthorized");
			return;
		}
		apiFetch("/student-subject-levels").then(({ status, body }) => {
			if (status === 401 || status === 403) {
				setLoadState("unauthorized");
				return;
			}
			setRows(body?.data ?? []);
			setLoadState("ready");
		});
	}, []);

	async function handleLevelChange(
		studentId: string,
		subjectId: string,
		level: ApiLevel | "",
	) {
		const { body } = await apiFetch(
			`/students/${studentId}/subject-levels/${subjectId}`,
			{
				method: "PUT",
				body: JSON.stringify({ level: level || null }),
			},
		);
		if (body?.success) {
			setRows((prev) =>
				prev.map((r) =>
					r.studentId === studentId && r.subjectId === subjectId
						? { ...r, level: level || null }
						: r,
				),
			);
		} else {
			setErrorMessage(body?.message ?? "Could not update level.");
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

	// Group consecutive rows by student so the name cell can span every
	// subject row that belongs to it, like a simple roster table.
	const studentIdOrder: string[] = [];
	const rowsByStudent = new Map<string, LevelRow[]>();
	for (const row of rows) {
		if (!rowsByStudent.has(row.studentId)) {
			studentIdOrder.push(row.studentId);
			rowsByStudent.set(row.studentId, []);
		}
		rowsByStudent.get(row.studentId)?.push(row);
	}

	return (
		<section className="m-3 sm:m-10">
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				Settings
			</h1>
			<SettingsTabs active="assignment" />

			<p className="text-stone-500 text-sm mb-6">
				Set each student's difficulty level per subject — this controls which
				Assignment question sets they can see.
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
									<th className="px-4 py-3 text-left">Student</th>
									<th className="px-4 py-3 text-left">Subject</th>
									<th className="px-4 py-3 text-left">Level</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{studentIdOrder.length === 0 && (
									<tr>
										<td
											colSpan={3}
											className="px-4 py-6 text-center text-stone-400 italic"
										>
											No students yet.
										</td>
									</tr>
								)}
								{studentIdOrder.map((studentId) => {
									const studentRows = rowsByStudent.get(studentId) ?? [];
									return studentRows.map((row, i) => (
										<tr
											key={`${row.studentId}:${row.subjectId ?? "none"}`}
											className="hover:bg-green-50"
										>
											{i === 0 && (
												<td
													className="px-4 py-3 align-top font-medium"
													rowSpan={studentRows.length}
												>
													{row.studentName}
												</td>
											)}
											{row.subjectId ? (
												<>
													<td className="px-4 py-3 text-stone-500">
														{row.subjectName}
													</td>
													<td className="px-4 py-3">
														<select
															className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
															value={row.level ?? ""}
															onChange={(e) =>
																handleLevelChange(
																	row.studentId,
																	row.subjectId as string,
																	e.target.value as ApiLevel | "",
																)
															}
														>
															<option value="">— Not set —</option>
															<option value="beginner">Beginner</option>
															<option value="intermediate">Intermediate</option>
															<option value="advanced">Advance</option>
														</select>
													</td>
												</>
											) : (
												<td
													colSpan={2}
													className="px-4 py-3 text-stone-400 italic"
												>
													No current groups
												</td>
											)}
										</tr>
									));
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</section>
	);
}
