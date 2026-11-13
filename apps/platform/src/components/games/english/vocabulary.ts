import type { QuizQuestion } from "../shared/useQuizSession";

export type Direction = "en2id" | "id2en" | "mixed";

type WordPair = { en: string; id: string };

// Simple, everyday words — animals, colors, family, numbers, objects —
// the kind a beginner would plausibly be drilling, not placeholder text.
const WORD_BANK: WordPair[] = [
	{ en: "Cat", id: "Kucing" },
	{ en: "Dog", id: "Anjing" },
	{ en: "Bird", id: "Burung" },
	{ en: "Fish", id: "Ikan" },
	{ en: "Red", id: "Merah" },
	{ en: "Blue", id: "Biru" },
	{ en: "Green", id: "Hijau" },
	{ en: "Yellow", id: "Kuning" },
	{ en: "Mother", id: "Ibu" },
	{ en: "Father", id: "Ayah" },
	{ en: "Sister", id: "Kakak Perempuan" },
	{ en: "Brother", id: "Kakak Laki-laki" },
	{ en: "One", id: "Satu" },
	{ en: "Two", id: "Dua" },
	{ en: "Three", id: "Tiga" },
	{ en: "Book", id: "Buku" },
	{ en: "Table", id: "Meja" },
	{ en: "Chair", id: "Kursi" },
	{ en: "Water", id: "Air" },
	{ en: "Bread", id: "Roti" },
];

function shuffle<T>(arr: T[]): T[] {
	const copy = [...arr];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

function buildQuestion(
	pair: WordPair,
	dir: "en2id" | "id2en",
	index: number,
): QuizQuestion {
	const prompt = dir === "en2id" ? pair.en : pair.id;
	const correctText = dir === "en2id" ? pair.id : pair.en;

	const distractorPairs = shuffle(WORD_BANK.filter((p) => p !== pair)).slice(
		0,
		3,
	);
	const distractorTexts = distractorPairs.map((p) =>
		dir === "en2id" ? p.id : p.en,
	);

	const options = shuffle([
		{ id: "correct", text: correctText },
		...distractorTexts.map((text, i) => ({ id: `d${i}`, text })),
	]).map((o, i) => ({ id: `${index}-${i}-${o.id}`, text: o.text }));

	const correctOption = options.find((o) => o.text === correctText);
	// Fallback for the astronomically unlikely case a distractor's text
	// collides with the correct answer's text (shouldn't happen with this
	// bank's all-distinct words, but never leave correctOptionId dangling).
	const correctOptionId = correctOption?.id ?? options[0].id;

	return {
		id: `q-${index}`,
		prompt,
		options,
		correctOptionId,
		instruction: {
			badge: dir === "en2id" ? "EN" : "ID",
			text:
				dir === "en2id"
					? "Artinya dalam bahasa Indonesia?"
					: "Artinya dalam bahasa Inggris?",
		},
		audio: { text: prompt, lang: dir === "en2id" ? "en-US" : "id-ID" },
	};
}

export function buildQuestions(direction: Direction): QuizQuestion[] {
	const pairs = shuffle(WORD_BANK).slice(0, 10);
	return pairs.map((pair, i) => {
		const dir =
			direction === "mixed"
				? Math.random() < 0.5
					? "en2id"
					: "id2en"
				: direction;
		return buildQuestion(pair, dir, i);
	});
}
