export const ADMIN_WHATSAPP_NUMBER = import.meta.env
	.VITE_ADMIN_WHATSAPP_NUMBER as string | undefined;

if (!ADMIN_WHATSAPP_NUMBER) {
	console.error(
		"VITE_ADMIN_WHATSAPP_NUMBER is not set — registration WhatsApp links will be broken.",
	);
}

export function buildWhatsappUrl(message: string) {
	return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// "Tahsin" -> "Tahsin"; "Tahsin, Tahfizh" -> "Tahsin dan Tahfizh";
// "Tahsin, Tahfizh, Calistung" -> "Tahsin, Tahfizh, dan Calistung" — reads as
// a natural Indonesian list instead of a raw comma-joined string.
export function joinNaturally(items: string[]) {
	if (items.length <= 1) return items.join("");
	if (items.length === 2) return `${items[0]} dan ${items[1]}`;
	return `${items.slice(0, -1).join(", ")}, dan ${items[items.length - 1]}`;
}
