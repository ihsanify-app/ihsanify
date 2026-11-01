import { Link } from "@tanstack/react-router";
import { PlusCircle, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { authUser } from "../../lib/auth";

type ApiLevel = "beginner" | "intermediate" | "advanced";

type AuthoringOption = {
	teacherId: string;
	teacherName: string;
	subjectId: string;
	subjectName: string;
};

type DraftOption = { id: string; text: string };
type DraftQuestion = {
	id: string;
	text: string;
	options: DraftOption[];
	correctOptionId: string;
};

export type QuestionSetFormInitialData = {
	title: string;
	description: string | null;
	subjectId: string;
	subjectName: string;
	teacherId: string;
	teacherName: string;
	level: ApiLevel;
	questions: {
		text: string;
		options: { text: string; isCorrect: boolean }[];
	}[];
};

let nextId = 0;
function makeId() {
	nextId += 1;
	return `local-${nextId}`;
}

function makeEmptyQuestion(): DraftQuestion {
	const options = [makeId(), makeId(), makeId(), makeId()].map((id) => ({
		id,
		text: "",
	}));
	return { id: makeId(), text: "", options, correctOptionId: options[0].id };
}

function draftQuestionsFrom(
	initial: QuestionSetFormInitialData["questions"],
): DraftQuestion[] {
	return initial.map((q) => {
		const options = q.options.map((o) => ({
			id: makeId(),
			text: o.text,
			isCorrect: o.isCorrect,
		}));
		const correct = options.find((o) => o.isCorrect) ?? options[0];
		return {
			id: makeId(),
			text: q.text,
			options: options.map(({ id, text }) => ({ id, text })),
			correctOptionId: correct.id,
		};
	});
}

export function QuestionSetForm({
	mode,
	questionSetId,
	initialData,
	onSaved,
	cancelHref,
}: {
	mode: "create" | "edit";
	// Required (together with initialData) when mode === "edit".
	questionSetId?: string;
	initialData?: QuestionSetFormInitialData;
	onSaved: (savedQuestionSetId: string) => void;
	cancelHref: string;
}) {
	const isAdmin = authUser.role === "admin";

	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "unauthorized"
	>("loading");
	const [options, setOptions] = useState<AuthoringOption[]>([]);
	const [teacherId, setTeacherId] = useState(initialData?.teacherId ?? "");
	const [subjectId, setSubjectId] = useState(initialData?.subjectId ?? "");
	const [level, setLevel] = useState<ApiLevel>(
		initialData?.level ?? "beginner",
	);
	const [title, setTitle] = useState(initialData?.title ?? "");
	const [description, setDescription] = useState(
		initialData?.description ?? "",
	);
	const [questions, setQuestions] = useState<DraftQuestion[]>(
		initialData
			? draftQuestionsFrom(initialData.questions)
			: [makeEmptyQuestion()],
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (authUser.role !== "admin" && authUser.role !== "teacher") {
			setLoadState("unauthorized");
			return;
		}
		apiFetch("/question-sets/authoring-options").then(({ status, body }) => {
			if (status === 401 || status === 403) {
				setLoadState("unauthorized");
				return;
			}
			const data: AuthoringOption[] = body?.data ?? [];
			// This set's own (teacher, subject) pair might no longer be "live"
			// (e.g. the group ended since it was created) — keep it selectable
			// anyway so editing never silently drops the current selection.
			if (
				initialData &&
				!data.some(
					(o) =>
						o.teacherId === initialData.teacherId &&
						o.subjectId === initialData.subjectId,
				)
			) {
				data.push({
					teacherId: initialData.teacherId,
					teacherName: initialData.teacherName,
					subjectId: initialData.subjectId,
					subjectName: initialData.subjectName,
				});
			}
			setOptions(data);
			if (!initialData && data.length > 0) {
				setTeacherId(data[0].teacherId);
				setSubjectId(data[0].subjectId);
			}
			setLoadState("ready");
		});
	}, [initialData]);

	const teachers = useMemo(() => {
		const seen = new Map<string, string>();
		for (const o of options) seen.set(o.teacherId, o.teacherName);
		return [...seen.entries()].map(([id, name]) => ({ id, name }));
	}, [options]);

	const subjectsForTeacher = useMemo(
		() => options.filter((o) => o.teacherId === teacherId),
		[options, teacherId],
	);

	function handleTeacherChange(nextTeacherId: string) {
		setTeacherId(nextTeacherId);
		const firstSubject = options.find((o) => o.teacherId === nextTeacherId);
		setSubjectId(firstSubject?.subjectId ?? "");
	}

	function updateQuestion(id: string, patch: Partial<DraftQuestion>) {
		setQuestions((prev) =>
			prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
		);
	}

	function updateOption(questionId: string, optionId: string, text: string) {
		setQuestions((prev) =>
			prev.map((q) =>
				q.id === questionId
					? {
							...q,
							options: q.options.map((o) =>
								o.id === optionId ? { ...o, text } : o,
							),
						}
					: q,
			),
		);
	}

	function addQuestion() {
		setQuestions((prev) => [...prev, makeEmptyQuestion()]);
	}

	function removeQuestion(id: string) {
		setQuestions((prev) =>
			prev.length > 1 ? prev.filter((q) => q.id !== id) : prev,
		);
	}

	function validate(): string | null {
		if (!title.trim()) return "Title is required.";
		if (!teacherId) return "Select a teacher.";
		if (!subjectId) return "Select a subject.";
		if (questions.length === 0) return "Add at least one question.";
		for (const q of questions) {
			if (!q.text.trim()) return "Every question needs text.";
			const texts = q.options.map((o) => o.text.trim().toLowerCase());
			if (texts.some((t) => !t)) {
				return "Every option needs text.";
			}
			if (new Set(texts).size !== texts.length) {
				return "A question's 4 options must be distinct.";
			}
			if (!q.options.some((o) => o.id === q.correctOptionId)) {
				return "Mark exactly one correct option per question.";
			}
		}
		return null;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const validationError = validate();
		if (validationError) {
			setErrorMessage(validationError);
			return;
		}
		setIsSubmitting(true);
		setErrorMessage("");

		const payload = {
			title: title.trim(),
			description: description.trim() || null,
			subjectId,
			...(isAdmin ? { teacherId } : {}),
			level,
			questions: questions.map((q) => ({
				text: q.text.trim(),
				options: q.options.map((o) => ({
					text: o.text.trim(),
					isCorrect: o.id === q.correctOptionId,
				})),
			})),
		};

		const { body } =
			mode === "edit" && questionSetId
				? await apiFetch(`/question-sets/${questionSetId}`, {
						method: "PATCH",
						body: JSON.stringify(payload),
					})
				: await apiFetch("/question-sets", {
						method: "POST",
						body: JSON.stringify(payload),
					});
		setIsSubmitting(false);
		if (body?.success) {
			onSaved(body.data.questionSetId);
		} else {
			setErrorMessage(
				body?.message ??
					`Could not ${mode === "edit" ? "save changes to" : "create"} the question set.`,
			);
		}
	}

	if (loadState === "unauthorized") {
		return (
			<section className="max-sm:p-3 sm:p-6 text-center text-stone-500">
				<p className="mb-3">
					You need to be an admin or teacher to{" "}
					{mode === "edit" ? "edit" : "create"} an assignment.
				</p>
				<Link
					to={cancelHref}
					className="text-green-700 font-semibold underline"
				>
					Back to assignments
				</Link>
			</section>
		);
	}

	if (loadState === "loading") {
		return (
			<section className="max-sm:p-3 sm:p-6">
				<p className="text-stone-400">Loading…</p>
			</section>
		);
	}

	if (options.length === 0) {
		return (
			<section className="max-sm:p-3 sm:p-6 text-center text-stone-500">
				<p className="mb-3">
					{isAdmin
						? "No teacher currently teaches an active group, so there's no subject to attach a question set to yet."
						: "You're not currently teaching any active group, so there's no subject to attach a question set to yet."}
				</p>
				<Link
					to={cancelHref}
					className="text-green-700 font-semibold underline"
				>
					Back to assignments
				</Link>
			</section>
		);
	}

	return (
		<section className="max-sm:p-3 sm:p-6 max-w-3xl">
			<h1 className="font-heading text-2xl font-bold text-green-800 mb-1">
				{mode === "edit" ? "Edit Assignment" : "Create Assignment"}
			</h1>
			<p className="text-stone-500 text-sm mb-4">
				Build a multiple-choice question set. It becomes visible to students who
				share this subject, level, and teacher in a current group.
			</p>

			<div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm mb-6">
				<TriangleAlert size={18} className="shrink-0 mt-0.5" />
				<p>
					This can be edited until a student answers it — once that happens, it
					locks and can only be deleted.
				</p>
			</div>

			{errorMessage && (
				<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
					{errorMessage}
				</p>
			)}

			<form onSubmit={handleSubmit} className="flex flex-col gap-6">
				<div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
					<input
						className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
						placeholder="Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					<textarea
						className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors min-h-20"
						placeholder="Description (optional)"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					<div className="grid sm:grid-cols-3 gap-3">
						{isAdmin && (
							<select
								className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
								value={teacherId}
								onChange={(e) => handleTeacherChange(e.target.value)}
							>
								{teachers.map((t) => (
									<option key={t.id} value={t.id}>
										{t.name}
									</option>
								))}
							</select>
						)}
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={subjectId}
							onChange={(e) => setSubjectId(e.target.value)}
						>
							{subjectsForTeacher.map((s) => (
								<option key={s.subjectId} value={s.subjectId}>
									{s.subjectName}
								</option>
							))}
						</select>
						<select
							className="border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors"
							value={level}
							onChange={(e) => setLevel(e.target.value as ApiLevel)}
						>
							<option value="beginner">Beginner</option>
							<option value="intermediate">Intermediate</option>
							<option value="advanced">Advance</option>
						</select>
					</div>
				</div>

				{questions.map((q, qIndex) => (
					<div
						key={q.id}
						className="bg-white border border-green-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3"
					>
						<div className="flex items-start gap-2">
							<span className="font-heading font-bold text-green-700 shrink-0 pt-2">
								Q{qIndex + 1}
							</span>
							<textarea
								className="flex-1 border border-stone-300 focus:border-green-500 rounded-xl p-2 text-sm outline-none transition-colors min-h-16"
								placeholder="Question text"
								value={q.text}
								onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
							/>
							{questions.length > 1 && (
								<button
									type="button"
									className="text-rose-500 hover:text-rose-600 cursor-pointer shrink-0 pt-2"
									onClick={() => removeQuestion(q.id)}
									aria-label={`Remove question ${qIndex + 1}`}
								>
									<Trash2 size={18} />
								</button>
							)}
						</div>
						<div className="grid sm:grid-cols-2 gap-2 pl-8">
							{q.options.map((o, oIndex) => (
								<label
									key={o.id}
									className="flex items-center gap-2 border border-stone-300 rounded-xl p-2 text-sm has-[:checked]:border-green-500 has-[:checked]:bg-green-50"
								>
									<input
										type="radio"
										name={`correct-${q.id}`}
										checked={q.correctOptionId === o.id}
										onChange={() =>
											updateQuestion(q.id, { correctOptionId: o.id })
										}
									/>
									<span className="text-stone-400 font-semibold">
										{String.fromCharCode(65 + oIndex)}
									</span>
									<input
										className="flex-1 outline-none bg-transparent"
										placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
										value={o.text}
										onChange={(e) => updateOption(q.id, o.id, e.target.value)}
									/>
								</label>
							))}
						</div>
					</div>
				))}

				<button
					type="button"
					onClick={addQuestion}
					className="flex self-start font-semibold items-center gap-2 cursor-pointer text-green-700 border border-green-200 hover:bg-green-50 transition-colors rounded-xl px-4 py-2"
				>
					<PlusCircle size={18} />
					Add Question
				</button>

				<div className="flex justify-end gap-2">
					<Link
						to={cancelHref}
						className="rounded-xl border border-stone-300 text-stone-600 px-4 py-2 hover:bg-stone-50 transition-colors"
					>
						Cancel
					</Link>
					<button
						type="submit"
						disabled={isSubmitting}
						className="cursor-pointer rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors disabled:opacity-50"
					>
						{isSubmitting
							? "Saving…"
							: mode === "edit"
								? "Save Changes"
								: "Save"}
					</button>
				</div>
			</form>
		</section>
	);
}
