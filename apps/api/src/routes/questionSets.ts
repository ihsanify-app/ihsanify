import { Hono } from "hono";
import type { AuthedUser } from "../utils/auth";
import { requireAuth, requireRole } from "../utils/auth";
import {
	type ApiDifficultyLevel,
	type DbDifficultyLevel,
	isApiLevel,
	toApiLevel,
	toDbLevel,
} from "../utils/difficultyLevel";
import {
	getCurrentSubjectTeacherPairsForStudent,
	getCurrentTeacherIdByGroup,
} from "../utils/groupState";
import { prisma } from "../utils/prisma";
import { isPrismaErrorCode } from "../utils/prismaErrors";

export const questionSetsRouter = new Hono();

async function getOwnTeacherId(authUser: AuthedUser) {
	if (authUser.role !== "TEACHER") return null;
	const teacher = await prisma.teacher.findUnique({
		where: { userId: authUser.id },
	});
	return teacher?.id ?? null;
}

async function getOwnStudentId(authUser: AuthedUser) {
	if (authUser.role !== "STUDENT") return null;
	const student = await prisma.student.findUnique({
		where: { userId: authUser.id },
	});
	return student?.id ?? null;
}

// Currently-live (teacherId, subjectId) pairs across the whole school — a
// pairing is "live" when some active group has that subject and that
// teacher as its current teacher. Used both to populate the create form's
// dropdowns and to reject creating a set for a pairing no student could
// ever match.
async function getLiveTeacherSubjectPairs() {
	const [activeGroups, teacherIdByGroup] = await Promise.all([
		prisma.group.findMany({ where: { isActive: true } }),
		getCurrentTeacherIdByGroup(),
	]);
	const pairs = new Map<string, { teacherId: string; subjectId: string }>();
	for (const group of activeGroups) {
		const teacherId = teacherIdByGroup.get(group.id);
		if (!teacherId) continue;
		pairs.set(`${teacherId}:${group.subjectId}`, {
			teacherId,
			subjectId: group.subjectId,
		});
	}
	return [...pairs.values()];
}

// The (subjectId, teacherId, level) triples a student is currently allowed
// to see — a question set only becomes visible once an admin has also set
// the student's level for that subject.
async function getVisibleTriplesForStudent(studentId: string) {
	const pairs = await getCurrentSubjectTeacherPairsForStudent(studentId);
	if (pairs.length === 0) return [];
	const levels = await prisma.studentSubjectLevel.findMany({
		where: { studentId },
	});
	const levelBySubject = new Map(levels.map((l) => [l.subjectId, l.level]));
	const triples: {
		subjectId: string;
		teacherId: string;
		level: DbDifficultyLevel;
	}[] = [];
	for (const pair of pairs) {
		const level = levelBySubject.get(pair.subjectId);
		if (!level) continue;
		triples.push({
			subjectId: pair.subjectId,
			teacherId: pair.teacherId,
			level,
		});
	}
	return triples;
}

type QuestionSetWithRelations = {
	id: string;
	title: string;
	description: string | null;
	subjectId: string;
	teacherId: string;
	level: DbDifficultyLevel;
	createdAt: Date;
	subject: { name: string };
	teacher: { user: { name: string } };
	questions?: {
		id: string;
		position: number;
		text: string;
		options: {
			id: string;
			position: number;
			text: string;
			isCorrect: boolean;
		}[];
	}[];
};

function serializeListItem(
	questionSet: QuestionSetWithRelations & { _count: { questions: number } },
	canDelete: boolean,
	// Passed (even as null) only for a STUDENT caller — distinguishes "not
	// done yet" (null) from "this field doesn't apply to you" (omitted
	// entirely, for ADMIN/TEACHER callers).
	myAttempt?: { score: number; submittedAt: string } | null,
) {
	return {
		questionSetId: questionSet.id,
		title: questionSet.title,
		description: questionSet.description,
		subjectId: questionSet.subjectId,
		subjectName: questionSet.subject.name,
		teacherId: questionSet.teacherId,
		teacherName: questionSet.teacher.user.name,
		level: toApiLevel(questionSet.level),
		questionCount: questionSet._count.questions,
		createdAt: questionSet.createdAt.toISOString(),
		canDelete,
		...(myAttempt !== undefined ? { myAttempt } : {}),
	};
}

