import { shuffle } from "../shared/shuffle";
import type { QuizQuestion } from "../shared/useQuizSession";

export type Operation = "add" | "subtract" | "mixed";

type Symbol = "+" | "-" | "×";

const OP_WORD: Record<Symbol, string> = {
	"+": "tambah",
	"-": "kurang",
	"×": "kali",
};

function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildProblem(op: Symbol): { a: number; b: number; op: Symbol } {
	if (op === "+") return { a: randInt(1, 20), b: randInt(1, 20), op };
	if (op === "-") {
		// b <= a so the result never goes negative — these are drills for
		// beginners, not an introduction to negative numbers.
		const a = randInt(5, 20);
		return { a, b: randInt(1, a), op };
	}
	return { a: randInt(1, 10), b: randInt(1, 10), op };
}

function solve(a: number, b: number, op: Symbol): number {
	if (op === "+") return a + b;
	if (op === "-") return a - b;
	return a * b;
}

function buildQuestion(op: Symbol, index: number): QuizQuestion {
	const { a, b } = buildProblem(op);
	const answer = solve(a, b, op);

	const distractors = new Set<number>();
	while (distractors.size < 3) {
		const delta = randInt(-5, 5) || 1;
		const candidate = answer + delta;
		if (candidate >= 0 && candidate !== answer) distractors.add(candidate);
	}

	const options = shuffle([
		{ id: "correct", text: String(answer) },
		...[...distractors].map((n, i) => ({ id: `d${i}`, text: String(n) })),
	]).map((o, i) => ({ id: `${index}-${i}-${o.id}`, text: o.text }));

	const correctOption = options.find((o) => o.text === String(answer));
	// Fallback for the astronomically unlikely case a distractor collides
	// with the answer's text (shouldn't happen given the dedup above).
	const correctOptionId = correctOption?.id ?? options[0].id;

	return {
		id: `q-${index}`,
		prompt: `${a} ${op} ${b}`,
		options,
		correctOptionId,
		instruction: { badge: op, text: "Berapa hasilnya?" },
		audio: { text: `${a} ${OP_WORD[op]} ${b}`, lang: "id-ID" },
	};
}

export function buildQuestions(mode: Operation): QuizQuestion[] {
	const symbols: Symbol[] = ["+", "-", "×"];
	return Array.from({ length: 10 }, (_, i) => {
		const op: Symbol =
			mode === "add" ? "+" : mode === "subtract" ? "-" : symbols[randInt(0, 2)];
		return buildQuestion(op, i);
	});
}
