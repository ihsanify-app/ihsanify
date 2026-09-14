import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { Reveal } from "./Reveal";

type AlmaMater = {
	almaMaterId: string;
	name: string;
	logoUrl: string;
};

export function AlmaMater() {
	const [almaMaters, setAlmaMaters] = useState<AlmaMater[]>([]);

	useEffect(() => {
		apiFetch("/public/alma-maters").then(({ status, body }) => {
			if (status === 200) setAlmaMaters(body?.data ?? []);
		});
	}, []);

	// Same "hide rather than show broken/empty" precedent as
	// Testimonials/Teachers — nothing fabricated in place of real logos.
	if (almaMaters.length === 0) return null;

	return (
		<section className="scroll-mt-20 bg-green-50 px-4 py-12 text-center sm:px-6">
			<Reveal>
				<p className="font-heading text-sm font-bold uppercase tracking-wide text-green-700">
					Background Lulusan Pengajar
				</p>
			</Reveal>
			<div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-6">
				{almaMaters.map((a, i) => (
					<Reveal key={a.almaMaterId} delayMs={i * 80}>
						<div className="flex flex-col items-center gap-2">
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
								<img
									src={a.logoUrl}
									alt={a.name}
									className="h-full w-full object-contain p-2"
								/>
							</div>
							<span className="max-w-24 text-xs text-stone-500">{a.name}</span>
						</div>
					</Reveal>
				))}
			</div>
		</section>
	);
}
