import { CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { Reveal } from "./Reveal";

type Testimonial = {
	testimonialId: string;
	name: string;
	message: string;
	givenAt: string;
	createdAt: string;
};

// Matches WhatsApp's own convention: just the time for a message from today,
// otherwise a short date alongside it — testimonials can be entered well
// after the fact, so unlike createdAt (always "now"), givenAt genuinely
// spans different days.
function formatGivenAt(iso: string) {
	const date = new Date(iso);
	const time = date.toLocaleTimeString("id-ID", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const isToday = date.toDateString() === new Date().toDateString();
	if (isToday) return time;
	const day = date.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
	});
	return `${day}, ${time}`;
}

// Deliberate pastiche, not palette drift: the user explicitly asked for
// these cards to read as WhatsApp chat bubbles, so the warm wallpaper tone
// and the blue double-check are WhatsApp's own signature details, not this
// site's usual green-only accent language.
function ChatBubble({ testimonial }: { testimonial: Testimonial }) {
	const time = formatGivenAt(testimonial.givenAt);

	return (
		<div className="relative">
			<div className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 bg-white" />
			<div className="relative rounded-2xl bg-white p-4 shadow-sm text-left">
				<p className="font-heading text-sm font-bold text-green-700">
					{testimonial.name}
				</p>
				<p className="font-handwritten mt-1 whitespace-pre-line text-lg leading-snug text-stone-700">
					{testimonial.message}
				</p>
				<div className="mt-2 flex items-center justify-end gap-1">
					<span className="text-[11px] text-stone-400">{time}</span>
					<CheckCheck size={14} className="text-sky-500" />
				</div>
			</div>
		</div>
	);
}

export function Testimonials() {
	const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

	useEffect(() => {
		apiFetch("/public/testimonials").then(({ status, body }) => {
			if (status === 200) setTestimonials(body?.data ?? []);
		});
	}, []);

	// Nothing fabricated to show in place of real content — hide the section
	// rather than display an empty or placeholder chat, matching the Stats
	// section's same "hide rather than show broken/fake" precedent.
	if (testimonials.length === 0) return null;

	return (
		<section
			id="testimoni"
			className="scroll-mt-20 bg-[#e7ddd0] py-16 px-4 text-center sm:px-6"
			style={{
				backgroundImage:
					"radial-gradient(circle at 1px 1px, rgba(21,128,61,0.08) 1px, transparent 0)",
				backgroundSize: "16px 16px",
			}}
		>
			<Reveal>
				<h2 className="font-heading text-3xl font-bold text-green-800 mb-10">
					Kata Mereka
				</h2>
			</Reveal>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
				{testimonials.map((t, i) => (
					<Reveal key={t.testimonialId} delayMs={i * 80}>
						<ChatBubble testimonial={t} />
					</Reveal>
				))}
			</div>
		</section>
	);
}
