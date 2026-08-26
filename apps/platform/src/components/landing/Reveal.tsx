import { useEffect, useRef, useState } from "react";

// Lightweight scroll-into-view fade/slide animation, reusing the existing
// `animate-fade-slide-up` keyframe (no animation library needed).
export function Reveal({
	children,
	delayMs = 0,
	className,
}: {
	children: React.ReactNode;
	delayMs?: number;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.15 },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className={`${visible ? "animate-fade-slide-up" : "opacity-0"} ${className ?? ""}`}
			style={{ animationDelay: `${delayMs}ms` }}
		>
			{children}
		</div>
	);
}
