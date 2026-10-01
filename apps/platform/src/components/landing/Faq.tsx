import { ChevronDown } from "lucide-react";
import { useState } from "react";
import faqData from "../../data/faq.json";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

export function Faq() {
	const [openIndex, setOpenIndex] = useState<number | null>(0);

	return (
		<section id="faq" className="scroll-mt-20 bg-white px-4 py-16 sm:px-6">
			<div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
				<Reveal>
					<Eyebrow className="mb-3">Tanya Jawab</Eyebrow>
					<h2 className="font-heading text-3xl font-bold text-emerald">
						Pertanyaan yang Sering Diajukan
					</h2>
				</Reveal>
				<div className="flex flex-col gap-3">
					{faqData.map((item, i) => {
						const isOpen = openIndex === i;
						return (
							<Reveal key={item.question} delayMs={i * 60}>
								<div className="overflow-hidden rounded-2xl bg-forest shadow-sm">
									<button
										type="button"
										onClick={() => setOpenIndex(isOpen ? null : i)}
										className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
									>
										<span className="font-medium text-white">
											{item.question}
										</span>
										<ChevronDown
											size={18}
											className={`shrink-0 text-green-200 transition-transform ${
												isOpen ? "rotate-180" : ""
											}`}
										/>
									</button>
									<div
										className={`grid transition-all duration-300 ${
											isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
										}`}
									>
										<div className="overflow-hidden">
											<p className="px-5 pb-4 text-base leading-relaxed text-green-100">
												{item.answer}
											</p>
										</div>
									</div>
								</div>
							</Reveal>
						);
					})}
				</div>
			</div>
		</section>
	);
}