function serializeDetail(
	questionSet: Required<Pick<QuestionSetWithRelations, "questions">> &
		QuestionSetWithRelations,
	canDelete: boolean,
	includeIsCorrect: boolean,
	// Only set for a STUDENT who has already submitted their one attempt —
	// marks which option was theirs alongside the now-visible isCorrect, so
	// the review screen can show "your answer" next to "the correct answer".
	selectedOptionIdByQuestion?: Map<string, string>,
	// Mirrors canDelete's ownership rule, further restricted to "and nobody
	// has attempted it yet" — omitted (not just false) for a STUDENT, who can
	// never edit regardless.
	canEdit?: boolean,
) {
	return {
		questionSetId: questionSet.id,
		title: questionSet.title,
		description: questionSet.description,
		subjectId: questionSet.subjectId,
		subjectName: questionSet.subject.name,
		teacherId: questionSet.teacherId,
		teacherName: questionSet.teacher.user.name,
		level: toApiLevel(questionSet.level),
		createdAt: questionSet.createdAt.toISOString(),
		canDelete,
		...(canEdit !== undefined ? { canEdit } : {}),
		questions: questionSet.questions
			.sort((a, b) => a.position - b.position)
			.map((q) => ({
				questionId: q.id,
				text: q.text,
				options: q.options
					.sort((a, b) => a.position - b.position)
					.map((o) => ({
						optionId: o.id,
						text: o.text,
						...(includeIsCorrect ? { isCorrect: o.isCorrect } : {}),
						...(selectedOptionIdByQuestion?.get(q.id) === o.id
							? { isSelected: true }
							: {}),
					})),
			})),
	};
}

async function getAttemptSummaries(
	questionSetId: string,
	totalQuestions: number,
) {
	const attempts = await prisma.questionSetAttempt.findMany({
		where: { questionSetId },
		include: {
			student: { include: { user: true } },
			answers: { include: { option: true } },
		},
		orderBy: { submittedAt: "asc" },
	});
	return attempts.map((a) => ({
		studentId: a.studentId,
		studentName: a.student.user.name,
		score: a.answers.filter((ans) => ans.option.isCorrect).length,
		totalQuestions,
		submittedAt: a.submittedAt.toISOString(),
	}));
}

async function getMyAttempt(questionSetId: string, studentId: string) {
	const attempt = await prisma.questionSetAttempt.findUnique({
		where: { questionSetId_studentId: { questionSetId, studentId } },
		include: { answers: { include: { option: true } } },
	});
	if (!attempt) return null;
	return {
		submittedAt: attempt.submittedAt,
		score: attempt.answers.filter((a) => a.option.isCorrect).length,
		selectedOptionIdByQuestion: new Map(
			attempt.answers.map((a) => [a.questionId, a.optionId]),
		),
	};
}

questionSetsRouter.get(
	"/question-sets/authoring-options",
	requireAuth,
	requireRole("ADMIN", "TEACHER"),
	async (c) => {
		const authUser = c.get("authUser");
		const ownTeacherId = await getOwnTeacherId(authUser);
		let pairs = await getLiveTeacherSubjectPairs();
		if (authUser.role === "TEACHER") {
			pairs = pairs.filter((p) => p.teacherId === ownTeacherId);
		}

		const teacherIds = [...new Set(pairs.map((p) => p.teacherId))];
		const subjectIds = [...new Set(pairs.map((p) => p.subjectId))];
		const [teachers, subjects] = await Promise.all([
			prisma.teacher.findMany({
				where: { id: { in: teacherIds } },
				include: { user: true },
			}),
			prisma.subject.findMany({ where: { id: { in: subjectIds } } }),
		]);
		const teacherNameById = new Map(teachers.map((t) => [t.id, t.user.name]));
		const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

		return c.json({
			success: true,
			data: pairs.map((p) => ({
				teacherId: p.teacherId,
				teacherName: teacherNameById.get(p.teacherId) ?? "",
				subjectId: p.subjectId,
				subjectName: subjectNameById.get(p.subjectId) ?? "",
			})),
		});
	},
);

