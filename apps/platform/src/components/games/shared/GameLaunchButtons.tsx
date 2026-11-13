import { useState } from "react";
import { ArabicGame } from "../arabic/ArabicGame";
import { EnglishGame } from "../english/EnglishGame";
import { MathsGame } from "../maths/MathsGame";
import { GamePopup } from "./GamePopup";
import { PressableCard } from "./PressableCard";

type GameId = "english" | "maths" | "arabic";

const GAMES: {
	id: GameId;
	label: string;
	accent: string;
	tint: string;
}[] = [
	{
		id: "english",
		label: "Main Bahasa Inggris",
		accent: "var(--color-game-blue)",
		tint: "bg-game-c3",
	},
	{
		id: "maths",
		label: "Main Matematika",
		accent: "var(--color-game-purple)",
		tint: "bg-game-c4",
	},
	{
		id: "arabic",
		label: "Main Bahasa Arab",
		accent: "var(--color-game-green)",
		tint: "bg-game-c5",
	},
];

export function GameLaunchButtons() {
	const [openGame, setOpenGame] = useState<GameId | null>(null);

	return (
		<>
			{/* Visible at every width, unlike the old PhoneStack slot this
			    replaces — these are functional entry points to a real
			    feature, not decorative imagery, so hiding them from mobile
			    visitors (most real traffic) would hide the feature itself.
			    The popups below never inherit this wrapper's layout, so an
			    already-open popup is unaffected by viewport width either way. */}
			<div className="flex flex-col gap-3">
				{GAMES.map((game) => (
					<PressableCard
						key={game.id}
						as="button"
						size="md"
						shadowColor={game.accent}
						className={`flex items-center justify-center rounded-game-card px-5 py-4 text-base font-bold ${game.tint}`}
						style={{ fontFamily: "var(--font-game-display)" }}
						onClick={() => setOpenGame(game.id)}
					>
						{game.label}
					</PressableCard>
				))}
			</div>

			{openGame === "english" && (
				<GamePopup
					title="Game Bahasa Inggris"
					onClose={() => setOpenGame(null)}
				>
					<EnglishGame />
				</GamePopup>
			)}
			{openGame === "maths" && (
				<GamePopup title="Game Matematika" onClose={() => setOpenGame(null)}>
					<MathsGame />
				</GamePopup>
			)}
			{openGame === "arabic" && (
				<GamePopup title="Game Bahasa Arab" onClose={() => setOpenGame(null)}>
					<ArabicGame />
				</GamePopup>
			)}
		</>
	);
}
