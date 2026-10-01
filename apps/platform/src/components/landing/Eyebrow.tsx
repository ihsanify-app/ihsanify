// Small uppercase label with a leading dash, sat above a section's heading —
// inline-flex (not justified) so it follows whatever text-align the parent
// already sets, instead of needing its own alignment prop per caller.
export function Eyebrow({
	children,
	className = "",
	tone = "green",
}: {
	children: React.ReactNode;
	className?: string;
	tone?: "green" | "amber" | "white";
}) {
	const toneClass =
		tone === "amber"
			? "text-gold"
			: tone === "white"
				? "text-gold"
				: "text-emerald";
	return (
		<p
			className={`inline-flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-[0.2em] ${toneClass} ${className}`}
		>
			<span
				className="h-0.5 w-6 shrink-0 rounded-full bg-current"
				aria-hidden="true"
			/>
			{children}
		</p>
	);
}
