---
name: Ihsanify
description: The integrated LMS for Madrasatul 'Ilmin Naafi', an online Islamic learning center.
colors:
  primary: "#15803d"
  primary-deep: "#166534"
  primary-soft: "#f0fdf4"
  primary-border: "#dcfce7"
  neutral-ink: "#292524"
  neutral-muted: "#78716c"
  neutral-border: "#d6d3d1"
  neutral-paper: "#ffffff"
  accent-alert: "#e11d48"
  accent-alert-soft: "#fff1f2"
  accent-warning: "#f59e0b"
  accent-info: "#0369a1"
typography:
  display:
    fontFamily: "Baloo 2, Nunito, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-paper}"
    rounded: "{rounded.full}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  card:
    backgroundColor: "{colors.neutral-paper}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Ihsanify

## Overview

**Creative North Star: "The Nurturing Garden"**

Ihsanify reads as a place things are grown, not manufactured — a warm, patient, green-forward system built for parents deciding whether to trust their child's Quran education to this school, and for the teachers and staff who tend that education every day afterward. The palette is dominated by a single deep, muted green used with restraint against generous white and warm-stone space; nothing shouts, because trust isn't built by shouting. Corners are soft everywhere — pills for primary actions, gently rounded cards for content — and the system stays almost entirely flat, saving its one moment of visual drama (a soft colored glow) for the single most important action on a screen. Baloo 2's rounded, friendly letterforms carry every heading; Nunito carries everything you actually read.

**Key Characteristics:**
- Deep sage green as the singular brand signal — never diluted by a second competing hue
- Warm stone (not cool gray) for all neutral text and structure
- Flat-by-default surfaces; depth is earned, not decorative
- Generously rounded corners throughout — pills for action, soft rectangles for content
- Small, purposeful accent colors (rose, amber, sky) reserved strictly for status, never decoration

## Colors

The palette is built around one confident green, kept trustworthy rather than loud, with warm neutrals and three small, strictly functional status accents.

### Primary
- **Deep Sage Trust** (`#15803d`): the brand's one true color — headings, primary text on light backgrounds, active nav states, link color. Used deliberately sparingly outside of CTAs and headings; it signals importance by scarcity.
- **Deep Sage Trust — Shade** (`#166534`): hover/active state for primary green surfaces and the deepest heading weight.
- **Sage Mist** (`#f0fdf4`): the lightest tint, used only as full-section background wash (e.g. hero, alternating landing sections) — never as a text or border color.
- **Sage Whisper** (`#dcfce7`): the standard light border/badge-background tone — card borders, subtle highlight chips, avatar-circle fills.

### Neutral
- **Warm Charcoal** (`#292524`): primary body/heading text on white — never pure black.
- **Warm Stone** (`#78716c`): secondary/supporting text — captions, meta labels, placeholder copy.
- **Warm Stone Border** (`#d6d3d1`): default input and divider borders at rest (shifts to Deep Sage Trust on focus).
- **Paper White** (`#ffffff`): card and page background.

### Named Rules
**The One Green Rule.** Deep Sage Trust is the only color allowed to carry brand meaning. Every other hue on the page (rose, amber, sky) is a status signal, never a decorative choice — if a designer reaches for a second "brand-feeling" color, that's the tell something has gone off-system.

**The Warm Neutral Rule.** Neutrals are always Stone, never Gray. The codebase has some legacy Gray usage from earlier, less-refined pages — treat any `gray-*` class found during this redesign as a defect to fix, not a variant to preserve.

### Status Accents (functional only — see Do's and Don'ts)
- **Muted Rose Alert** (`#e11d48`, soft form `#fff1f2`): errors, destructive actions (delete/deactivate), validation failures.
- **Honey Amber** (`#f59e0b`): urgency/attention — unread badges, the one animated "act now" prompt (Log Attendance), warning banners.
- **Soft Sky Info** (`#0369a1`): informational/neutral actions — "view" affordances, read-only indicators. The quietest of the three accents.

## Typography

**Display Font:** Baloo 2 (with Nunito, system sans-serif fallback)
**Body Font:** Nunito (with system sans-serif fallback)

**Character:** Baloo 2's rounded terminals give every heading a friendly, unintimidating warmth appropriate for a school serving young children and their parents, without tipping into childish — it stays legible and confident at every weight. Nunito underneath is quietly efficient: humanist, highly readable at small sizes, never competing with the headings for attention.

### Hierarchy
- **Display** (Baloo 2, 700–800, `clamp(1.875rem, 5vw, 2.25rem)`, 1.25 line-height): landing-page hero headline and page-level H1s.
- **Headline** (Baloo 2, 700, 1.5rem–1.75rem, 1.3 line-height): section titles, card-group headers ("Payroll", "Teaching History").
- **Title** (Baloo 2, 700, 1.125rem–1.25rem, 1.4 line-height): card titles, modal headers, table section labels.
- **Body** (Nunito, 400, 0.875rem–1rem, 1.6 line-height): all running copy, form labels, table cell content. Keep prose blocks under ~70ch.
- **Label** (Nunito, 700, 0.75rem, 0.02em letter-spacing, uppercase on tab/status chips only): metadata, stat-card eyebrows, table headers.

### Named Rules
**The Heading-Font Discipline Rule.** Baloo 2 is reserved for `h1`–`h4` and nothing else — buttons, badges, and body copy stay in Nunito even when bold, so the display face keeps its impact instead of becoming wallpaper.

## Layout

