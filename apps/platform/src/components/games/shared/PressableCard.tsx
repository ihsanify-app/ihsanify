import type { ReactNode } from "react";

// The one interaction state in reference/SPEC.md's source design: a hard,
// unblurred offset shadow that the element "presses flat into" on :active
// (shadow shrinks, element translates by ~the shadow's own offset). No
// hover state at all — confirmed in SPEC.md as a deliberate touch-first
// choice, not an oversight, so none is added here either.
const SIZE_SHADOW = {
	sm: "shadow-game-sm active:shadow-[1px_1px_0_var(--shadow-color,var(--color-game-ink))] active:translate-x-[2px] active:translate-y-[2px]",
	md: "shadow-game-md active:shadow-[1px_1px_0_var(--shadow-color,var(--color-game-ink))] active:translate-x-[3px] active:translate-y-[3px]",
	lg: "shadow-game-lg active:shadow-[1px_1px_0_var(--shadow-color,var(--color-game-ink))] active:translate-x-[6px] active:translate-y-[6px]",
} as const;

export function PressableCard({
	as = "div",
	size = "md",
	shadowColor,
	className = "",
	style,
	onClick,
	children,
}: {
	as?: "div" | "button";
	size?: keyof typeof SIZE_SHADOW;
	// CSS color value for the shadow/border accent (defaults to --color-game-ink,
	// same as every neutral card in the reference design).
	shadowColor?: string;
	className?: string;
	style?: React.CSSProperties;
	onClick?: () => void;
	children: ReactNode;
}) {
	const Tag = as;
	return (
		<Tag
			{...(as === "button" ? { type: "button" as const } : {})}
			onClick={onClick}
			className={`border-2 border-game-ink transition-transform duration-100 ${SIZE_SHADOW[size]} ${className}`}
			style={{
				...(shadowColor
					? ({ "--shadow-color": shadowColor } as React.CSSProperties)
					: {}),
				...style,
			}}
		>
			{children}
		</Tag>
	);
}
