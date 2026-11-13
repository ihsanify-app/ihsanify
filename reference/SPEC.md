# Reference spec — Tim Sebentar learning games

Reverse-engineered from the three live apps below, for use as a design/content reference when building Ihsanify's own maths/Arabic/English learning games. Research only — no app code was written or changed as part of this document.

Sources:
- English: https://sebentar-engindo.netlify.app/
- Maths: https://sebentar-kalibagi.netlify.app/
- Arabic: https://sebentar-arabindo.netlify.app/

Method: Playwright (Chromium), viewports 1440 / 768 / 390px, full-page screenshots after a slow manual scroll (to force any lazy content), plus `getComputedStyle` sampling, inline CSS source inspection (`<style>` was fully inlined in the HTML — no external stylesheet), inline JS source inspection (one ~110KB inlined bundle, no external framework script), and a hover-vs-active probe on representative buttons. Screenshots: `reference/screenshots/{engindo,kalibagi,arabindo}-{1440,768,390}.png`.

**Important finding that shapes how to read this doc**: each site is a single-page app where *every screen already exists in the initial HTML*, hidden with `display:none` until the inline JS toggles it (confirmed by walking the DOM — settings, weekly report, level-up modal, trophy modal, shortcut-install modal, rewards shelf, achievement-card modal were all present but hidden on first load). What the screenshots show is only the **entry/home screen** (the one a visitor actually lands on). Sections 1–3 below cover that entry screen in full per the task; section 4 of each site adds a short "rest of the app" map discovered from the hidden markup, since it's directly useful for scoping a similar game but wasn't separately screenshotted or interacted with.

---

## Shared design system (identical across all 3 sites)

All three sites ship byte-for-byte identical CSS custom properties, font files, and nearly identical component CSS (see per-site diffs below) — this is clearly one shared template/design system with per-subject content swapped in, not three independently designed sites. Build this once, not three times.

### Colors (CSS custom properties, `:root`)

| Token | Value | Apparent use |
|---|---|---|
| `--ink` | `#1f1b3a` | Primary text, all borders, all hard shadows (default) |
| `--paper` | `#ffffff` | Page/card background |
| `--soft` | `#f3f1fb` | Secondary panel background (pale lavender) |
| `--muted` | `#6b6690` | Secondary/caption text |
| `--blue` | `#2d8cff` | Accent — "direction A" (e.g. EN→ID), info |
| `--red` | `#ff4f6d` | Accent — "direction B" (e.g. ID→EN) |
| `--purple` | `#8a5cf6` | Accent — "mixed" mode, modal shadow |
| `--green` | `#16c98d` | Primary CTA fill (same as `--good`) |
| `--green-d` | `#0fa874` | Green pressed/darker variant |
| `--good` | `#16c98d` | Correct-answer state |
| `--bad` | `#ff3b4f` | Wrong-answer state |
| `--orange` | `#ff8a3d` | Warm accent (used sparingly) |
| `--yellow` | `#ffc93c` | Warm accent / trophy badge fill |
| `--wa` | `#25d366` | WhatsApp-brand green, used only for "send report via WhatsApp" buttons |
| `--c1`…`--c5` | `#ffe08a` `#ffb8c6` `#aed6ff` `#cdbcff` `#b8f0d8` | Pastel tint set — cycled across the 4 answer-choice buttons and mode-icon backgrounds (yellow/pink/blue/purple/green pastels) |

Per-site variation: the *shadow color* on the first mode card differs by subject — blue on English (`en2id`), blue on Maths (`perkalian`), but **green** on Arabic (`arab2id`) instead of blue. Everything else in the palette is identical.

### Typography

- Display font: **Bungee** (self-hosted `fonts/bungee.woff2`, weight 400 only), fallback `"Arial Black", Impact, sans-serif`. Used for the big chunky title/logo and in-card headings only.
- Body font: **Fredoka** (self-hosted, 3 static weights: `fredoka-500.woff2`, `fredoka-600.woff2`, `fredoka-700.woff2`), fallback `"Nunito","Trebuchet MS",system-ui,sans-serif`. Used for everything else (body text, buttons, inputs). `font-display:block` on all 4 faces (no FOUT fallback period — text is invisible briefly rather than showing a fallback face, a deliberate brand-consistency choice for a game this font-identity-driven).
- No Google Fonts or other CDN — fonts are bundled with the app (works fully offline, consistent with the PWA setup below).
- Font sizes in use (entry screen + shared chrome): 10.5, 12, 13, 14, 15, 16, 17, 20, 22, 24, 26, 32, 50, 72px. No modular scale is obvious; sizes look hand-picked per component rather than derived from a type ramp.
- Font weights in use: 400 (display font, which is already visually "bold" by design), 500, 600 (body default), 700 (emphasis/buttons).

