import {
	createFileRoute,
	Link,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { Ban, CheckCircle2, Pencil, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/apiClient";

export const Route = createFileRoute("/_app/assignments_/$questionSetId")({
	component: RouteComponent,
});

type ApiLevel = "beginner" | "intermediate" | "advanced";

type MyAttempt = {
	score: number;
	totalQuestions: number;
	submittedAt: string;
} | null;

type AttemptSummary = {
	studentId: string;
	studentName: string;
	score: number;
	totalQuestions: number;
	submittedAt: string;
};

type QuestionSetDetail = {
	questionSetId: string;
	title: string;
	description: string | null;
	subjectName: string;
	teacherName: string;
	level: ApiLevel;
	canDelete: boolean;
	// Present only when the viewer is an ADMIN or this set's owning TEACHER —
	// true only while nobody has attempted it yet.
	canEdit?: boolean;
	questions: {
		questionId: string;
		text: string;
		options: {
			optionId: string;
			text: string;
			isCorrect?: boolean;
			isSelected?: boolean;
		}[];
	}[];
	// Present (possibly null) only when the viewer is a STUDENT.
	myAttempt?: MyAttempt;
	// Present only when the viewer is an ADMIN or this set's owning TEACHER.
	attempts?: AttemptSummary[];
};

const LEVEL_LABEL: Record<ApiLevel, string> = {
	beginner: "Beginner",
	intermediate: "Intermediate",
	advanced: "Advance",
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
	const { questionSetId } = useParams({
		from: "/_app/assignments_/$questionSetId",
	});
	const navigate = useNavigate();
	const [loadState, setLoadState] = useState<"loading" | "ready" | "denied">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [questionSet, setQuestionSet] = useState<QuestionSetDetail | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const [selectedAnswers, setSelectedAnswers] = useState<
		Record<string, string>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const load = useCallback(async () => {
		const { status, body } = await apiFetch(`/question-sets/${questionSetId}`);
		if (status === 401 || status === 403 || status === 404) {
			setLoadState("denied");
			setErrorMessage(body?.message ?? "Unable to load this question set.");
			return;
		}
		setQuestionSet(body?.data ?? null);
		setLoadState("ready");
	}, [questionSetId]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleDelete() {
		const { body } = await apiFetch(`/question-sets/${questionSetId}`, {
			method: "DELETE",
		});
		if (body?.success) {
			navigate({ to: "/assignments" });
		} else {
			setErrorMessage(body?.message ?? "Could not delete question set.");
			setIsDeleting(false);
		}
	}

	async function handleSubmitAttempt() {
		if (!questionSet) return;
		const answers = questionSet.questions.map((q) => ({
			questionId: q.questionId,
			optionId: selectedAnswers[q.questionId],
		}));
		if (answers.some((a) => !a.optionId)) {
			setErrorMessage("Answer every question before submitting.");
			return;
		}
		setIsSubmitting(true);
		const { body } = await apiFetch(`/question-sets/${questionSetId}/attempt`, {
			method: "POST",
			body: JSON.stringify({ answers }),
		});
		setIsSubmitting(false);
		if (body?.success) {
			setErrorMessage("");
			await load();
		} else {
			setErrorMessage(body?.message ?? "Could not submit your answers.");
		}
	}

	if (loadState === "denied") {
		return (
			<section className="max-sm:p-3 sm:p-6 text-center text-stone-500">
				<p className="mb-3">{errorMessage}</p>
				<Link
					to="/assignments"
					className="text-green-700 font-semibold underline"
				>
					Back to assignments
				</Link>
			</section>
		);
	}

	if (loadState === "loading" || !questionSet) {
		return (
			<section className="max-sm:p-3 sm:p-6">
				<p className="text-stone-400">Loading…</p>
			</section>
		);
	}

	// Only a STUDENT who hasn't submitted yet sees an interactive quiz form —
	// everyone else (admin/teacher, or a student reviewing their own
	// submitted attempt) sees the read-only list below.
	const isTakingQuiz = questionSet.myAttempt === null;

	return (
		<section className="max-sm:p-3 sm:p-6 max-w-3xl">
			{isDeleting && (
				<ConfirmDeleteModal
					onConfirm={handleDelete}
					onClose={() => setIsDeleting(false)}
				/>
			)}

			<Link
				to="/assignments"
				className="text-sm text-green-700 font-semibold hover:underline mb-3 inline-block"
			>
				← Back to assignments
			</Link>

			<div className="flex items-start justify-between gap-3 mb-1">
				<h1 className="font-heading text-2xl font-bold text-green-800">
					{questionSet.title}
				</h1>
				<div className="flex items-center gap-4 shrink-0">
					{questionSet.canEdit && (
						<Link
							to="/assignments/$questionSetId/edit"
							params={{ questionSetId }}
							className="flex items-center gap-2 text-green-700 hover:text-green-800"
						>
							<Pencil size={16} />
							Edit
						</Link>
					)}
					{questionSet.canDelete && (
						<button
							type="button"
							className="flex items-center gap-2 text-rose-500 hover:text-rose-600 cursor-pointer"
							onClick={() => setIsDeleting(true)}
						>
							<Ban size={16} />
							Delete
						</button>
					)}
				</div>
			</div>

			<div className="flex flex-wrap gap-2 mb-4 text-sm text-stone-500">
				<span>{questionSet.subjectName}</span>
				<span>·</span>
				<span>{questionSet.teacherName}</span>
				<span>·</span>
				<span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
					{LEVEL_LABEL[questionSet.level]}
				</span>
			</div>

			{questionSet.description && (
				<p className="text-stone-600 mb-6">{questionSet.description}</p>
			)}

			{questionSet.myAttempt && (
				<div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm mb-6">
					<CheckCircle2 size={18} className="shrink-0" />
					<span>
						You scored {questionSet.myAttempt.score}/
						{questionSet.myAttempt.totalQuestions} — submitted{" "}
						{new Date(questionSet.myAttempt.submittedAt).toLocaleString()}.
					</span>
				</div>
			)}

			{isTakingQuiz && (
				<div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm mb-6">
					<TriangleAlert size={18} className="shrink-0 mt-0.5" />
					<p>
						You can only submit this once — double check your answers before
						saving.
					</p>
				</div>
			)}

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			<div className="flex flex-col gap-4">
				{questionSet.questions.map((q, qIndex) => (
					<div
						key={q.questionId}
						className="bg-white border border-green-100 rounded-2xl shadow-sm p-5"
					>
						<p className="font-semibold text-stone-800 mb-3">
							{qIndex + 1}. {q.text}
						</p>
						<div className="grid sm:grid-cols-2 gap-2">
							{isTakingQuiz
								? q.options.map((o, oIndex) => (
										<label
											key={o.optionId}
											className="flex items-center gap-2 border border-stone-300 rounded-xl p-2 text-sm cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-50"
										>
											<input
												type="radio"
												name={`question-${q.questionId}`}
												checked={selectedAnswers[q.questionId] === o.optionId}
												onChange={() =>
													setSelectedAnswers((prev) => ({
														...prev,
														[q.questionId]: o.optionId,
													}))
												}
											/>
											<span className="text-stone-400 font-semibold">
												{String.fromCharCode(65 + oIndex)}
											</span>
											<span className="flex-1">{o.text}</span>
										</label>
									))
								: q.options.map((o, oIndex) => (
										<div
											key={o.optionId}
											className={
												o.isCorrect
													? "flex items-center gap-2 border border-green-500 bg-green-50 rounded-xl p-2 text-sm"
													: o.isSelected
														? "flex items-center gap-2 border border-rose-400 bg-rose-50 rounded-xl p-2 text-sm"
														: "flex items-center gap-2 border border-stone-200 rounded-xl p-2 text-sm"
											}
										>
											<span className="text-stone-400 font-semibold">
												{String.fromCharCode(65 + oIndex)}
											</span>
											<span className="flex-1">{o.text}</span>
											{o.isSelected && (
												<span className="text-xs font-semibold text-stone-500 shrink-0">
													Your answer
												</span>
											)}
											{o.isCorrect && (
												<CheckCircle2
													size={16}
													className="text-green-600 shrink-0"
												/>
											)}
										</div>
									))}
						</div>
					</div>
				))}
			</div>

			{isTakingQuiz && (
				<div className="flex justify-end mt-6">
					<button
						type="button"
						disabled={isSubmitting}
						onClick={handleSubmitAttempt}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:opacity-50"
					>
						{isSubmitting ? "Submitting…" : "Submit Answers"}
					</button>
				</div>
			)}

			{questionSet.attempts && (
				<div className="mt-8">
					<h2 className="font-heading text-lg font-bold text-green-800 mb-3">
						Results
					</h2>
					{questionSet.attempts.length === 0 ? (
						<p className="text-stone-400 italic text-sm">
							No student has submitted this yet.
						</p>
					) : (
						<div className="overflow-x-auto">
							<div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm">
								<table className="w-full">
									<thead className="bg-green-700 text-white uppercase text-xs tracking-wide">
										<tr>
											<th className="px-4 py-3 text-left">Student</th>
											<th className="px-4 py-3 text-left">Score</th>
											<th className="px-4 py-3 text-left">Submitted</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-stone-100">
										{questionSet.attempts.map((a) => (
											<tr key={a.studentId} className="hover:bg-green-50">
												<td className="px-4 py-3">{a.studentName}</td>
												<td className="px-4 py-3">
													{a.score}/{a.totalQuestions}
												</td>
												<td className="px-4 py-3 text-stone-500">
													{new Date(a.submittedAt).toLocaleString()}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			)}
		</section>
	);
}