questionSetsRouter.get("/question-sets", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const include = { subject: true, teacher: { include: { user: true } } };

	if (authUser.role === "ADMIN") {
		const sets = await prisma.questionSet.findMany({
			include: { ...include, _count: { select: { questions: true } } },
			orderBy: { createdAt: "desc" },
		});
		return c.json({
			success: true,
			data: sets.map((s) => serializeListItem(s, true)),
		});
	}

	if (authUser.role === "TEACHER") {
		const ownTeacherId = await getOwnTeacherId(authUser);
		const sets = ownTeacherId
			? await prisma.questionSet.findMany({
					where: { teacherId: ownTeacherId },
					include: { ...include, _count: { select: { questions: true } } },
					orderBy: { createdAt: "desc" },
				})
			: [];
		return c.json({
			success: true,
			data: sets.map((s) => serializeListItem(s, true)),
		});
	}

	const studentId = await getOwnStudentId(authUser);
	if (!studentId) {
		return c.json({ success: true, data: [] });
	}
	const triples = await getVisibleTriplesForStudent(studentId);
	if (triples.length === 0) {
		return c.json({ success: true, data: [] });
	}
	const sets = await prisma.questionSet.findMany({
		where: { OR: triples.map((t) => ({ ...t })) },
		include: { ...include, _count: { select: { questions: true } } },
		orderBy: { createdAt: "desc" },
	});

	const attempts = await prisma.questionSetAttempt.findMany({
		where: { studentId, questionSetId: { in: sets.map((s) => s.id) } },
		include: { answers: { include: { option: true } } },
	});
	const attemptByQuestionSetId = new Map(
		attempts.map((a) => [
			a.questionSetId,
			{
				score: a.answers.filter((ans) => ans.option.isCorrect).length,
				submittedAt: a.submittedAt.toISOString(),
			},
		]),
	);

	return c.json({
		success: true,
		data: sets.map((s) =>
			serializeListItem(s, false, attemptByQuestionSetId.get(s.id) ?? null),
		),
	});
});

questionSetsRouter.get("/question-sets/:id", requireAuth, async (c) => {
	const authUser = c.get("authUser");
	const id = c.req.param("id");
	const include = {
		subject: true,
		teacher: { include: { user: true } },
		questions: { include: { options: true } },
	};

	const questionSet = await prisma.questionSet.findUnique({
		where: { id },
		include,
	});
	if (!questionSet) {
		return c.json({ success: false, message: "Question set not found." }, 404);
	}

	const totalQuestions = questionSet.questions.length;

	if (authUser.role === "ADMIN") {
		const attempts = await getAttemptSummaries(id, totalQuestions);
		return c.json({
			success: true,
			data: {
				...serializeDetail(
					questionSet,
					true,
					true,
					undefined,
					attempts.length === 0,
				),
				attempts,
			},
		});
	}

	if (authUser.role === "TEACHER") {
		const ownTeacherId = await getOwnTeacherId(authUser);
		if (questionSet.teacherId !== ownTeacherId) {
			return c.json(
				{
					success: false,
					message: "You don't have access to this assignment.",
				},
				403,
			);
		}
		const attempts = await getAttemptSummaries(id, totalQuestions);
		return c.json({
			success: true,
			data: {
				...serializeDetail(
					questionSet,
					true,
					true,
					undefined,
					attempts.length === 0,
				),
				attempts,
			},
		});
	}

	// STUDENT: 404 (not 403) on denial, so a student can't distinguish
	// "doesn't exist" from "not visible to you" — unlike reports/invoices,
	// this feature's whole point is a strict per-student visibility gate.
	const studentId = await getOwnStudentId(authUser);
	const triples = studentId ? await getVisibleTriplesForStudent(studentId) : [];
	const isVisible = triples.some(
		(t) =>
			t.subjectId === questionSet.subjectId &&
			t.teacherId === questionSet.teacherId &&
			t.level === questionSet.level,
	);
	if (!isVisible || !studentId) {
		return c.json({ success: false, message: "Question set not found." }, 404);
	}

	const myAttemptRaw = await getMyAttempt(id, studentId);
	// Once a student has submitted their one allowed attempt, isCorrect
	// becomes visible to them (for this set only) so they can review their
	// answers — the one deliberate exception to "never send isCorrect to a
	// STUDENT".
	const data = myAttemptRaw
		? {
				...serializeDetail(
					questionSet,
					false,
					true,
					myAttemptRaw.selectedOptionIdByQuestion,
				),
				myAttempt: {
					score: myAttemptRaw.score,
					totalQuestions,
					submittedAt: myAttemptRaw.submittedAt.toISOString(),
				},
			}
		: { ...serializeDetail(questionSet, false, false), myAttempt: null };

	return c.json({ success: true, data });
});

