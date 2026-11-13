import type { ReactNode } from "react";
import { useState } from "react";
import { PressableCard } from "./PressableCard";

export type GameMode = {
	id: string;
	// null renders the generic "mixed" (two overlapping circles) icon below.
	badge: string | null;
	accent: string;
	title: string;
	subtitle: string;
};

// Entry screen shared by every subject's game — English, Maths, and Arabic
// all render byte-identical chrome here (brand block, name box, mode list,
// credit line), differing only in the pieces passed in.
// Recreated structure from reference/SPEC.md's English screen — never Tim
// Sebentar's actual logo or credit line, see the two swaps in EnglishGame.
export function GameEntryScreen({
	idPrefix,
	brandIcon,
	brandIconBg,
	wordmark,
	modes,
	onStartMode,
}: {
	idPrefix: string;
	brandIcon: ReactNode;
	brandIconBg: string;
	wordmark: ReactNode;
	modes: GameMode[];
	onStartMode: (modeId: string) => void;
}) {
	const [name, setName] = useState("");
	// Separate from `name` itself — without this, the greeting would replace
	// the input after the very first keystroke (as soon as `name` is
	// truthy), making it look like the name submits one letter at a time.
	const [nameConfirmed, setNameConfirmed] = useState(false);
	const nameInputId = `${idPrefix}-game-name`;

	return (
		<div
			className="flex flex-col items-center gap-4 text-center"
			style={{ color: "var(--color-game-ink)" }}
		>
			<div
				className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-game-ink shadow-game-sm ${brandIconBg}`}
			>
				{brandIcon}
			</div>
			<p
				className="text-3xl leading-none"
				style={{ fontFamily: "var(--font-game-display)" }}
			>
				{wordmark}
			</p>

			{name && nameConfirmed ? (
				<p className="text-sm font-semibold">Halo, {name}! 👋</p>
			) : (
				<div className="flex w-full flex-col gap-2">
					<label htmlFor={nameInputId} className="text-sm font-bold">
						Siapa namamu?
					</label>
					<div className="flex gap-2">
						<input
							id={nameInputId}
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

			<div className="flex w-full flex-col gap-3">
				{modes.map((mode) => (
					<PressableCard
						key={mode.id}
						as="button"
						size="md"
						shadowColor={mode.accent}
						className="flex items-center gap-3 rounded-game-card bg-game-paper px-4 py-3 text-left"
						style={{ borderColor: "var(--color-game-ink)" }}
						onClick={() => onStartMode(mode.id)}
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
								// same register as the letter badges next to it.
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
