// Word-pronunciation audio, on demand (speaker button), via the browser's
// built-in text-to-speech — not a sound file. Confirmed via
// reference/assets/manifest.json that the reference sites ship no audio
// assets at all, so their own speaker icon almost certainly does the same.
export function speak(text: string, lang: string) {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
	// Cancel any utterance still playing so a rapid double-tap doesn't queue
	// up and read the word twice in a row.
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = lang;
	window.speechSynthesis.speak(utterance);
}
