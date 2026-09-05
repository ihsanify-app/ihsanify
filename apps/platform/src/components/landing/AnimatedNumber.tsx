import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
	value,
	durationMs = 3000,
	startDelayMs = 0,
}: {
	value: number;
	durationMs?: number;
	startDelayMs?: number;
}) {
	const ref = useRef<HTMLSpanElement>(null);
	const startedRef = useRef(false);
	const [display, setDisplay] = useState(0);

	useEffect(() => {
		if (startedRef.current) {
			setDisplay(value);
			return;
		}
		const node = ref.current;
		if (!node) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			startedRef.current = true;
			setDisplay(value);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting || startedRef.current) return;
				startedRef.current = true;
				observer.disconnect();

				const start = performance.now() + startDelayMs;
				const tick = (now: number) => {
					const progress = Math.min((now - start) / durationMs, 1);
					if (now < start) {
						requestAnimationFrame(tick);
						return;
					}
					const eased = progress >= 1 ? 1 : 1 - 2 ** (-10 * progress);
					setDisplay(Math.round(eased * value));
					if (progress < 1) requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
			},
			{ threshold: 0.4 },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [value, durationMs, startDelayMs]);

	return <span ref={ref}>{display}</span>;
}
