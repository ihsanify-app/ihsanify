import { Hono } from "hono";
import { prisma } from "../utils/prisma";

// Aggregate counts only, no PII — safe to expose without auth for the
// public landing page.
export const publicRouter = new Hono();

publicRouter.get("/public/stats", async (c) => {
	const [teacherCount, studentCount, subjectCount, sessionDuration] =
		await Promise.all([
			prisma.teacher.count(),
			prisma.student.count(),
			prisma.subject.count(),
			prisma.session.aggregate({ _sum: { durationMinutes: true } }),
		]);

	return c.json({
		success: true,
		data: {
			teacherCount,
			studentCount,
			subjectCount,
			totalSessionHours: Math.round(
				(sessionDuration._sum.durationMinutes ?? 0) / 60,
			),
		},
	});
});

// Just the logo, no PII — safe to expose without auth so the public landing
// page (and the app's favicon) can reuse the same branding image configured
// in Settings → Report, instead of maintaining a separate copy.
publicRouter.get("/public/branding", async (c) => {
	const settings = await prisma.reportSettings.findFirst();
	return c.json({
		success: true,
		data: { logoUrl: settings?.logoUrl ?? null },
	});
});

// Admin-authored content meant to be shown publicly, so the read side needs
// no auth — same endpoint serves both the landing page and the Settings →
// Landing management page. Only create/update/delete (testimonials.ts) are
// admin-gated.
publicRouter.get("/public/testimonials", async (c) => {
	const testimonials = await prisma.testimonial.findMany({
		orderBy: { givenAt: "desc" },
	});
	return c.json({
		success: true,
		data: testimonials.map((t) => ({
			testimonialId: t.id,
			name: t.name,
			message: t.message,
			givenAt: t.givenAt.toISOString(),
			createdAt: t.createdAt.toISOString(),
		})),
	});
});

// Public feed for the landing page's Instagram marquee. The source of truth
// is a hand-maintained JSON file hosted at a public Dropbox direct-download
// link (INSTAGRAM_POSTS_JSON_URL) — no Instagram API, no DB table, no cron
// job. Expected shape at that URL:
//   [{ "imageUrl": "https://.../poster1.jpg?raw=1",
//      "permalink": "https://www.instagram.com/p/XXXXXXXXX/",
//      "caption": "optional text" }, ...]
// Cached in memory for CACHE_TTL_MS so a burst of page views doesn't hit
// Dropbox on every request — Dropbox throttles public links that see heavy
// traffic, serving a "this link is generating a lot of traffic" page instead
// of the file if hit too often.
type DropboxPost = { imageUrl: string; permalink: string; caption?: string };
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cache: { posts: DropboxPost[]; fetchedAt: number } | null = null;

publicRouter.get("/public/instagram-posts", async (c) => {
	const sourceUrl = process.env.INSTAGRAM_POSTS_JSON_URL;
	const isStale = !cache || Date.now() - cache.fetchedAt > CACHE_TTL_MS;

	if (sourceUrl && isStale) {
		try {
			const res = await fetch(sourceUrl);
			if (res.ok) {
				const posts = (await res.json()) as DropboxPost[];
				cache = { posts, fetchedAt: Date.now() };
			} else {
				console.error("[instagram-posts] fetch failed:", res.status);
			}
		} catch (err) {
			console.error("[instagram-posts] fetch failed:", err);
		}
	}

	const posts = cache?.posts ?? [];
	return c.json({
		success: true,
		data: posts.slice(0, 10).map((p, i) => ({
			id: String(i),
			imageUrl: p.imageUrl,
			permalink: p.permalink,
			caption: p.caption ?? null,
		})),
	});
});

// "Verse of the Day" on the Dashboard. Text/translations are fetched live
// from api.alquran.cloud (free, no API key) rather than hand-typed, since
// accuracy of Arabic scripture shouldn't depend on what could be reliably
// recalled from memory. Only a small pool of candidate ayahs rotates by
// day-of-year — chosen for being short and meaningful standalone (not
// mid-narrative/legal-context verses that read oddly in isolation) — but the
// actual text/translation always comes from the API, not this list.
// Cached per calendar day so repeated dashboard loads don't hit the external
// API on every request; falls back to the last good cache, or a small
// hand-checked static verse if that's empty too, if the API is unreachable —
// this feature should never be the reason the Dashboard breaks.
const VERSE_REFERENCES = [
	"1:2",
	"2:153",
	"10:57",
	"13:28",
	"14:7",
	"16:97",
	"94:1",
	"94:5",
	"94:6",
	"103:1",
	"103:2",
	"103:3",
	"112:1",
	"112:2",
];

type DailyVerse = {
	reference: string;
	arabic: string;
	english: string;
	indonesian: string;
};

const FALLBACK_VERSE: DailyVerse = {
	reference: "QS. Ash-Sharh 94:5",
	arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
	english: "For indeed, with hardship [will be] ease.",
	indonesian: "Maka sesungguhnya bersama kesulitan ada kemudahan.",
};

let verseCache: { dateKey: string; verse: DailyVerse } | null = null;

function dayOfYear(date: Date) {
	const start = new Date(date.getFullYear(), 0, 0);
	return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

publicRouter.get("/public/daily-verse", async (c) => {
	const now = new Date();
	const dateKey = now.toISOString().slice(0, 10);

	if (verseCache?.dateKey === dateKey) {
		return c.json({ success: true, data: verseCache.verse });
	}

	const reference = VERSE_REFERENCES[dayOfYear(now) % VERSE_REFERENCES.length];

	try {
		const res = await fetch(
			`https://api.alquran.cloud/v1/ayah/${reference}/editions/quran-uthmani,en.sahih,id.indonesian`,
		);
		if (!res.ok) throw new Error(`alquran.cloud returned ${res.status}`);
		const json = (await res.json()) as {
			data: {
				text: string;
				numberInSurah: number;
				surah: { number: number; englishName: string };
			}[];
		};
		const [arabicEd, englishEd, indonesianEd] = json.data;
		const verse: DailyVerse = {
			reference: `QS. ${arabicEd.surah.englishName} ${arabicEd.surah.number}:${arabicEd.numberInSurah}`,
			arabic: arabicEd.text,
			english: englishEd.text,
			indonesian: indonesianEd.text,
		};
		verseCache = { dateKey, verse };
		return c.json({ success: true, data: verse });
	} catch (err) {
		console.error("[daily-verse] fetch failed:", err);
		return c.json({
			success: true,
			data: verseCache?.verse ?? FALLBACK_VERSE,
		});
	}
});