type CreateQuestionSetBody = {
	title?: string;
	description?: string | null;
	subjectId?: string;
	teacherId?: string;
	level?: ApiDifficultyLevel;
	questions?: {
		text?: string;
		options?: { text?: string; isCorrect?: boolean }[];
	}[];
};

type ValidatedQuestionSetInput = {
	title: string;
	description: string | null;
	subjectId: string;
	teacherId: string;
	level: ApiDifficultyLevel;
	questions: {
		text: string;
		options: { text: string; isCorrect: boolean }[];
	}[];
};

type ValidationResult =
	| { error: string; status: 400 }
	| { data: ValidatedQuestionSetInput };

// Shared by POST (create) and PATCH (edit, only while unattempted) — same
// rules apply either way, including re-verifying the (subject, teacher)
// pair is still live, since that can change between page load and save.
async function validateQuestionSetInput(
	authUser: AuthedUser,
	body: CreateQuestionSetBody,
): Promise<ValidationResult> {
	const title = body.title?.trim();
	if (!title || title.length > 200) {
		return { error: "title is required (max 200 characters).", status: 400 };
	}
	const description = body.description?.trim() || null;
	if (!body.subjectId) {
		return { error: "subjectId is required.", status: 400 };
	}
	if (!body.level || !isApiLevel(body.level)) {
		return {
			error: "level must be beginner, intermediate, or advanced.",
			status: 400,
		};
	}

	let teacherId: string;
	if (authUser.role === "TEACHER") {
		const ownTeacherId = await getOwnTeacherId(authUser);
		if (!ownTeacherId) {
			return {
				error: "No teacher profile found for this account.",
				status: 400,
			};
		}
		teacherId = ownTeacherId;
	} else {
		if (!body.teacherId) {
			return { error: "teacherId is required.", status: 400 };
		}
		teacherId = body.teacherId;
	}

	const livePairs = await getLiveTeacherSubjectPairs();
	const isLive = livePairs.some(
		(p) => p.teacherId === teacherId && p.subjectId === body.subjectId,
	);
	if (!isLive) {
		return {
			error:
				"This teacher doesn't currently teach that subject in any active group.",
			status: 400,
		};
	}

	const questions = body.questions ?? [];
	if (questions.length < 1 || questions.length > 100) {
		return {
			error: "A question set needs between 1 and 100 questions.",
			status: 400,
		};
	}
	const normalizedQuestions: ValidatedQuestionSetInput["questions"] = [];
	for (const question of questions) {
		const questionText = question.text?.trim();
		if (!questionText || questionText.length > 2000) {
			return {
				error: "Every question needs non-empty text (max 2000 characters).",
				status: 400,
			};
		}
		const options = question.options ?? [];
		if (options.length !== 4) {
			return {
				error: "Every question needs exactly 4 options.",
				status: 400,
			};
		}
		const seen = new Set<string>();
		let correctCount = 0;
		const normalizedOptions: ValidatedQuestionSetInput["questions"][number]["options"] =
			[];
		for (const option of options) {
			const optionText = option.text?.trim();
			if (!optionText || optionText.length > 500) {
				return {
					error: "Every option needs non-empty text (max 500 characters).",
					status: 400,
				};
			}
			const key = optionText.toLowerCase();
			if (seen.has(key)) {
				return {
					error: "A question's options must be distinct.",
					status: 400,
				};
			}
			seen.add(key);
			if (typeof option.isCorrect !== "boolean") {
				return {
					error: "Every option must mark isCorrect true or false.",
					status: 400,
				};
			}
			if (option.isCorrect) correctCount++;
			normalizedOptions.push({
				text: optionText,
				isCorrect: option.isCorrect === true,
			});
		}
		if (correctCount !== 1) {
			return {
				error: "Every question needs exactly one correct option.",
				status: 400,
			};
		}
		normalizedQuestions.push({
			text: questionText,
			options: normalizedOptions,
		});
	}

	return {
		data: {
			title,
			description,
			subjectId: body.subjectId,
			teacherId,
			level: body.level,
			questions: normalizedQuestions,
		},
	};
}

