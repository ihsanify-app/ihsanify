// Correct/wrong answer feedback sound — synthesized via the Web Audio API,
// not a sound file: reference/assets/manifest.json confirms the reference
// sites ship no audio assets either, so their own answer SFX is almost
// certainly generated the same way.
let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	// Safari still only exposes the prefixed constructor.
	const Ctor: typeof AudioContext | undefined =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext;
	if (!Ctor) return null;
	if (!sharedContext) sharedContext = new Ctor();
	return sharedContext;
}

function playTone(
	ctx: AudioContext,
	frequency: number,
	startTime: number,
	duration: number,
	type: OscillatorType,
	peakGain: number,
) {
	const oscillator = ctx.createOscillator();
	const gain = ctx.createGain();
	oscillator.type = type;
	oscillator.frequency.value = frequency;
	oscillator.connect(gain);
	gain.connect(ctx.destination);
	// Quick fade in/out avoids an audible click at the start/end of the tone.
	gain.gain.setValueAtTime(0, startTime);
	gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
	oscillator.start(startTime);
	oscillator.stop(startTime + duration);
}

export function playFeedbackSound(correct: boolean) {
	const ctx = getAudioContext();
	if (!ctx) return;
	// Browsers suspend a newly-created AudioContext until a user gesture —
	// this is always called from an answer-button click handler, so resuming
	// here is synchronous with that gesture rather than a separate request.
	if (ctx.state === "suspended") ctx.resume();

	const now = ctx.currentTime;
	if (correct) {
		// Short rising two-note chime.
		playTone(ctx, 880, now, 0.12, "sine", 0.15);
		playTone(ctx, 1318.5, now + 0.09, 0.18, "sine", 0.15);
	} else {
		// A single low buzz.
		playTone(ctx, 180, now, 0.22, "sawtooth", 0.1);
	}
}