### Spacing

No fixed spacing scale (no 4/8px grid discipline) — instead, nearly all gaps/padding use **`clamp(min, Nvh, max)`**, e.g. `gap:clamp(14px,4vh,40px)`, `padding:clamp(6px,1.2vh,13px) 14px`. This is a fluid, viewport-**height**-driven system, not the usual width-driven responsive scale — see "Responsive strategy" below for why. A few fixed small gaps exist for tight inline rows: `4px, 6px, 8px, 10px` are the most common literal gap values.

### Border radius

In use: `6, 8, 10, 11, 12, 14, 16, 18, 20, 24px`, plus `50%` (circular icon buttons) and `99px` (pill buttons/chips). No single consistent scale — radius roughly scales with component size (small chip → 99px pill; icon button → 11px; card/sheet → 24px).

### Shadows — the signature look

Every interactive surface uses a **hard-edged offset shadow**, never blurred: `box-shadow: Npx Npx 0 <color>`. Offsets seen: `2px 2px`, `3px 3px`, `4px 4px`, `5px 5px`, `8px 8px`. Shadow color is usually `--ink` (default) but switches to the component's accent color for emphasis (blue/red/purple/green). This plus 2-4px solid `--ink` borders on nearly everything is what gives the whole UI its "neo-brutalist / chunky sticker" look.

**The interaction pattern (same on every button/card/chip, confirmed via `:active` CSS, not JS)**: at rest, a button sits with its hard shadow fully offset; on `:active` it does `transform: translate(Npx, Npx)` by (very nearly) the shadow's own offset and the shadow shrinks to `1px 1px 0` — visually, the whole element presses down flat into its own shadow. This is the *only* interaction state present: there is no hover effect at all (confirmed empirically — hovered a button and diffed computed `backgroundColor`/`boxShadow`/`transform` before and after; identical). Makes sense for a touch-first kids' game; don't bother designing hover states for the equivalent buttons.

### Responsive strategy — height-based, not width-based

The `@media` breakpoints actually found in the CSS are almost all about **viewport height and orientation**, not width: `(orientation: portrait), (min-height: 541px)`, `(max-height: 600px)`, `(max-height: 700px)`, `(max-height: 620px)`, `(max-height: 540px) and (orientation: landscape)`, plus `(prefers-reduced-motion: reduce)`. Combined with `body{overflow:hidden}` and `.app{...}` sized to fill the screen, the whole point of the design is **"always fit exactly one screen, never scroll"** — scaling itself to short/landscape phone viewports via `clamp(..., vh, ...)` rather than reflowing a scrollable page. The one exception is the entry/home screen (`.home{overflow-y:auto}`), which is allowed to scroll *only* if content genuinely doesn't fit (e.g. a very short landscape window) — never as the default experience. This is a meaningfully different responsive philosophy than Ihsanify's own marketing pages (which are normal scrolling pages with width breakpoints) — worth deciding explicitly before building, since "fit one screen, no scroll" is a much bigger structural commitment than copying colors/fonts.

### Animation — plain CSS only, no JS library

