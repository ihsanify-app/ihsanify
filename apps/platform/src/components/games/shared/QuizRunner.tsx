import { Volume2 } from "lucide-react";
import { useEffect } from "react";
import { ChoiceGrid } from "./ChoiceGrid";
import { speak } from "./speak";
import { type QuizQuestion, useQuizSession } from "./useQuizSession";

// The pause between answering and auto-advancing — long enough to read the
// good/bad highlight and flash, short enough not to feel sluggish.
const ADVANCE_DELAY_MS = 900;

// Shared across every subject (English/Maths/Arabic) so a fix here — the
// counter logic, the popup-clearance layout, the SFX wiring — applies to
// all of them at once instead of drifting between copies.
export function QuizRunner({
	questions,
	accent = "var(--color-game-blue)",
	accentTint = "bg-game-c3",
	onFinish,
}: {
	questions: QuizQuestion[];
	// Card border, instruction badge background, and speaker-icon color.
	accent?: string;
	// Tailwind background class for the speaker button's light tint.
	accentTint?: string;
	onFinish: (score: number, total: number) => void;
}) {
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
				className="flex w-full flex-col items-center gap-3 rounded-game-card border-2 bg-game-paper px-5 py-8"
				style={{
					borderColor: accent,
					backgroundImage:
						"radial-gradient(rgba(26, 46, 34, 0.08) 1.5px, transparent 1.5px)",
					backgroundSize: "14px 14px",
				}}
			>
				{currentQuestion.instruction && (
					<div className="flex items-center gap-2">
						<span
							className="rounded-game-pill px-2 py-0.5 text-[11px] font-bold text-white"
							style={{ backgroundColor: accent }}
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
						dir="auto"
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
							className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-game-ink shadow-game-sm transition-transform duration-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${accentTint}`}
						>
							<Volume2 size={18} color={accent} />
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
