import { PressableCard } from "./PressableCard";
import type { QuizOption } from "./useQuizSession";

// Reference/SPEC.md's `.choice` 2x2 grid: neutral until answered, then the
// correct option highlights "good", a wrong *selected* option highlights
// "bad" and shakes, and the remaining two options just dim — never reveal
// which of the other three was "almost" right beyond the one actually
// picked.
export function ChoiceGrid({
	options,
	selectedOptionId,
	correctOptionId,
	onSelect,
}: {
	options: QuizOption[];
	selectedOptionId: string | null;
	correctOptionId: string;
	onSelect: (optionId: string) => void;
}) {
	const isAnswered = selectedOptionId !== null;

	return (
		<div className="grid w-full grid-cols-2 gap-3">
			{options.map((option) => {
				const isSelected = option.id === selectedOptionId;
				const isTheCorrectOne = option.id === correctOptionId;

				let stateClass = "bg-game-paper";
				let shadowColor: string | undefined;
				let animateClass = "";
				if (isAnswered) {
					if (isTheCorrectOne) {
						stateClass = "bg-game-good text-white";
						shadowColor = "var(--color-game-good)";
					} else if (isSelected) {
						stateClass = "bg-game-bad text-white";
						shadowColor = "var(--color-game-bad)";
						animateClass = "animate-game-nudge";
					} else {
						stateClass = "bg-game-paper opacity-40";
					}
				}

				return (
					<PressableCard
						key={option.id}
						as="button"
						size="md"
						shadowColor={shadowColor}
						className={`flex min-h-16 items-center justify-center rounded-game-card px-3 py-3 text-center text-sm font-bold transition-colors ${stateClass} ${animateClass}`}
						style={{ fontFamily: "var(--font-game-body)" }}
						onClick={() => !isAnswered && onSelect(option.id)}
					>
						{option.text}
					</PressableCard>
				);
			})}
		</div>
	);
}