No GSAP/Framer Motion/Lenis/AOS/anime.js/etc. detected (checked `window` globals, `data-aos`/`data-scroll`/Framer data-attributes, and the single inlined ~110KB JS bundle — all motion is CSS `@keyframes` + `transition`, driven by the app's own vanilla JS toggling classes). Full keyframe inventory (10 of 11 shared verbatim across all 3 sites; the 11th mascot keyframe differs by subject):

| Keyframe | Definition (abridged) | Used for |
|---|---|---|
| `pop` | `from{scale(.6);opacity:0} to{none;opacity:1}` | Modal/sheet entrance (0.45s, bouncy `cubic-bezier(.3,1.6,.5,1)`) |
| `popin` | `from{scale(0) rotate(-30deg)} to{none}` | Emphasis pop-in (e.g. a badge), 0.7s, bouncier `cubic-bezier(.3,1.8,.5,1)` |
| `nudge` | `25%{translateX(-6px)} 75%{translateX(6px)}` | Wrong-answer shake, applied to `.choice.wrong`, 0.4s |
| `shake` | `10/50/90%{translateX(-12px) rotate(-1.2deg)} 30/70%{translateX(12px) rotate(1.2deg)}` | Bigger whole-screen shake (`.app.shake`) — stronger wrong-answer feedback |
| `thumbUp` / `thumbPop` | Scale+rotate+opacity choreography from 0 | Floating "👍"-style reaction burst on correct answers |
| `fBad` / `fGood` | Opacity ramps (`0%→8%→60%` / `0%→12%→55%`) | Background flash tint on wrong/right answer (`.flash` full-screen div) |
| `spin` | `to{rotate(360deg)}` | Generic loading/spinner use |
| `rpPulse` | `50%{scale(1.35)}` | Attention pulse (weekly-report related chip) |
| `talk` (English, Arabic) / `blink` (Maths) | `50%{scale(1.12)}` (talk) | Mascot/speaker-icon micro-animation while audio plays — Maths doesn't speak words aloud, so it blinks instead of "talking" |

All of the above are globally disabled under `prefers-reduced-motion: reduce` (explicit rule turns off `.app.shake`, `.thumb`, `.burst::before`, `.choice.wrong`, `.speak.talking`) — worth replicating as an accessibility baseline.

Transition-only interactions (no keyframe, just CSS `transition`): progress-bar fill width (0.6s bouncy ease), answer-choice background color (0.15s linear ease), toast opacity fade (0.25s).

### PWA / shell details (not visual, but relevant if copying the approach)

Each site is a fully installable PWA: `manifest.webmanifest`, apple/standard touch icons, `theme-color`, `user-scalable=no`, `touch-action:manipulation`, `user-select:none` — reads and behaves like a native app shell, not a webpage, even before install. There's an in-app "Buat shortcut" (create shortcut) flow with its own instructional modal rather than relying on the browser's native install prompt UI.

---

## 1. English — `sebentar-engindo.netlify.app`

### Section inventory (entry screen, top to bottom)

The entire visible page is one `<section class="home">`, `display:flex; flex-direction:column; justify-content:center` (centers vertically when it fits; becomes top-aligned/scrollable only on very short viewports), `max-width:540px`, centered horizontally — i.e. it's a single centered card-like column, not a multi-section scrolling page:

1. **Brand block** (`.home-brand`, flex column, centered): app logo image → chunky two-tone display-font wordmark ("ENG" in blue, "-" neutral, "INDO" in red, via `.k`/`.d`/`.g` spans) → a name-entry widget (`.who`, CSS grid) that shows either a greeting chip row ("Halo, Teman! 👋 Ganti nama" / "📋 Raport") once a name is set, or a form (label "Siapa namamu?", text input, OK button, Cancel) on first visit → a trophy-count chip ("🏆 0/24 Trofi Juara").
2. **Mode picker** (`.home-actions` → `.op-grid`, CSS grid, one column): three large tappable option cards (`.op-btn`, flex row: icon badge + title + subtitle):
   - "INGGRIS → INDONESIA" / "Tebak arti bahasa Indonesianya" (blue accent, "EN" badge)
   - "INDONESIA → INGGRIS" / "Tebak bahasa Inggrisnya" (red accent, "ID" badge)
   - "CAMPURAN" / "Dua arah diacak" (purple accent, two-tone circular badge)
3. **Secondary actions row** (`.home-btns`, flex row, two pill buttons): "♥ Dukung" (support/donate link) and "📱 Buat shortcut" (install-shortcut button).
4. **Credit line** (`.credit`, plain text): "Dibuat oleh **Tim Sebentar** dan digratiskan untuk semua, Allahumma barik."
5. A small "Powered by Netlify" badge fixed bottom-right (Netlify's own injected widget, not part of the app's own design).

### Design tokens

Identical to the shared design system above. No English-specific token overrides found beyond the blue/red/purple accent mapping already listed.

### Rest-of-app map (discovered from hidden DOM, not separately screenshotted)

Behind the entry screen, the full game shell (`.app`, currently `display:none`) contains: a header with a home button, word-mark, and icon buttons; a `.status` section with an XP/level readout ("LVL 1 · Benih Kata · 0/80 XP" with a seedling sticker), a 2-up "Santai / Cepat" (untimed/timed) mode toggle, and a 4-up difficulty-tier row ("MUDAH/SEDANG/SULIT/SUPER", each showing its own sub-level); a `.play` quiz screen (question counter, right/wrong counters, a direction flag, the prompt word, a speaker button that "talks", and a 2×2 grid of 4 `.choice` buttons, pastel-colored, with right/wrong/dim states). Also present as hidden modals: level-up celebration (confetti burst, new rank name, prize), a "JUARA" (champion) screen for finishing all 10 levels with a shareable trophy card, a rewards/sticker shelf, a settings panel (child's name, question-category toggle), and a weekly progress report meant to be sent to a parent over WhatsApp (accuracy tiles, "needs practice" vs "improved" word lists, a "send via WhatsApp" button using the `--wa` green). There's a hidden `<canvas>` element, almost certainly used to rasterize the shareable achievement/report card images.

---

## 2. Maths — `sebentar-kalibagi.netlify.app`

### Section inventory

Structurally identical to English — same `.home` single-column layout, same brand block → name widget → trophy chip → 3-card mode picker → support row → credit line:

1. Brand block: wordmark "KALI" (blue) "-" "BAGI" (red) — "Kali" (multiply) / "Bagi" (divide) in Indonesian.
2. Mode picker, 3 cards: "PERKALIAN" / "1 × 1 sampai 10 × 10" (blue, "✕" badge); "PEMBAGIAN" / "100 : 10 sampai 1 : 1" (red, "∶" badge); "CAMPURAN" / "× dan ∶ diacak bersama" (purple, combined badge). Trophy count shown as "0/9" here — far fewer total trophies than the language games (9 vs 24), implying fewer difficulty tiers/levels for this subject.
3. Support row + credit line: identical copy and styling to English.

### Design tokens

Identical to the shared system. One CSS-only difference found in the source: Maths defines an unused `--reserve:0px` custom property (comment: "space reserved for an external badge, filled in automatically") that the other two sites don't declare — looks like a leftover/forward-compat hook rather than an active visual difference.

### Animation difference

Uses `blink` instead of `talk` for its mascot/speaker-style keyframe (`50%{scale(1.12)}` either way) — consistent with a maths game not having a "spoken word" to narrate.

### Rest-of-app map

Same shell structure as English (status/level header, mode + difficulty tiers, quiz card with 4-choice grid, modals for level-up/champion/rewards/settings/weekly report). Given the much smaller trophy total (9), this game likely has fewer difficulty tiers or a flatter level structure than the two language games (24 trophies each) — worth confirming before assuming all 3 games should share the exact same progression depth.

---

## 3. Arabic — `sebentar-arabindo.netlify.app`

### Section inventory

Same structure again:

1. Brand block: wordmark "ARAB" (green) "-" "INDO" (red).
2. Mode picker, 3 cards: "ARAB → INDONESIA" / "Tebak arti bahasa Indonesianya" (**green** accent here, not blue — "AR" badge); "INDONESIA → ARAB" / "Tebak bahasa Arabnya" (red, "ID" badge); "CAMPURAN" / "Dua arah diacak" (purple, two-tone badge). Trophy count "0/24", matching English.
3. Support row + credit line: identical.

### Design tokens

Identical to the shared system, including the full font/color set. The only observed difference from English is the first mode card's shadow/border accent color (`--green` instead of `--blue`) — a content choice (Arabic script direction / flag-color association, perhaps), not a different token set.

### Animation

Uses `talk` (same as English, not `blink`) — makes sense, Arabic vocabulary is spoken/narrated like English is.

### Rest-of-app map

Same shell as the other two; not independently re-verified beyond confirming the same hidden modal set exists in the DOM.

---

## Shared patterns — summary

- **One design system, three content skins.** Colors, fonts (self-hosted Bungee + Fredoka), spacing approach, border-radius scale, shadow style, and all 11 animation keyframes are shared verbatim (bar one mascot keyframe name). Build the look once as a shared base, then theme only the accent-color mapping and copy per subject.
- **No animation library, no framework fingerprint** (no React/Vue globals, no bundler-specific markers found) — everything is a single inlined HTML file with inline CSS and one inlined vanilla-JS bundle (~110KB). Whether Ihsanify's games should also go framework-free or use the existing TanStack Start + React stack is an open decision this spec deliberately doesn't make.
- **"Fit one screen, never scroll" is the core layout constraint**, achieved with `vh`-based `clamp()` sizing and height-based (not width-based) media queries — a different responsive philosophy than the rest of the Ihsanify marketing site, and the biggest structural decision to make explicitly before building rather than copying piecemeal.
- **Touch-only interaction model** — no hover states anywhere, only a shared "press into its own shadow" `:active` effect. Simplifies building for touch but means desktop mouse users get no hover affordance either (apparently an accepted trade-off in the source apps).
- **Per-subject differences found were content/copy and one accent color**, not structural — same component inventory (brand block, name entry, trophy chip, 3-card mode picker, support row, credit line on the entry screen; same status/mode/tier/quiz/modal shell behind it), same DOM class naming convention across all three (`op-btn`, `choice`, `sheet`, `toast`, etc.).
- **Trophy totals differ (24 vs 9)**, hinting the Maths game has a shallower level/tier structure than the two language games — don't assume identical progression depth for all 3 without checking what those tiers actually gate.
- Not investigated (out of scope for this pass): actual gameplay interaction once a mode is chosen, the exact level/XP scoring formula, and the weekly-report/WhatsApp-share mechanics beyond their visible UI — would need to actually play through a round of each game to extract those, which this research pass didn't do.
