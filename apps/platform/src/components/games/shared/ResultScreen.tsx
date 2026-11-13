import { PressableCard } from "./PressableCard";

export function ResultScreen({
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
