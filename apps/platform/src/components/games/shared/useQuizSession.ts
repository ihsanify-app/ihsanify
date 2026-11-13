import { useMemo, useState } from "react";
import { playFeedbackSound } from "./playFeedbackSound";

export type QuizOption = { id: string; text: string };

export type QuizQuestion = {
	id: string;
	prompt: string;
	options: QuizOption[];
	correctOptionId: string;
	// Optional short badge + instruction line shown above the prompt (e.g.
	// English's per-question "EN" / "artinya dalam bahasa Indonesia?") —
	// generic here so Maths/Arabic can set their own without a new field.
	instruction?: { badge: string; text: string };
	// Optional speaker-button audio: what to read aloud and in which BCP-47
	// locale (matters for pronunciation — e.g. "en-US" vs "id-ID"). Absent
	// for subjects where reading the prompt aloud doesn't make sense.
	audio?: { text: string; lang: string };
};

// Subject-agnostic quiz runner: current question, running score, and the
// current question's answered state (locked once chosen, until `next()`).
// Maths/Arabic reuse this unchanged — only `questions` differs per subject.
export function useQuizSession(questions: QuizQuestion[]) {
	const [index, setIndex] = useState(0);
	const [score, setScore] = useState(0);
	// Tracked directly, not derived as `index - score` — `score` updates the
	// instant an answer is submitted, but `index` only advances later (on
	// `next()`), so that derivation briefly went negative right after a
	// correct answer (score up, index not yet) and didn't move at all right
	// after a wrong one (neither changed) until the auto-advance caught up.
	const [wrongCount, setWrongCount] = useState(0);
	const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

	const totalQuestions = questions.length;
	const isFinished = index >= totalQuestions;
	const currentQuestion = isFinished ? null : questions[index];

	const isCorrect = useMemo(
		() =>
			selectedOptionId !== null &&
			currentQuestion !== null &&
			selectedOptionId === currentQuestion?.correctOptionId,
		[selectedOptionId, currentQuestion],
	);

	function submitAnswer(optionId: string) {
		// Locked once answered — a second call before `next()` is a no-op,
		// so a double-click can't double-count the score.
		if (selectedOptionId !== null || !currentQuestion) return;
		setSelectedOptionId(optionId);
		const correct = optionId === currentQuestion.correctOptionId;
		if (correct) setScore((s) => s + 1);
		else setWrongCount((w) => w + 1);
		playFeedbackSound(correct);
	}

	function next() {
		setSelectedOptionId(null);
		setIndex((i) => i + 1);
	}

	return {
		currentQuestion,
		currentIndex: index,
		totalQuestions,
		score,
		wrongCount,
		selectedOptionId,
		isAnswered: selectedOptionId !== null,
		isCorrect,
		isFinished,
		submitAnswer,
		next,
	};
}
