import { GraduationCap, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ChoiceGrid } from "../shared/ChoiceGrid";
import { PressableCard } from "../shared/PressableCard";
import { speak } from "../shared/speak";
import { useQuizSession } from "../shared/useQuizSession";
import { buildQuestions, type Direction } from "./vocabulary";

// Entry screen recreated from reference/SPEC.md section "1. English" and
// reference/screenshots/engindo-{1440,390}.png (not Tim Sebentar's logo or
// credit line — see the two swaps below). Quiz gameplay (this pass) is new,
// not reverse-engineered — SPEC.md explicitly didn't investigate actual
// gameplay, only the entry screen.

const MODES: {
	id: Direction;
	badge: string | null;
	accent: string;
	title: string;
	subtitle: string;
}[] = [
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

// The pause between answering and auto-advancing — long enough to read the
// good/bad highlight and flash, short enough not to feel sluggish.
const ADVANCE_DELAY_MS = 900;

function QuizRunner({
	direction,
	onFinish,
}: {
	direction: Direction;
	onFinish: (score: number, total: number) => void;
}) {
	// Built once per mount — EnglishGame remounts this (via `key`) every time
	// a mode is picked, so a fresh shuffled question set and a fresh
	// useQuizSession both start clean, with no manual reset wiring needed.
	const [questions] = useState(() => buildQuestions(direction));
	const quiz = useQuizSession(questions);

	useEffect(() => {
		if (quiz.isFinished) {
			onFinish(quiz.score, quiz.totalQuestions);
		}
	}, [quiz.isFinished, quiz.score, quiz.totalQuestions, onFinish]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: quiz.next is a new function identity every render (not memoized); including it would re-arm this timeout on every render while answered, not just once.
	useEffect(() => {
		if (!quiz.isAnswered) return;
		const t = setTimeout(() => quiz.next(), ADVANCE_DELAY_MS);
		return () => clearTimeout(t);
	}, [quiz.isAnswered]);

	if (quiz.isFinished || !quiz.currentQuestion) return null;
	const currentQuestion = quiz.currentQuestion;
	const { audio } = currentQuestion;

	return (
		<div className="relative flex w-full flex-col items-center gap-3">
			{quiz.isAnswered && (
				<div
					className={`pointer-events-none absolute -inset-5 rounded-game-card ${
						quiz.isCorrect
							? "animate-game-flash-good"
							: "animate-game-flash-bad"
					}`}
					style={{
						backgroundColor: quiz.isCorrect
							? "var(--color-game-good)"
							: "var(--color-game-bad)",
					}}
				/>
			)}

			<div className="flex w-full items-center justify-between gap-2">
				{[
					["Soal", `${quiz.currentIndex + 1}/${quiz.totalQuestions}`],
					["Benar", quiz.score],
					["Salah", quiz.wrongCount],
				].map(([label, value]) => (
					<span
						key={label}
						className="rounded-game-pill border-2 border-game-ink bg-game-paper px-2.5 py-1 text-[11px] font-bold"
					>
						{label} {value}
					</span>
				))}
			</div>

			<div
				className="flex w-full flex-col items-center gap-3 rounded-game-card border-2 border-game-blue bg-game-paper px-5 py-8"
				style={{
					backgroundImage:
						"radial-gradient(rgba(26, 46, 34, 0.08) 1.5px, transparent 1.5px)",
					backgroundSize: "14px 14px",
				}}
			>
				{currentQuestion.instruction && (
					<div className="flex items-center gap-2">
						<span
							className="rounded-game-pill px-2 py-0.5 text-[11px] font-bold text-white"
							style={{ backgroundColor: "var(--color-game-blue)" }}
						>
							{currentQuestion.instruction.badge}
						</span>
						<span
							className="text-xs font-semibold uppercase tracking-wide"
							style={{ color: "var(--color-game-muted)" }}
						>
							{currentQuestion.instruction.text}
						</span>
					</div>
				)}
				<div className="flex items-center gap-2">
					<p
						className="text-2xl font-bold"
						style={{ fontFamily: "var(--font-game-display)" }}
					>
						{currentQuestion.prompt}
					</p>
					{audio && (
						<button
							type="button"
							onClick={() => speak(audio.text, audio.lang)}
							aria-label="Dengarkan pelafalan"
							className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-game-ink bg-game-c3 shadow-game-sm transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
						>
							<Volume2 size={18} color="var(--color-game-blue)" />
						</button>
					)}
				</div>
			</div>

			<ChoiceGrid
				options={currentQuestion.options}
				selectedOptionId={quiz.selectedOptionId}
				correctOptionId={currentQuestion.correctOptionId}
				onSelect={quiz.submitAnswer}
			/>
		</div>
	);
}

function ResultScreen({
	score,
	total,
	onBackToEntry,
}: {
	score: number;
	total: number;
	onBackToEntry: () => void;
}) {
	return (
		<div className="flex w-full flex-col items-center gap-4 text-center">
			<p className="text-5xl">{score === total ? "🏆" : "🎉"}</p>
			<p
				className="text-2xl font-bold"
				style={{ fontFamily: "var(--font-game-display)" }}
			>
				Kamu benar {score}/{total}!
			</p>
			<PressableCard
				as="button"
				size="md"
				className="rounded-game-pill bg-game-green px-6 py-3 text-sm font-bold text-white"
				onClick={onBackToEntry}
			>
				Kembali ke Menu
			</PressableCard>
		</div>
	);
}

export function EnglishGame() {
	const [name, setName] = useState("");
	// Separate from `name` itself — without this, the greeting would replace
	// the input after the very first keystroke (as soon as `name` is
	// truthy), making it look like the name submits one letter at a time.
	const [nameConfirmed, setNameConfirmed] = useState(false);
	const [screen, setScreen] = useState<"entry" | "quiz" | "result">("entry");
	const [direction, setDirection] = useState<Direction | null>(null);
	const [quizSessionId, setQuizSessionId] = useState(0);
	const [result, setResult] = useState<{ score: number; total: number }>({
		score: 0,
		total: 0,
	});

	function startMode(mode: Direction) {
		setDirection(mode);
		setQuizSessionId((id) => id + 1);
		setScreen("quiz");
	}

	function handleFinish(score: number, total: number) {
		setResult({ score, total });
		setScreen("result");
	}

	if (screen === "quiz" && direction) {
		return (
			<QuizRunner
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
		<div
			className="flex flex-col items-center gap-4 text-center"
			style={{ color: "var(--color-game-ink)" }}
		>
			{/* Brand block — generic graduation-cap mark, not Tim Sebentar's
			    circular "Sebentar Press" logo. */}
			<div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-game-ink bg-game-c3 shadow-game-sm">
				<GraduationCap size={30} color="var(--color-game-ink)" />
			</div>
			<p
				className="text-3xl leading-none"
				style={{ fontFamily: "var(--font-game-display)" }}
			>
				<span style={{ color: "var(--color-game-blue)" }}>ENG</span>
				<span>-</span>
				<span style={{ color: "var(--color-game-red)" }}>INDO</span>
			</p>

			{name && nameConfirmed ? (
				<p className="text-sm font-semibold">Halo, {name}! 👋</p>
			) : (
				<div className="flex w-full flex-col gap-2">
					<label htmlFor="english-game-name" className="text-sm font-bold">
						Siapa namamu?
					</label>
					<div className="flex gap-2">
						<input
							id="english-game-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && name.trim()) setNameConfirmed(true);
							}}
							placeholder="Tulis namamu"
							className="flex-1 rounded-game-icon border-2 border-game-ink bg-game-paper px-3 py-2 text-sm outline-none"
							style={{ fontFamily: "var(--font-game-body)" }}
						/>
						<PressableCard
							as="button"
							size="sm"
							className="rounded-game-icon bg-game-green px-4 py-2 text-sm font-bold text-white"
							onClick={() => {
								if (name.trim()) setNameConfirmed(true);
							}}
						>
							OK
						</PressableCard>
					</div>
				</div>
			)}

			<span className="inline-flex items-center gap-1 rounded-game-pill border-2 border-game-ink bg-game-yellow px-3 py-1 text-xs font-bold">
				🏆 0/24 Trofi Juara
			</span>

			<div className="flex w-full flex-col gap-3">
				{MODES.map((mode) => (
					<PressableCard
						key={mode.id}
						as="button"
						size="md"
						shadowColor={mode.accent}
						className="flex items-center gap-3 rounded-game-card bg-game-paper px-4 py-3 text-left"
						style={{ borderColor: "var(--color-game-ink)" }}
						onClick={() => startMode(mode.id)}
					>
						<span
							className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-game-ink text-sm font-bold"
							style={{ backgroundColor: mode.accent, color: "white" }}
						>
							{mode.badge ?? (
								// Inline, not an external file: an <img src="...svg">
								// here failed to decode in testing (browser rendered
								// its broken-image placeholder instead of the icon,
								// confirmed via naturalWidth === 0) despite the file
								// itself being valid — inlining removes that whole
								// failure mode. Two overlapping circles (the "mixed
								// directions" idea the original icon.svg drew), in
								// plain white against the badge's accent background,
								// same register as the EN/ID letter badges next to it.
								<svg viewBox="0 0 40 40" aria-hidden="true" className="h-6 w-6">
									<circle
										cx="16"
										cy="21"
										r="9"
										fill="none"
										stroke="white"
										strokeWidth="2.4"
									/>
									<circle
										cx="25"
										cy="21"
										r="9"
										fill="none"
										stroke="white"
										strokeWidth="2.4"
									/>
								</svg>
							)}
						</span>
						<span className="flex flex-col">
							<span
								className="text-base font-bold leading-tight"
								style={{ fontFamily: "var(--font-game-display)" }}
							>
								{mode.title}
							</span>
							<span
								className="text-xs"
								style={{ color: "var(--color-game-muted)" }}
							>
								{mode.subtitle}
							</span>
						</span>
					</PressableCard>
				))}
			</div>

			<p className="text-xs" style={{ color: "var(--color-game-muted)" }}>
				Dibuat untuk semua, digratiskan oleh Ihsanify ©
			</p>
		</div>
	);
}
