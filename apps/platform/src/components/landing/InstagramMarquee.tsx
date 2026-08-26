import { Instagram } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";

// Shown until the weekly Instagram sync has produced real posts.
const PLACEHOLDER_POSTS = [
	{
		id: 1,
		label: "Kajian Akbar: Adab Menuntut Ilmu",
		gradient: "from-pink-400 via-rose-400 to-orange-400",
	},
	{
		id: 2,
		label:
			"“Sebaik-baik kalian adalah yang belajar Al-Qur'an dan mengajarkannya”",
		gradient: "from-purple-400 via-fuchsia-400 to-pink-400",
	},
	{
		id: 3,
		label: "Pendaftaran Gelombang Baru Dibuka",
		gradient: "from-indigo-400 via-purple-400 to-pink-400",
	},
	{
		id: 4,
		label: "Testimoni Wali Murid Bulan Ini",
		gradient: "from-amber-400 via-orange-400 to-rose-400",
	},
	{
		id: 5,
		label: "Jadwal Libur Semester",
		gradient: "from-emerald-400 via-teal-400 to-cyan-400",
	},
	{
		id: 6,
		label: "Tips Mendidik Anak Cinta Al-Qur'an",
		gradient: "from-fuchsia-400 via-pink-400 to-red-400",
	},
];

type RealPost = {
	id: string;
	imageUrl: string;
	permalink: string;
	caption: string | null;
};

type MarqueeCard =
	| ({ kind: "real" } & RealPost)
	| { kind: "placeholder"; id: number; label: string; gradient: string };

function PlaceholderCard({
	label,
	gradient,
}: {
	label: string;
	gradient: string;
}) {
	return (
		<div
			className={`flex h-52 w-40 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl bg-linear-to-br p-4 text-center text-white shadow-md sm:h-60 sm:w-44 ${gradient}`}
		>
			<Instagram size={26} />
			<span className="text-sm font-semibold leading-snug">{label}</span>
		</div>
	);
}

function RealPostCard({ post }: { post: RealPost }) {
	return (
		<a
			href={post.permalink}
			target="_blank"
			rel="noopener noreferrer"
			className="group relative h-52 w-40 shrink-0 overflow-hidden rounded-2xl shadow-md sm:h-60 sm:w-44"
		>
			<img
				src={post.imageUrl}
				alt={post.caption ?? "Postingan Instagram"}
				className="h-full w-full object-cover transition-transform group-hover:scale-105"
			/>
		</a>
	);
}

export function InstagramMarquee() {
	const [posts, setPosts] = useState<RealPost[]>([]);

	useEffect(() => {
		apiFetch("/public/instagram-posts").then(({ status, body }) => {
			if (status === 200 && Array.isArray(body?.data)) setPosts(body.data);
		});
	}, []);

	const baseCards: MarqueeCard[] =
		posts.length > 0
			? posts.map((p) => ({ kind: "real" as const, ...p }))
			: PLACEHOLDER_POSTS.map((p) => ({ kind: "placeholder" as const, ...p }));
	const items = [...baseCards, ...baseCards];

	return (
		<section className="overflow-hidden bg-white py-10">
			<div className="mb-5 flex items-center justify-center gap-2 px-4">
				<Instagram size={18} className="text-pink-500" />
				<p className="text-sm font-medium text-stone-500">
					Update terbaru dari Instagram kami
				</p>
			</div>
			<div className="relative mx-4 border-x-2 border-green-100 sm:mx-6">
				<div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-white to-transparent sm:w-20" />
				<div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-white to-transparent sm:w-20" />
				<div className="overflow-hidden">
					<div className="flex w-max gap-4 px-4 animate-marquee-right">
						{items.map((card, i) => {
							const key = `${card.kind}-${card.id}-${i}`;
							return card.kind === "real" ? (
								<RealPostCard key={key} post={card} />
							) : (
								<PlaceholderCard
									key={key}
									label={card.label}
									gradient={card.gradient}
								/>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
