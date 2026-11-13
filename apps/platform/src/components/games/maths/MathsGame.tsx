import { Calculator } from "lucide-react";
import { useState } from "react";
import { GameEntryScreen, type GameMode } from "../shared/GameEntryScreen";
import { QuizRunner } from "../shared/QuizRunner";
import { ResultScreen } from "../shared/ResultScreen";
import { buildQuestions, type Operation } from "./problems";

const MODES: GameMode[] = [
	{
		id: "add",
		badge: "+",
		accent: "var(--color-game-purple)",
		title: "PENJUMLAHAN",
		subtitle: "Latihan menambah angka",
	},
	{
		id: "subtract",
		badge: "-",
		accent: "var(--color-game-orange)",
		title: "PENGURANGAN",
		subtitle: "Latihan mengurangi angka",
	},
	{
		id: "mixed",
		badge: null,
		accent: "var(--color-game-green-d)",
		title: "CAMPURAN",
		subtitle: "Tambah, kurang, kali diacak",
	},
];

export function MathsGame() {
	const [screen, setScreen] = useState<"entry" | "quiz" | "result">("entry");
	const [operation, setOperation] = useState<Operation | null>(null);
	const [quizSessionId, setQuizSessionId] = useState(0);
	const [result, setResult] = useState<{ score: number; total: number }>({
		score: 0,
		total: 0,
	});

	function startMode(modeId: string) {
		setOperation(modeId as Operation);
		setQuizSessionId((id) => id + 1);
		setScreen("quiz");
	}

	function handleFinish(score: number, total: number) {
		setResult({ score, total });
		setScreen("result");
	}

	if (screen === "quiz" && operation) {
		return (
			<MathsQuizSession
				key={quizSessionId}
				operation={operation}
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
			idPrefix="maths"
			brandIcon={<Calculator size={30} color="var(--color-game-ink)" />}
			brandIconBg="bg-game-c4"
			wordmark={
				<>
					<span style={{ color: "var(--color-game-purple)" }}>HITUNG</span>
					<span>-</span>
					<span style={{ color: "var(--color-game-orange)" }}>SERU</span>
				</>
			}
			modes={MODES}
			onStartMode={startMode}
		/>
	);
}

// Built once per mount — MathsGame remounts this (via `key`) every time a
// mode is picked, so a fresh problem set starts clean each time.
function MathsQuizSession({
	operation,
	onFinish,
}: {
	operation: Operation;
	onFinish: (score: number, total: number) => void;
}) {
	const [questions] = useState(() => buildQuestions(operation));
	return (
		<QuizRunner
			questions={questions}
			accent="var(--color-game-purple)"
			accentTint="bg-game-c4"
			onFinish={onFinish}
		/>
	);
}