Content areas are unconstrained full-width blocks inside role-based shells (a fixed sidebar + top bar for the authenticated app, a single scrolling anchor-nav page for the public site) rather than a fixed max-width grid — cards and tables stretch to their container. Spacing runs on Tailwind's default 4px-based scale, most commonly `gap-2`/`gap-4`/`gap-6` between siblings and `p-4`/`p-6` internal card padding, tightening to `p-3` on mobile. The public landing page is the one place a `max-w-*` constraint appears deliberately, to keep marketing copy readable (`max-w-xl`/`max-w-2xl` centered blocks). Responsive behavior collapses the sidebar to a bottom tab bar below the `lg` breakpoint and stacks multi-column layouts to single-column below `sm`/`md`.

## Elevation & Depth

Flat by default, confirmed as the intended model: cards sit on the page with a bare `shadow-sm` at most — enough to separate from the background, never enough to feel "lifted." The one deliberate exception is the single most important call-to-action per screen (the landing page's primary CTA, the urgent Log Attendance prompt), which gets a colored, brand-tinted glow shadow rather than a generic dark one. Modals/dialogs use a heavier `shadow-xl` to read clearly above their scrim.

### Shadow Vocabulary
- **Ambient** (`shadow-sm`): default resting state for every card, table container, and stat tile.
- **Signature Glow** (`shadow-lg`, colored — e.g. `shadow-green-600/20`): reserved for the single primary CTA on a screen. Never applied to more than one element at a time.
- **Modal** (`shadow-xl`): dialogs and popovers, which sit above a `bg-stone-900/50` scrim.

### Named Rules
**The One Glow Rule.** Only one element per screen may carry the Signature Glow. If two elements compete for it, that's a hierarchy problem to fix, not a reason to add a second glow.

## Shapes

Corners are soft and generous everywhere, scaling with a component's visual weight rather than following one fixed radius. Primary actions and avatar/icon circles go all the way to a pill (`rounded-full`) — the system's most recognizable shape signature. Structural containers (cards, modals, stat tiles) use a mid-size soft rectangle (`rounded-2xl`, 16px). Everyday controls — inputs, secondary buttons, small badges — sit one step down (`rounded-xl`, 12px). Borders, where present, are always 1px and always Warm Stone Border at rest, shifting straight to Deep Sage Trust on focus with no intermediate color.

## Components

### Buttons
- **Shape:** Primary actions are full pills (`rounded-full`, 9999px); secondary/utility buttons use `rounded-xl` (12px).
- **Primary:** Deep Sage Trust background, white text, bold Nunito, generous horizontal padding (`px-6`–`px-8`, `py-2.5`–`py-3.5`). The public landing page's primary CTA additionally carries the Signature Glow shadow.
- **Hover/Focus:** background steps to Deep Sage Trust — Shade; a `transition-colors` (never abrupt) on every interactive surface.
- **Secondary/Ghost:** Warm Stone Border outline, Warm Stone text, hover fills to a very light neutral background — never competes visually with a primary button on the same screen.
- **Destructive:** Muted Rose Alert text/icon on transparent or Rose Blush background, same `rounded-xl` shape as other utility buttons — color carries the warning, not a shape change.

### Cards / Containers
- **Corner Style:** `rounded-2xl` (16px).
- **Background:** Paper White.
- **Shadow Strategy:** Ambient (`shadow-sm`) at rest; see Elevation & Depth.
- **Border:** 1px Sage Whisper (`#dcfce7`) is the signature card border — distinct from the Warm Stone Border used on form inputs, and part of what makes a card read as "on-brand" rather than generic.
- **Internal Padding:** `p-4` on mobile, `p-6` at `sm` and above.

### Inputs / Fields
- **Style:** 1px Warm Stone Border, Paper White background, `rounded-xl` (12px), comfortable internal padding (`p-2`–`p-3`).
- **Focus:** border color shifts directly to Deep Sage Trust — no glow, no ring, just a confident color change. Matches the global `:focus-visible` outline already defined in the shared stylesheet.
- **Error:** border and helper text shift to Muted Rose Alert; error banners use Rose Blush background with a matching border.

### Navigation
- **Desktop:** a fixed left rail (green-900 dark background — the one place the system inverts to a dark surface) with icon-over-label stacked items; the active item gets a filled Deep Sage Trust background pill, inactive items are pale green text that brightens on hover.
- **Mobile:** the same rail collapses to a bottom icon-only tab bar at the same dark green, active state identical (filled pill) minus the label.
- **Public site:** a light, transparent-to-white navbar with anchor links that scroll-spy the current section and smooth-scroll on click; collapses to a hamburger menu below `lg`.

## Do's and Don'ts

### Do:
- **Do** keep Deep Sage Trust as the only color that carries brand/identity meaning; everything else is functional signaling.
- **Do** use the Signature Glow shadow on exactly one primary action per screen, never more.
- **Do** default every card and container to `rounded-2xl` with a Sage Whisper border and Ambient shadow — that combination is the system's visual signature.
- **Do** keep Baloo 2 confined to headings; body copy, buttons, and labels stay in Nunito even at bold weight.
- **Do** use `rounded-full` specifically to mark an action as primary/urgent (pills) — reserve it for that meaning rather than using it decoratively.

### Don't:
- **Don't** introduce Tailwind's default Gray palette for neutrals — Stone is the system's only neutral family; treat existing `gray-*` usage as a defect to clean up, not a second valid option.
- **Don't** add a second "brand-feeling" accent color alongside Deep Sage Trust. Rose/Amber/Sky exist only to signal status (error/urgency/info) and must never be reached for as a decorative or "pop of color" choice.
- **Don't** stack shadows or add elevation to more than one element per screen — flatness is the resting state, and the whole system's sense of hierarchy depends on that rule holding.
- **Don't** sharpen corners on primary actions or structural containers — hard edges read as "generic SaaS," which is the opposite of this system's warm, gentle, approachable character.