questionSetsRouter.post(
	"/question-sets",
	requireAuth,
	requireRole("ADMIN", "TEACHER"),
	async (c) => {
		const authUser = c.get("authUser");
		const body = (await c.req.json()) as CreateQuestionSetBody;
		const validated = await validateQuestionSetInput(authUser, body);
		if ("error" in validated) {
			return c.json(
				{ success: false, message: validated.error },
				validated.status,
			);
		}
		const { data } = validated;

		const questionSet = await prisma.questionSet.create({
			data: {
				title: data.title,
				description: data.description,
				subjectId: data.subjectId,
				teacherId: data.teacherId,
				level: toDbLevel(data.level),
				createdById: authUser.id,
				questions: {
					create: data.questions.map((question, qIndex) => ({
						position: qIndex,
						text: question.text,
						options: {
							create: question.options.map((option, oIndex) => ({
								position: oIndex,
								text: option.text,
								isCorrect: option.isCorrect,
							})),
						},
					})),
				},
			},
			include: {
				subject: true,
				teacher: { include: { user: true } },
				questions: { include: { options: true } },
			},
		});

		return c.json(
			{
				success: true,
				data: serializeDetail(questionSet, true, true, undefined, true),
			},
			201,
		);
	},
);

// PATCH is allowed only while the set has zero attempts — the moment a
// student submits, it locks exactly like before. This keeps the "score is
// always computed live from current content, never stored" design safe:
// there's nothing graded yet to retroactively change.
questionSetsRouter.patch(
	"/question-sets/:id",
	requireAuth,
	requireRole("ADMIN", "TEACHER"),
	async (c) => {
		const authUser = c.get("authUser");
		const id = c.req.param("id");

		const existing = await prisma.questionSet.findUnique({
			where: { id },
			include: { _count: { select: { attempts: true } } },
		});
		if (!existing) {
			return c.json(
				{ success: false, message: "Question set not found." },
				404,
			);
		}
		if (authUser.role === "TEACHER") {
			const ownTeacherId = await getOwnTeacherId(authUser);
			if (existing.teacherId !== ownTeacherId) {
				return c.json(
					{
						success: false,
						message: "You can only edit your own question sets.",
					},
					403,
				);
			}
		}
		if (existing._count.attempts > 0) {
			return c.json(
				{
					success: false,
					message:
						"This question set has already been answered by a student and can no longer be edited.",
				},
				409,
			);
		}

		const body = (await c.req.json()) as CreateQuestionSetBody;
		const validated = await validateQuestionSetInput(authUser, body);
		if ("error" in validated) {
			return c.json(
				{ success: false, message: validated.error },
				validated.status,
			);
		}
		const { data } = validated;

		try {
			const questionSet = await prisma.$transaction(async (tx) => {
				// Re-check inside the transaction too — closes the (small) race
				// where a student submits between the check above and here.
				const attemptCount = await tx.questionSetAttempt.count({
					where: { questionSetId: id },
				});
				if (attemptCount > 0) {
					throw new Error("ALREADY_ATTEMPTED");
				}
				await tx.question.deleteMany({ where: { questionSetId: id } });
				return tx.questionSet.update({
					where: { id },
					data: {
						title: data.title,
						description: data.description,
						subjectId: data.subjectId,
						teacherId: data.teacherId,
						level: toDbLevel(data.level),
						questions: {
							create: data.questions.map((question, qIndex) => ({
								position: qIndex,
								text: question.text,
								options: {
									create: question.options.map((option, oIndex) => ({
										position: oIndex,
										text: option.text,
										isCorrect: option.isCorrect,
									})),
								},
							})),
						},
					},
					include: {
						subject: true,
						teacher: { include: { user: true } },
						questions: { include: { options: true } },
					},
				});
			});

			return c.json({
				success: true,
				data: serializeDetail(questionSet, true, true, undefined, true),
			});
		} catch (error) {
			if (error instanceof Error && error.message === "ALREADY_ATTEMPTED") {
				return c.json(
					{
						success: false,
						message:
							"This question set has already been answered by a student and can no longer be edited.",
					},
					409,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);

type SubmitAttemptBody = {
	answers?: { questionId?: string; optionId?: string }[];
};

questionSetsRouter.post(
	"/question-sets/:id/attempt",
	requireAuth,
	async (c) => {
		const authUser = c.get("authUser");
		// Not requireRole: ADMIN shouldn't submit an attempt either, so every
		// non-STUDENT role is rejected the same way.
		if (authUser.role !== "STUDENT") {
			return c.json(
				{ success: false, message: "Only a student can submit an attempt." },
				403,
			);
		}

		const id = c.req.param("id");
		const questionSet = await prisma.questionSet.findUnique({
			where: { id },
			include: { questions: { include: { options: true } } },
		});
		if (!questionSet) {
			return c.json(
				{ success: false, message: "Question set not found." },
				404,
			);
		}

		const studentId = await getOwnStudentId(authUser);
		if (!studentId) {
			return c.json(
				{
					success: false,
					message: "No student profile found for this account.",
				},
				400,
			);
		}

		// Same visibility gate as GET, re-checked here since it could have
		// changed since the student loaded the page.
		const triples = await getVisibleTriplesForStudent(studentId);
		const isVisible = triples.some(
			(t) =>
				t.subjectId === questionSet.subjectId &&
				t.teacherId === questionSet.teacherId &&
				t.level === questionSet.level,
		);
		if (!isVisible) {
			return c.json(
				{ success: false, message: "Question set not found." },
				404,
			);
		}

		const existing = await prisma.questionSetAttempt.findUnique({
			where: { questionSetId_studentId: { questionSetId: id, studentId } },
		});
		if (existing) {
			return c.json(
				{
					success: false,
					message: "You've already submitted this question set.",
				},
				409,
			);
		}

		const body = (await c.req.json()) as SubmitAttemptBody;
		const answers = body.answers ?? [];
		const validOptionIdsByQuestion = new Map(
			questionSet.questions.map((q) => [
				q.id,
				new Set(q.options.map((o) => o.id)),
			]),
		);

		if (answers.length !== questionSet.questions.length) {
			return c.json(
				{
					success: false,
					message: "Every question must be answered exactly once.",
				},
				400,
			);
		}
		const seenQuestionIds = new Set<string>();
		for (const answer of answers) {
			if (
				!answer.questionId ||
				!validOptionIdsByQuestion.has(answer.questionId)
			) {
				return c.json(
					{
						success: false,
						message:
							"One of the answered questions doesn't belong to this question set.",
					},
					400,
				);
			}
			if (seenQuestionIds.has(answer.questionId)) {
				return c.json(
					{
						success: false,
						message: "Each question can only be answered once.",
					},
					400,
				);
			}
			seenQuestionIds.add(answer.questionId);
			const validOptionIds = validOptionIdsByQuestion.get(answer.questionId);
			if (!answer.optionId || !validOptionIds?.has(answer.optionId)) {
				return c.json(
					{
						success: false,
						message:
							"One of the selected options doesn't belong to its question.",
					},
					400,
				);
			}
		}

		try {
			const attempt = await prisma.questionSetAttempt.create({
				data: {
					questionSetId: id,
					studentId,
					answers: {
						create: answers.map((a) => ({
							questionId: a.questionId as string,
							optionId: a.optionId as string,
						})),
					},
				},
				include: { answers: { include: { option: true } } },
			});

			return c.json(
				{
					success: true,
					data: {
						submittedAt: attempt.submittedAt.toISOString(),
						score: attempt.answers.filter((a) => a.option.isCorrect).length,
						totalQuestions: questionSet.questions.length,
						answers: attempt.answers.map((a) => ({
							questionId: a.questionId,
							selectedOptionId: a.optionId,
							isCorrect: a.option.isCorrect,
						})),
					},
				},
				201,
			);
		} catch (error) {
			// Defense in depth against a race with a concurrent submit — the
			// @@unique([questionSetId, studentId]) constraint is the real guard.
			if (isPrismaErrorCode(error, "P2002")) {
				return c.json(
					{
						success: false,
						message: "You've already submitted this question set.",
					},
					409,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);

questionSetsRouter.delete(
	"/question-sets/:id",
	requireAuth,
	requireRole("ADMIN", "TEACHER"),
	async (c) => {
		const authUser = c.get("authUser");
		const id = c.req.param("id");

		const existing = await prisma.questionSet.findUnique({ where: { id } });
		if (!existing) {
			return c.json(
				{ success: false, message: "Question set not found." },
				404,
			);
		}
		if (authUser.role === "TEACHER") {
			const ownTeacherId = await getOwnTeacherId(authUser);
			if (existing.teacherId !== ownTeacherId) {
				return c.json(
					{
						success: false,
						message: "You can only delete your own question sets.",
					},
					403,
				);
			}
		}

		try {
			await prisma.questionSet.delete({ where: { id } });
			return c.json({ success: true });
		} catch (error) {
			if (isPrismaErrorCode(error, "P2025")) {
				return c.json(
					{ success: false, message: "Question set not found." },
					404,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);
