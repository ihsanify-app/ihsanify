import { shuffle } from "../shared/shuffle";
import type { QuizQuestion } from "../shared/useQuizSession";

export type Direction = "ar2id" | "id2ar" | "mixed";

type WordPair = { ar: string; id: string };

// Simple, everyday words — animals, colors, family, numbers, objects — the
// same categories as the English word bank, for the same reason: a
// beginner would plausibly be drilling these, not placeholder text.
const WORD_BANK: WordPair[] = [
	{ ar: "قطة", id: "Kucing" },
	{ ar: "كلب", id: "Anjing" },
	{ ar: "طائر", id: "Burung" },
	{ ar: "سمكة", id: "Ikan" },
	{ ar: "أحمر", id: "Merah" },
	{ ar: "أزرق", id: "Biru" },
	{ ar: "أخضر", id: "Hijau" },
	{ ar: "أصفر", id: "Kuning" },
	{ ar: "أم", id: "Ibu" },
	{ ar: "أب", id: "Ayah" },
	{ ar: "أخت", id: "Kakak Perempuan" },
	{ ar: "أخ", id: "Kakak Laki-laki" },
	{ ar: "واحد", id: "Satu" },
	{ ar: "اثنان", id: "Dua" },
	{ ar: "ثلاثة", id: "Tiga" },
	{ ar: "كتاب", id: "Buku" },
	{ ar: "طاولة", id: "Meja" },
	{ ar: "كرسي", id: "Kursi" },
	{ ar: "ماء", id: "Air" },
	{ ar: "خبز", id: "Roti" },
];

function buildQuestion(
	pair: WordPair,
	dir: "ar2id" | "id2ar",
	index: number,
): QuizQuestion {
	const prompt = dir === "ar2id" ? pair.ar : pair.id;
	const correctText = dir === "ar2id" ? pair.id : pair.ar;

	const distractorPairs = shuffle(WORD_BANK.filter((p) => p !== pair)).slice(
		0,
		3,
	);
	const distractorTexts = distractorPairs.map((p) =>
		dir === "ar2id" ? p.id : p.ar,
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
			badge: dir === "ar2id" ? "AR" : "ID",
			text:
				dir === "ar2id"
					? "Artinya dalam bahasa Indonesia?"
					: "Artinya dalam bahasa Arab?",
		},
		audio: { text: prompt, lang: dir === "ar2id" ? "ar-SA" : "id-ID" },
	};
}

export function buildQuestions(direction: Direction): QuizQuestion[] {
	const pairs = shuffle(WORD_BANK).slice(0, 10);
	return pairs.map((pair, i) => {
		const dir =
			direction === "mixed"
				? Math.random() < 0.5
					? "ar2id"
					: "id2ar"
				: direction;
		return buildQuestion(pair, dir, i);
	});
}
