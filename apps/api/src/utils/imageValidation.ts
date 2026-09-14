// Shared validation for base64 data-URL image uploads — used by both
// User.avatarUrl and Subject.iconUrl (Settings → User / Settings → Subject).
// A single small size cap keeps every uploaded image (stored inline as a
// data URL, not a file) cheap to fetch and render everywhere it's reused.
export const MAX_IMAGE_BYTES = 300 * 1024;
const IMAGE_DATA_URL_PATTERN =
	/^data:image\/(png|jpe?g|webp|gif);base64,([a-zA-Z0-9+/]+=*)$/;

export function isValidImageDataUrl(value: string): boolean {
	const match = IMAGE_DATA_URL_PATTERN.exec(value);
	if (!match) return false;
	const base64 = match[2];
	const approxBytes = (base64.length * 3) / 4;
	return approxBytes <= MAX_IMAGE_BYTES;
}
