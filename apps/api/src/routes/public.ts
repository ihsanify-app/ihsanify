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
