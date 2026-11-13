import type { ReactNode } from "react";
import { useState } from "react";
import { ArabicGame } from "../arabic/ArabicGame";
import { EnglishGame } from "../english/EnglishGame";
import { MathsGame } from "../maths/MathsGame";
import { GamePopup } from "./GamePopup";
import { PressableCard } from "./PressableCard";

type GameId = "english" | "maths" | "arabic";

// Hand-drawn, not a stock icon-pack glyph (no generic globe/book/mosque
// clipart) — each ties to something concrete about its subject instead:
// two speech bubbles mid-exchange, an abacus row, a single pen stroke.
function EnglishIcon() {
	return (
		<svg viewBox="0 0 40 40" aria-hidden="true" className="h-7 w-7 shrink-0">
			<rect
				x="5"
				y="9"
				width="20"
				height="14"
				rx="6"
				fill="none"
				stroke="#1a2e22"
				strokeWidth="2.2"
				opacity="0.55"
			/>
			<path
				d="M11 23l-2 5 6-3"
				fill="none"
				stroke="#1a2e22"
				strokeWidth="2.2"
				strokeLinejoin="round"
				strokeLinecap="round"
				opacity="0.55"
			/>
			<rect
				x="15"
				y="17"
				width="20"
				height="14"
				rx="6"
				fill="none"
				stroke="#1a2e22"
				strokeWidth="2.2"
			/>
			<path
				d="M29 31l2 5-6-3"
				fill="none"
				stroke="#1a2e22"
				strokeWidth="2.2"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function MathsIcon() {
	// A big "+" with a smaller "×" layered over its corner — built only
	// from straight lines (no freehand curve-guessing, which is what made
	// the Arabic attempt look off), and unambiguously arithmetic.
	return (
		<svg viewBox="0 0 40 40" aria-hidden="true" className="h-7 w-7 shrink-0">
			<line
				x1="15"
				y1="6"
				x2="15"
				y2="24"
				stroke="#1a2e22"
				strokeWidth="4"
				strokeLinecap="round"
			/>
			<line
				x1="6"
				y1="15"
				x2="24"
				y2="15"
				stroke="#1a2e22"
				strokeWidth="4"
				strokeLinecap="round"
			/>
			<line
				x1="22"
				y1="22"
				x2="34"
				y2="34"
				stroke="#1a2e22"
				strokeWidth="3.2"
				strokeLinecap="round"
				opacity="0.55"
			/>
			<line
				x1="34"
				y1="22"
				x2="22"
				y2="34"
				stroke="#1a2e22"
				strokeWidth="3.2"
				strokeLinecap="round"
				opacity="0.55"
			/>
		</svg>
	);
}

function ArabicIcon() {
	// The actual letter, not a hand-drawn approximation of one — a bezier
	// guess at Arabic calligraphy is exactly what read as "funny"; the real
	// glyph, rendered as text, is correct by construction.
	return (
		<span
			aria-hidden="true"
			className="flex h-7 w-7 shrink-0 items-center justify-center text-2xl font-bold leading-none"
			style={{ color: "#1a2e22" }}
		>
			ض
		</span>
	);
}

const GAMES: {
	id: GameId;
	label: string;
	accent: string;
	tint: string;
	icon: ReactNode;
}[] = [
	{
		id: "english",
		label: "Main Bahasa Inggris",
		accent: "var(--color-game-blue)",
		tint: "bg-game-c3",
		icon: <EnglishIcon />,
	},
	{
		id: "maths",
		label: "Main Matematika",
		accent: "var(--color-game-purple)",
		tint: "bg-game-c4",
		icon: <MathsIcon />,
	},
	{
		id: "arabic",
		label: "Main Bahasa Arab",
		accent: "var(--color-game-green)",
		tint: "bg-game-c5",
		icon: <ArabicIcon />,
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
			{/* max-w-xs + mx-auto — at desktop widths this sits in a grid
			    column roughly half the hero's max-w-6xl, which stretched
			    these pill buttons far wider than their short label needed,
			    reading as awkwardly elongated. Capping the width and
			    centering it is harmless on phone widths too, since max-w-xs
			    (320px) is already close to the available column width there. */}
			<div className="mx-auto flex w-full max-w-xs flex-col gap-3">
				{GAMES.map((game) => (
					<PressableCard
						key={game.id}
						as="button"
						size="md"
						shadowColor={game.accent}
						className={`flex items-center justify-center gap-2.5 rounded-game-card px-5 py-4 text-base font-bold ${game.tint}`}
						style={{ fontFamily: "var(--font-game-display)" }}
						onClick={() => setOpenGame(game.id)}
					>
						{game.icon}
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
