import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";

type PublicTeacher = {
	teacherId: string;
	nickname: string;
	publicTitle: string | null;
	publicBio: string;
	avatarUrl: string | null;
	subjects: string[];
};

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

function TeacherCard({ teacher }: { teacher: PublicTeacher }) {
	return (
		<div className="flex h-full flex-col items-center gap-3 rounded-2xl bg-forest p-6 text-center shadow-sm">
			<div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-white text-emerald shadow-sm flex items-center justify-center font-heading font-bold text-lg">
				{teacher.avatarUrl ? (
					<img
						src={teacher.avatarUrl}
						alt={teacher.nickname}
						className="h-full w-full object-cover"
					/>
				) : (
					initials(teacher.nickname)
				)}
			</div>
			<div>
				<h3 className="font-heading font-bold text-white">
					{teacher.nickname}
					{teacher.publicTitle && (
						<span className="font-normal">, {teacher.publicTitle}</span>
					)}
				</h3>
			</div>
			{teacher.subjects.length > 0 && (
				<div className="flex flex-wrap justify-center gap-1.5">
					{teacher.subjects.map((s) => (
						<span
							key={s}
							className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald border border-cream-2"
						>
							{s}
						</span>
					))}
				</div>
			)}
			<p className="text-base leading-relaxed text-green-100">
				{teacher.publicBio}
			</p>
		</div>
	);
}

export function Teachers() {
	const [teachers, setTeachers] = useState<PublicTeacher[]>([]);

	useEffect(() => {
		apiFetch("/public/teachers").then(({ status, body }) => {
			if (status === 200) setTeachers(body?.data ?? []);
		});
	}, []);

	// Same precedent as Testimonials/Stats: nothing fabricated to show in
	// place of real content — hide the section rather than a broken or
	// placeholder-filled one.
	if (teachers.length === 0) return null;

	return (
		<section
			id="teachers"
			className="scroll-mt-20 bg-white px-4 py-16 text-center sm:px-6"
		>
			<Reveal>
				<Eyebrow className="mb-3">Tim Kami</Eyebrow>
				<h2 className="font-heading text-3xl font-bold text-emerald">
					Pengajar Kami
				</h2>
			</Reveal>
			<Reveal delayMs={80}>
				<p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-stone-700">
					Dibimbing langsung oleh pengajar yang berpengalaman dan amanah.
				</p>
			</Reveal>
			<div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{teachers.map((t, i) => (
					<Reveal key={t.teacherId} delayMs={140 + i * 80}>
						<TeacherCard teacher={t} />
					</Reveal>
				))}
			</div>
		</section>
	);
}
