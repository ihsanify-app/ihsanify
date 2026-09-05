import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { AnimatedNumber } from "./AnimatedNumber";
import { Reveal } from "./Reveal";

type PublicStats = {
	teacherCount: number;
	studentCount: number;
	groupCount: number;
	totalSessionHours: number;
};

type LoadState = "loading" | "ready" | "error";

export function Stats() {
	const [stats, setStats] = useState<PublicStats | null>(null);
	const [loadState, setLoadState] = useState<LoadState>("loading");

	useEffect(() => {
		apiFetch("/public/stats")
			.then(({ status, body }) => {
				if (status === 200 && body?.data) {
					setStats(body.data);
					setLoadState("ready");
				} else {
					setLoadState("error");
				}
			})
			.catch(() => setLoadState("error"));
	}, []);

	// A stats bar that fails silently and shows "0+" reads as "this school has
	// zero students" — worse than showing nothing. Hide the section entirely
	// on a real failure instead, matching the Instagram marquee's precedent
	// of degrading quietly rather than displaying a misleading number.
	if (loadState === "error") return null;

	const items = [
		{ id: 1, title: "Jam Pembelajaran", count: stats?.totalSessionHours ?? 0 },
		{ id: 2, title: "Kelas", count: stats?.groupCount ?? 0 },
		{ id: 3, title: "Pembelajar", count: stats?.studentCount ?? 0 },
		{ id: 4, title: "Pengajar", count: stats?.teacherCount ?? 0 },
	];

	return (
		<section id="stats" className="scroll-mt-20 bg-green-50 px-4 py-16 sm:px-6">
			<Reveal className="mx-auto mb-6 max-w-2xl text-center">
				<p className="text-lg text-stone-600">
					Dipercaya oleh keluarga yang ingin menghadirkan pendidikan Islami yang
					hangat dan bermakna.
				</p>
			</Reveal>
			<Reveal className="flex justify-center" delayMs={100}>
				<div className="w-full max-w-4xl px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 bg-green-700 rounded-3xl shadow-lg shadow-green-700/20">
					{items.map((s) => (
						<div
							key={s.id}
							className="rounded-2xl px-3 py-4 text-center transition-all duration-200 hover:scale-105 hover:bg-white/10"
						>
							{loadState === "loading" ? (
								<div className="mx-auto h-9 w-12 animate-pulse rounded-lg bg-white/20" />
							) : (
								<h2 className="font-heading text-3xl text-white font-extrabold">
									<AnimatedNumber value={s.count} startDelayMs={s.id * 150} />+
								</h2>
							)}
							<p className="text-green-100 text-base mt-1">{s.title}</p>
						</div>
					))}
				</div>
			</Reveal>
		</section>
	);
}
