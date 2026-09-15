import {
	BookMarked,
	BookOpen,
	BookOpenCheck,
	CalendarCheck2,
	FileText,
	Globe,
	GraduationCap,
	PencilLine,
	Video,
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

// One card's icon + name + description — shared between the video and
// plain-card layouts below. `sideBySide` flips text alignment to left
// (video sits to its right); the plain grid stays centered as before.
function SubjectInfo({
	subject,
	sideBySide,
}: {
	subject: PublicSubject;
	sideBySide: boolean;
}) {
	const Icon = SUBJECT_ICONS[subject.subjectName] ?? GraduationCap;
	return (
		<div
			className={`flex flex-col items-center text-center ${sideBySide ? "sm:items-start sm:text-left" : ""}`}
		>
			<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white text-green-700 shadow-sm">
				{subject.iconUrl ? (
					<img
						src={subject.iconUrl}
						alt=""
						className="h-full w-full object-cover"
					/>
				) : (
					<Icon size={22} />
				)}
			</div>
			<h4 className="mt-3 font-heading font-bold text-green-800">
				{subject.subjectName}
			</h4>
			{subject.description && (
				<p className="mt-2 text-base leading-relaxed text-stone-600">
					{subject.description}
				</p>
			)}
		</div>
	);
}

export function ProgramsFacilities() {
	const [subjects, setSubjects] = useState<PublicSubject[]>([]);

	useEffect(() => {
		apiFetch("/public/subjects").then(({ status, body }) => {
			if (status === 200) setSubjects(body?.data ?? []);
		});
	}, []);

	// Video-bearing subjects get their own row (2 per row, roomy enough for
	// icon+text beside the embed) instead of squeezing into the compact
	// 3-col grid below, which stays for subjects with no video to preview.
	const videoSubjects = subjects
		.map((s) => ({
			subject: s,
			embedUrl: s.videoUrl ? getYoutubeEmbedUrl(s.videoUrl) : null,
		}))
		.filter(
			(s): s is { subject: PublicSubject; embedUrl: string } => !!s.embedUrl,
		);
	const plainSubjects = subjects.filter(
		(s) => !s.videoUrl || !getYoutubeEmbedUrl(s.videoUrl),
	);

	return (
		<section
			id="programs-facilities"
			className="scroll-mt-20 bg-white px-4 py-16 text-center sm:px-6"
		>
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
			{videoSubjects.length > 0 && (
				<div className="mx-auto mt-5 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
					{videoSubjects.map(({ subject: s, embedUrl }, i) => (
						<Reveal key={s.subjectId} delayMs={i * 80}>
							<div className="flex h-full flex-col items-center gap-5 rounded-2xl border border-green-100 bg-green-50 p-6 text-left shadow-sm sm:flex-row">
								<SubjectInfo subject={s} sideBySide />
								<div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-black sm:w-56">
									<iframe
										src={embedUrl}
										title={`${s.subjectName} — video`}
										className="h-full w-full"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
									/>
								</div>
							</div>
						</Reveal>
					))}
				</div>
			)}
			<div
				className={`mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-3 ${videoSubjects.length > 0 ? "mt-6" : "mt-5"}`}
			>
				{plainSubjects.map((s, i) => (
					<Reveal key={s.subjectId} delayMs={i * 80}>
						<div className="h-full rounded-2xl border border-green-100 bg-green-50 p-6 shadow-sm">
							<SubjectInfo subject={s} sideBySide={false} />
						</div>
					</Reveal>
				))}
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
