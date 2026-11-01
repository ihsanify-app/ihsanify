import {
	createFileRoute,
	Link,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	QuestionSetForm,
	type QuestionSetFormInitialData,
} from "../../../components/assignments/QuestionSetForm";
import { apiFetch } from "../../../lib/apiClient";

export const Route = createFileRoute("/_app/assignments_/$questionSetId_/edit")(
	{
		component: RouteComponent,
	},
);

type ApiLevel = "beginner" | "intermediate" | "advanced";

type QuestionSetDetailForEdit = {
	title: string;
	description: string | null;
	subjectId: string;
	subjectName: string;
	teacherId: string;
	teacherName: string;
	level: ApiLevel;
	canEdit?: boolean;
	questions: {
		text: string;
		options: { text: string; isCorrect?: boolean }[];
	}[];
};

function RouteComponent() {
	const { questionSetId } = useParams({
		from: "/_app/assignments_/$questionSetId_/edit",
	});
	const navigate = useNavigate();
	const [loadState, setLoadState] = useState<
		"loading" | "ready" | "denied" | "locked"
	>("loading");
	const [errorMessage, setErrorMessage] = useState("");
	const [initialData, setInitialData] =
		useState<QuestionSetFormInitialData | null>(null);

	useEffect(() => {
		apiFetch(`/question-sets/${questionSetId}`).then(({ status, body }) => {
			if (status === 401 || status === 403 || status === 404) {
				setLoadState("denied");
				setErrorMessage(body?.message ?? "Unable to load this question set.");
				return;
			}
			const data: QuestionSetDetailForEdit = body.data;
			if (!data.canEdit) {
				setLoadState("locked");
				return;
			}
			setInitialData({
				title: data.title,
				description: data.description,
				subjectId: data.subjectId,
				subjectName: data.subjectName,
				teacherId: data.teacherId,
				teacherName: data.teacherName,
				level: data.level,
				questions: data.questions.map((q) => ({
					text: q.text,
					options: q.options.map((o) => ({
						text: o.text,
						isCorrect: o.isCorrect === true,
					})),
				})),
			});
			setLoadState("ready");
		});
	}, [questionSetId]);

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

	if (loadState === "locked") {
		return (
			<section className="max-sm:p-3 sm:p-6 text-center text-stone-500">
				<p className="mb-3">
					This question set has already been answered by a student and can no
					longer be edited.
				</p>
				<Link
					to="/assignments/$questionSetId"
					params={{ questionSetId }}
					className="text-green-700 font-semibold underline"
				>
					Back to this assignment
				</Link>
			</section>
		);
	}

	if (loadState === "loading" || !initialData) {
		return (
			<section className="max-sm:p-3 sm:p-6">
				<p className="text-stone-400">Loading…</p>
			</section>
		);
	}

	return (
		<QuestionSetForm
			mode="edit"
			questionSetId={questionSetId}
			initialData={initialData}
			cancelHref={`/assignments/${questionSetId}`}
			onSaved={(savedId) =>
				navigate({
					to: "/assignments/$questionSetId",
					params: { questionSetId: savedId },
				})
			}
		/>
	);
}
