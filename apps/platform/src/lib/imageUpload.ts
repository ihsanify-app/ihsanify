// Shared client-side helpers for base64 data-URL image uploads — used
// wherever an admin uploads an image stored as User.avatarUrl or
// Subject.iconUrl. Kept in sync with MAX_IMAGE_BYTES in the API's
// utils/imageValidation.ts, which enforces the same cap server-side.
export const MAX_IMAGE_BYTES = 300 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
];

export function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}
