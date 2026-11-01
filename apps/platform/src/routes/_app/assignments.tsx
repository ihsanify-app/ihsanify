import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, ClipboardList, GraduationCap, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { authUser } from "../../lib/auth";

export const Route = createFileRoute("/_app/assignments")({
	component: RouteComponent,
});

type ApiLevel = "beginner" | "intermediate" | "advanced";

type QuestionSetRow = {
	questionSetId: string;
	title: string;
	description: string | null;
	subjectName: string;
	teacherName: string;
	level: ApiLevel;
	questionCount: number;
	canDelete: boolean;
	// Present (even as null) only when the viewer is a STUDENT.
	myAttempt?: { score: number; submittedAt: string } | null;
};

const LEVEL_LABEL: Record<ApiLevel, string> = {
	beginner: "Beginner",
	intermediate: "Intermediate",
	advanced: "Advance",
};

// Color-coded by difficulty so a student can scan the grid by eye, not just
// by reading the label.
const LEVEL_BADGE_CLASS: Record<ApiLevel, string> = {
	beginner: "bg-green-100 text-green-700",
	intermediate: "bg-amber-100 text-amber-700",
	advanced: "bg-rose-100 text-rose-700",
};

function ConfirmDeleteModal({
	onConfirm,
	onClose,
}: {
	onConfirm: () => void;
	onClose: () => void;
}) {
	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 bg-stone-900/50 flex items-center justify-center font-bold z-50 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-stone-800">
					Delete this question set? This can't be undone.
				</h2>
				<div className="flex flex-col gap-2">
					<button
						type="button"
						className="cursor-pointer rounded-xl bg-rose-600 text-white p-2 hover:bg-rose-700 transition-colors"
						onClick={onConfirm}
					>
						Confirm
					</button>
					<button
						type="button"
						className="cursor-pointer rounded-xl border border-stone-300 text-stone-600 p-2 hover:bg-stone-50 transition-colors"
						onClick={onClose}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const [loadState, setLoadState] = useState<"loading" | "ready">("loading");
	const [questionSets, setQuestionSets] = useState<QuestionSetRow[]>([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const canCreate = authUser.role === "admin" || authUser.role === "teacher";
	const isStudent = authUser.role === "student";

	const loadQuestionSets = useCallback(async () => {
		const { body } = await apiFetch("/question-sets");
		setQuestionSets(body?.data ?? []);
		setLoadState("ready");
	}, []);

	useEffect(() => {
		loadQuestionSets();
	}, [loadQuestionSets]);

	async function handleDelete(questionSetId: string) {
		const { body } = await apiFetch(`/question-sets/${questionSetId}`, {
			method: "DELETE",
		});
		if (body?.success) {
			setQuestionSets((prev) =>
				prev.filter((q) => q.questionSetId !== questionSetId),
			);
			setDeletingId(null);
		} else {
			setErrorMessage(body?.message ?? "Could not delete question set.");
		}
	}

	return (
		<section className="max-sm:p-3 sm:p-6">
			{deletingId && (
				<ConfirmDeleteModal
					onConfirm={() => handleDelete(deletingId)}
					onClose={() => setDeletingId(null)}
				/>
			)}

			<div className="flex items-center justify-between gap-3 mb-4">
				<h1 className="font-heading text-2xl font-bold text-green-800">
					Assignments
				</h1>
				{canCreate && (
					<Link
						to="/assignments/new"
						className="flex font-semibold items-center gap-2 cursor-pointer text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl px-4 py-2"
					>
						<PlusCircle size={18} />
						Create Assignment
					</Link>
				)}
			</div>

			<p className="text-stone-500 text-sm mb-6">
				Question-bank sets, visible to students by subject, level, and current
				teacher. Managing a single group's homework log instead? Use that
				group's own Assignments tab.
			</p>

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			{loadState === "loading" ? (
				<p className="text-stone-400">Loading…</p>
			) : questionSets.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-green-100 bg-white p-12 text-center shadow-sm">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
						<ClipboardList size={28} />
					</div>
					<p className="font-heading text-lg font-bold text-stone-800">
						No question sets yet
					</p>
					<p className="max-w-sm text-sm text-stone-500">
						{canCreate
							? "Create your first question set to get started."
							: "Nothing has been made visible to you yet."}
					</p>
				</div>
			) : isStudent ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{questionSets.map((q) => (
						<div
							key={q.questionSetId}
							className="flex flex-col gap-3 rounded-2xl border border-green-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
									<ClipboardList size={20} />
								</div>
								<span
									className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${LEVEL_BADGE_CLASS[q.level]}`}
								>
									{LEVEL_LABEL[q.level]}
								</span>
							</div>

							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
									{q.subjectName}
								</p>
								<Link
									to="/assignments/$questionSetId"
									params={{ questionSetId: q.questionSetId }}
									className="font-heading text-lg font-bold text-stone-800 hover:text-green-700"
								>
									{q.title}
								</Link>
							</div>

							<div className="flex items-center gap-2 text-sm text-stone-500">
								<GraduationCap size={14} className="shrink-0" />
								<span>{q.teacherName}</span>
								<span>·</span>
								<span>
									{q.questionCount}{" "}
									{q.questionCount === 1 ? "question" : "questions"}
								</span>
							</div>

							<div className="mt-auto flex items-center justify-between gap-2 pt-2">
								{q.myAttempt ? (
									<span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
										Done — {q.myAttempt.score}/{q.questionCount}
									</span>
								) : (
									<span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
										Not Done
									</span>
								)}
								<Link
									to="/assignments/$questionSetId"
									params={{ questionSetId: q.questionSetId }}
									className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
								>
									{q.myAttempt ? "Review" : "Start"}
								</Link>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="overflow-x-auto">
					<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm">
						<table className="w-full">
							<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
								<tr>
									<th className="px-4 py-3 text-left">Title</th>
									<th className="px-4 py-3 text-left">Subject</th>
									<th className="px-4 py-3 text-left">Teacher</th>
									<th className="px-4 py-3 text-left">Level</th>
									<th className="px-4 py-3 text-left">Questions</th>
									{canCreate && <th className="px-4 py-3 text-left">Action</th>}
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{questionSets.map((q) => (
									<tr key={q.questionSetId} className="hover:bg-green-50">
										<td className="px-4 py-3">
											<Link
												to="/assignments/$questionSetId"
												params={{ questionSetId: q.questionSetId }}
												className="text-green-700 font-semibold hover:underline"
											>
												{q.title}
											</Link>
										</td>
										<td className="px-4 py-3 text-stone-600">
											{q.subjectName}
										</td>
										<td className="px-4 py-3 text-stone-600">
											{q.teacherName}
										</td>
										<td className="px-4 py-3">
											<span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
												{LEVEL_LABEL[q.level]}
											</span>
										</td>
										<td className="px-4 py-3 text-stone-600">
											{q.questionCount}
										</td>
										{canCreate && (
											<td className="px-4 py-3">
												{q.canDelete && (
													<button
														type="button"
														className="text-rose-500 hover:text-rose-600 cursor-pointer"
														onClick={() => setDeletingId(q.questionSetId)}
													>
														<Ban size={16} />
													</button>
												)}
											</td>
										)}
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
