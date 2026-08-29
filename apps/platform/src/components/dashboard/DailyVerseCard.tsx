import { BookOpenText } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiClient";

type DailyVerse = {
	reference: string;
	arabic: string;
	english: string;
	indonesian: string;
};

export function DailyVerseCard() {
	const [verse, setVerse] = useState<DailyVerse | null>(null);

	useEffect(() => {
		apiFetch("/public/daily-verse").then(({ status, body }) => {
			if (status !== 200) return;
			setVerse(body?.data ?? null);
		});
	}, []);

	if (!verse) return null;

	return (
		<div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
			<h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-green-700">
				<BookOpenText size={14} />
				Verse of the Day
			</h2>
			<p
				dir="rtl"
				lang="ar"
				className="mt-3 text-right text-lg leading-relaxed text-stone-800"
			>
				{verse.arabic}
			</p>
			<p className="mt-2 text-xs leading-relaxed text-stone-600">
				{verse.english}
			</p>
			<p className="mt-1 text-xs leading-relaxed text-stone-500 italic">
				{verse.indonesian}
			</p>
			<p className="mt-2 text-[12px] font-medium text-green-700">
				{verse.reference}
			</p>
		</div>
	);
}
