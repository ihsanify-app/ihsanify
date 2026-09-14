import {
	BookMarked,
	BookOpen,
	BookOpenCheck,
	CalendarCheck2,
	FileText,
	Globe,
	GraduationCap,
	PencilLine,
	PlayCircle,
	Video,
	X,
} from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { getYoutubeEmbedUrl } from "../../lib/youtube";
import { Reveal } from "./Reveal";

// lucide-react's "Languages" icon depicts a CJK character (文) next to a
// Latin "A" — visually reads as Mandarin, not Arabic. No Arabic-script icon
// exists in lucide, so render the letter itself instead, sized to match.
function ArabicLetterIcon({ size = 24 }: { size?: number }) {
	return (
		<span
			dir="rtl"
			lang="ar"
			className="font-bold leading-none"
			style={{ fontSize: size }}
		>
			ا
		</span>
	);
}

// Subject content (title, description) comes from Settings → Subject —
// icons stay hardcoded here since there's no icon field in the data model,
// keyed by name with a generic fallback for anything not in this list
// (e.g. a newly-added subject, or a combined one like "Tahsin & Tahfizh").
const SUBJECT_ICONS: Record<string, ComponentType<{ size?: number }>> = {
	Tahsin: BookOpen,
	Tahfizh: BookMarked,
	"Bahasa Arab": ArabicLetterIcon,
	"Bahasa Inggris": Globe,
	Calistung: PencilLine,
};

const FACILITIES = [
	{
		icon: Video,
		title: "Zoom Premium",
		description: "Sesi belajar tatap muka online tanpa batas waktu.",
	},
	{
		icon: FileText,
		title: "Aplikasi Learning Management System",
		description:
			"Laporan perkembangan belajar, ujian, dan invoice pembayaran — semua dalam satu aplikasi.",
	},
];

type PublicSubject = {
	subjectId: string;
	subjectName: string;
	description: string | null;
	iconUrl: string | null;
	videoUrl: string | null;
};

// Class-documentation video, opened from a subject card's "Watch" button.
// A modal keeps the visitor on this page (and their scroll position) rather
// than navigating away into YouTube's own UI — see PLAN.md/conversation for
// why this beat replacing the icon or a separate gallery section.
function VideoModal({
	embedUrl,
	subjectName,
	onClose,
}: {
	embedUrl: string;
	subjectName: string;
	onClose: () => void;
}) {
	return (
		<div
			role="dialog"
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4"
			onClick={onClose}
		>
			<div
				role="dialog"
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				className="w-full max-w-2xl rounded-2xl bg-white p-3 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-2 flex items-center justify-between px-1">
					<p className="font-heading font-bold text-green-800">{subjectName}</p>
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer text-stone-400 hover:text-stone-600"
						aria-label="Close"
					>
						<X size={20} />
					</button>
				</div>
				<div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
					<iframe
						src={embedUrl}
						title={`${subjectName} — video`}
						className="h-full w-full"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					/>
				</div>
			</div>
		</div>
	);
}

export function ProgramsFacilities() {
	const [subjects, setSubjects] = useState<PublicSubject[]>([]);
	const [watchingSubject, setWatchingSubject] = useState<PublicSubject | null>(
		null,
	);

	useEffect(() => {
		apiFetch("/public/subjects").then(({ status, body }) => {
			if (status === 200) setSubjects(body?.data ?? []);
		});
	}, []);

	const watchingEmbedUrl = watchingSubject?.videoUrl
		? getYoutubeEmbedUrl(watchingSubject.videoUrl)
		: null;

	return (
		<section
			id="programs-facilities"
			className="scroll-mt-20 bg-white px-4 py-16 text-center sm:px-6"
		>
			{watchingSubject && watchingEmbedUrl && (
				<VideoModal
					embedUrl={watchingEmbedUrl}
					subjectName={watchingSubject.subjectName}
					onClose={() => setWatchingSubject(null)}
				/>
			)}
			<Reveal>
				<h2 className="font-heading text-3xl font-bold text-green-800">
					Program & Fasilitas
				</h2>
			</Reveal>

			<Reveal delayMs={100}>
				<h3 className="mt-10 flex items-center justify-center gap-2 font-heading text-lg font-bold text-green-800">
					<BookOpenCheck size={20} className="text-green-600" />
					Program Belajar
				</h3>
			</Reveal>
			<div className="mx-auto mt-5 grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
				{subjects.map((s, i) => {
					const Icon = SUBJECT_ICONS[s.subjectName] ?? GraduationCap;
					const canWatch = s.videoUrl && getYoutubeEmbedUrl(s.videoUrl);
					return (
						<Reveal key={s.subjectId} delayMs={i * 80}>
							<div className="relative h-full rounded-2xl border border-green-100 bg-green-50 p-6 shadow-sm">
								{canWatch && (
									<button
										type="button"
										onClick={() => setWatchingSubject(s)}
										className="absolute right-3 top-3 flex items-center gap-1 cursor-pointer rounded-full bg-white px-2 py-1 text-xs font-semibold text-green-700 shadow-sm hover:bg-green-100 transition-colors"
									>
										<PlayCircle size={14} />
										Preview Class
									</button>
								)}
								<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white text-green-700 shadow-sm">
									{s.iconUrl ? (
										<img
											src={s.iconUrl}
											alt=""
											className="h-full w-full object-cover"
										/>
									) : (
										<Icon size={22} />
									)}
								</div>
								<h4 className="mt-3 font-heading font-bold text-green-800">
									{s.subjectName}
								</h4>
								{s.description && (
									<p className="mt-2 text-base leading-relaxed text-stone-600">
										{s.description}
									</p>
								)}
							</div>
						</Reveal>
					);
				})}
			</div>

			<Reveal delayMs={100}>
				<h3 className="mt-14 font-heading text-lg font-bold text-green-800">
					Fasilitas
				</h3>
			</Reveal>
			<div className="mx-auto mt-5 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
				{FACILITIES.map((f, i) => (
					<Reveal key={f.title} delayMs={i * 100}>
						<div className="flex h-full items-start gap-4 rounded-2xl border border-green-100 bg-green-50 p-6 text-left shadow-sm">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-green-700 shadow-sm">
								<f.icon size={22} />
							</div>
							<div>
								<h4 className="font-heading font-bold text-green-800">
									{f.title}
								</h4>
								<p className="mt-1 text-base leading-relaxed text-stone-600">
									{f.description}
								</p>
							</div>
						</div>
					</Reveal>
				))}
			</div>

			<Reveal delayMs={200}>
				<div className="mx-auto mt-10 inline-flex items-center gap-2 rounded-full bg-amber-100 px-5 py-2.5 text-base font-medium text-amber-800">
					<CalendarCheck2 size={18} />
					Jadwal Fleksibel — 4x atau 8x pertemuan sebulan, sesuai kesepakatan
				</div>
			</Reveal>
		</section>
	);
}
