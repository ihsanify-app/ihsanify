import { Languages } from "lucide-react";
import { useState } from "react";
import { GameEntryScreen, type GameMode } from "../shared/GameEntryScreen";
import { QuizRunner } from "../shared/QuizRunner";
import { ResultScreen } from "../shared/ResultScreen";
import { buildQuestions, type Direction } from "./vocabulary";

const MODES: GameMode[] = [
	{
		id: "ar2id",
		badge: "AR",
		accent: "var(--color-game-green)",
		title: "ARAB → INDONESIA",
		subtitle: "Tebak arti bahasa Indonesianya",
	},
	{
		id: "id2ar",
		badge: "ID",
		accent: "var(--color-game-red)",
		title: "INDONESIA → ARAB",
		subtitle: "Tebak bahasa Arabnya",
	},
	{
		id: "mixed",
		badge: null,
		accent: "var(--color-game-purple)",
		title: "CAMPURAN",
		subtitle: "Dua arah diacak",
	},
];

export function ArabicGame() {
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
			<ArabicQuizSession
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
			idPrefix="arabic"
			brandIcon={<Languages size={30} color="var(--color-game-ink)" />}
			brandIconBg="bg-game-c5"
			wordmark={
				<>
					<span style={{ color: "var(--color-game-green)" }}>AR</span>
					<span>-</span>
					<span style={{ color: "var(--color-game-red)" }}>INDO</span>
				</>
			}
			modes={MODES}
			onStartMode={startMode}
		/>
	);
}

// Built once per mount — ArabicGame remounts this (via `key`) every time a
// mode is picked, so a fresh shuffled question set starts clean each time.
function ArabicQuizSession({
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
			accent="var(--color-game-green)"
			accentTint="bg-game-c5"
			onFinish={onFinish}
		/>
	);
}
