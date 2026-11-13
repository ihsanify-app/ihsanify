import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { GameEntryScreen, type GameMode } from "../shared/GameEntryScreen";
import { QuizRunner } from "../shared/QuizRunner";
import { ResultScreen } from "../shared/ResultScreen";
import { buildQuestions, type Direction } from "./vocabulary";

// Entry screen recreated from reference/SPEC.md section "1. English" and
// reference/screenshots/engindo-{1440,390}.png (not Tim Sebentar's logo or
// credit line — see the two swaps below). Quiz gameplay is new, not
// reverse-engineered — SPEC.md explicitly didn't investigate actual
// gameplay, only the entry screen.

const MODES: GameMode[] = [
	{
		id: "en2id",
		badge: "EN",
		accent: "var(--color-game-blue)",
		title: "INGGRIS → INDONESIA",
		subtitle: "Tebak arti bahasa Indonesianya",
	},
	{
		id: "id2en",
		badge: "ID",
		accent: "var(--color-game-red)",
		title: "INDONESIA → INGGRIS",
		subtitle: "Tebak bahasa Inggrisnya",
	},
	{
		id: "mixed",
		badge: null,
		accent: "var(--color-game-purple)",
		title: "CAMPURAN",
		subtitle: "Dua arah diacak",
	},
];

export function EnglishGame() {
	const [screen, setScreen] = useState<"entry" | "quiz" | "result">("entry");
	const [direction, setDirection] = useState<Direction | null>(null);
	const [quizSessionId, setQuizSessionId] = useState(0);
	const [result, setResult] = useState<{ score: number; total: number }>({
		score: 0,
		total: 0,
	});

	function startMode(modeId: string) {
		setDirection(modeId as Direction);
		setQuizSessionId((id) => id + 1);
		setScreen("quiz");
	}

	function handleFinish(score: number, total: number) {
		setResult({ score, total });
		setScreen("result");
	}

	if (screen === "quiz" && direction) {
		return (
			<EnglishQuizSession
				key={quizSessionId}
				direction={direction}
				onFinish={handleFinish}
			/>
		);
	}

	if (screen === "result") {
		return (
			<ResultScreen
				score={result.score}
				total={result.total}
				onBackToEntry={() => setScreen("entry")}
			/>
		);
	}

	return (
		<GameEntryScreen
			idPrefix="english"
			brandIcon={<GraduationCap size={30} color="var(--color-game-ink)" />}
			brandIconBg="bg-game-c3"
			wordmark={
				<>
					<span style={{ color: "var(--color-game-blue)" }}>ENG</span>
					<span>-</span>
					<span style={{ color: "var(--color-game-red)" }}>INDO</span>
				</>
			}
			modes={MODES}
			onStartMode={startMode}
		/>
	);
}

// Built once per mount — EnglishGame remounts this (via `key`) every time a
// mode is picked, so a fresh shuffled question set starts clean each time.
function EnglishQuizSession({
	direction,
	onFinish,
}: {
	direction: Direction;
	onFinish: (score: number, total: number) => void;
}) {
	const [questions] = useState(() => buildQuestions(direction));
	return (
		<QuizRunner
			questions={questions}
			accent="var(--color-game-blue)"
			accentTint="bg-game-c3"
			onFinish={onFinish}
		/>
	);
}
