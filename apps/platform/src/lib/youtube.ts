// Parses a YouTube video ID out of whatever URL shape an admin pastes
// (watch?v=, youtu.be/, embed/, with or without extra query params like
// &t=30s). Returns null for anything that doesn't resolve to a valid
// 11-character ID — callers treat that the same as no video at all, never
// as an error to surface, so a malformed paste just quietly shows no
// "Watch" button instead of a broken embed.
const VIDEO_ID_PATTERN = /^[\w-]{11}$/;

export function extractYoutubeVideoId(rawUrl: string): string | null {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		return null;
	}

	const host = url.hostname.replace(/^www\.|^m\./, "");
	let candidate: string | null = null;

	if (host === "youtu.be") {
		candidate = url.pathname.slice(1);
	} else if (host === "youtube.com" || host === "youtube-nocookie.com") {
		if (url.pathname === "/watch") {
			candidate = url.searchParams.get("v");
		} else if (url.pathname.startsWith("/embed/")) {
			candidate = url.pathname.slice("/embed/".length);
		} else if (url.pathname.startsWith("/shorts/")) {
			candidate = url.pathname.slice("/shorts/".length);
		}
	}

	if (!candidate) return null;
	// Strip anything after the ID itself (e.g. a trailing path segment).
	candidate = candidate.split(/[/?&]/)[0];
	return VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
}

export function getYoutubeEmbedUrl(rawUrl: string): string | null {
	const videoId = extractYoutubeVideoId(rawUrl);
	if (!videoId) return null;
	return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
