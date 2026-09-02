# Solutions Log

A running record of concrete issues (things that were actually broken or misbehaving) and how each was fixed. Feature additions with no underlying defect aren't logged here — see `CHANGELOG.md` for those. Newest first.

## 2026-09-02 — Group-scoped Reports table still didn't scroll horizontally on mobile

**Issue:** The earlier `min-w-*` fix (below) worked on the top-level `/reports` page but not on `/groups/:id/reports` — narrow columns still squeezed/wrapped instead of scrolling.

**Solution:** The two pages nested their wrapper `div`s in the opposite order. The working page has `overflow-x-auto` as the *inner* wrapper directly around `<table>`, with the rounded-corner `overflow-hidden` card outside it — so the table can be wider than its scroll container and get a scrollbar. The group-scoped page had it backwards: `overflow-hidden` was the inner wrapper immediately around the table, clipping (discarding) the overflow before the outer `overflow-x-auto` ever saw anything to scroll to. Swapped the nesting order to match.

## 2026-09-02 — `pnpm dev` kept failing with EADDRINUSE on 8000/4000/42070

**Issue:** Local `pnpm dev` repeatedly failed to start `apps/api` and `apps/admin` with `EADDRINUSE`, even right after a previous failed attempt. Two stacked leftover process groups were squatting on the ports: a stray `apps/api` tsx-watch process orphaned from earlier local testing (never actually died despite a `pkill` + `ps aux | grep ... | grep -v grep` check reporting it gone), plus an admin+api pair orphaned from a prior `pnpm dev` invocation whose parent shell had already exited while the children kept running detached.

**Solution:** Diagnosed with `lsof -i :<port>` per port (3000/4000/8000/42069/42070) instead of trusting a command-name grep, confirmed each PID's identity with `ps -p <PID> -o pid,ppid,etime,cmd`, then `kill -9`'d the whole set and re-verified every port was actually free via `lsof` again before calling it done. The earlier `pkill -f "..."` + `ps aux | grep ... | grep -v grep` check is unreliable for this — it only proves no process's command line matches the grep pattern, not that the port's socket is actually released (a respawned child or a slightly different command string slips past it); `lsof -i :<port>` (or `ss -ltnp`) checks the thing that actually matters.

## 2026-09-02 — Score input in the report form made you delete the default "0" by hand

**Issue:** The Score field always started at 0. Clicking in and typing a real score (e.g. "85") produced "085" unless the user first manually selected/deleted the "0" — an annoying extra step on every single report.

**Solution:** The Score field (in both the top-level and group-scoped report forms) now clears itself on focus if it's still showing the default 0, and falls back to 0 on blur if left empty — so clicking in and typing immediately gives the right value, but the field can never end up stuck empty or invalid.

## 2026-09-02 — Reported "Edit/View report disabled for teacher" turned out not to be a code bug

**Issue:** User reported the Edit/View report buttons under a group's Reports tab needed to be re-enabled for the teacher role.

**Investigation:** Traced every gate on that page (`canManage` in both `reports.tsx` and `groups_/$groupId.reports.tsx`, the `GroupTabs` tab visibility, and the backend's `canManageGroup`/`canUserAccessGroup`) — all of them already permit "teacher," and git history shows this was never restricted to admin-only. No change made; flagged back to the user in conversation as likely a stale deployed build rather than a source bug, since that exact failure mode (fixed in code, not yet live) recurred earlier this session with the TanStack devtools/PM2 issue.

## 2026-09-01 — Line spacing typed in the report edit modal still disappeared in the generated PDF

**Issue:** After the previous fix below, a single Enter press in the Progress/Saran fields still didn't show up as a line break in the PDF — only a full blank line (double Enter) did, since `normalizeFreeText()` couldn't tell a deliberately-typed newline apart from a hard-wrap-from-paste artifact once both were just `\n` characters in the same stored string.

**Solution:** Moved the hard-wrap cleanup to where the ambiguity actually originates — pasting — instead of guessing after the fact. The report edit modal's Progress/Saran textareas now normalize pasted text on paste (collapsing its internal hard-wrap newlines, preserving its own real paragraph breaks) before it ever reaches the field; an actual Enter keypress never goes through that path. With paste artifacts handled at the door, `normalizeFreeText()` in `ReportDocument.tsx` now trusts every `\n` in storage and renders it as a real line break — matching the edit modal 1:1. Trade-off: a handful of already-stored reports that were pasted in before this fix (with pre-existing hard-wrap `\n` runs) will still render with the old wasted-space symptom until re-saved.

## 2026-09-01 — Deliberate paragraph breaks in Progress/Saran were being erased along with hard-wrap artifacts

**Issue:** The earlier `normalizeFreeText()` fix (see the "overflowed to an extra page" entry below) collapsed *every* newline into a space, including a teacher's deliberate blank-line paragraph break (e.g. a report writing "Tahsin: ..." and "Tahfizh: ..." as two visually separated notes) — losing real structure the same fix was meant to preserve for hard-wrapped paste text.

**Solution:** `normalizeFreeText()` now splits on a blank line (2+ consecutive newlines — Enter pressed twice) first, treating that as a genuine paragraph break and keeping one literal `\n` between paragraphs (which `react-pdf`'s `<Text>` renders as a real line break). Within each paragraph, all other whitespace — including single newlines, which are indistinguishable from hard-wrap paste artifacts — still collapses into single spaces as before. Verified by rendering both the original hard-wrap regression case (still reflows, no wasted space) and a real double-newline paragraph case (now renders as two separate lines) to PNG. (Superseded by the fix directly above.)

## 2026-09-01 — Report grade labels were gender-agreed with no real-world basis for it

**Issue:** `deriveGradeLabel` produced a different label for female students (Jayyidah Jiddan, Mumtaazah, Maqbulah, Dhaifah) than male ones (Jayyid Jiddan, Mumtaz, Maqbul, Dhaif). The base terms are real, standard Arabic academic grades — but the gendered variants had never actually been confirmed against how this school's real reports write them, and the user had never heard of the feminine forms being used this way.

**Solution:** Removed the gender branching entirely — `GRADE_LABEL` is now a flat `Record<ReportGrade, string>`, same label for every student regardless of gender. `deriveGradeLabel` no longer takes a gender argument; all three call sites updated.

## 2026-09-01 — Saran still rendered visibly bigger than Progress despite the combined-length fix

**Issue:** A real report (Tahsin/Tahfizh progress notes) still showed Saran in a noticeably larger font than Progress — the exact mismatch the combined-length sizing fix was supposed to prevent.

**Solution:** Removed the dynamic font-size mechanism (`deriveContentFontSize` and its length-based anchors) entirely — Progress and Saran now both use the shared, fixed `sectionText` style (17pt) unconditionally. Requested directly after seeing the mismatch persist in practice; going forward, a long report simply takes as many pages as it needs rather than shrinking text to try to avoid it. Verified by rendering the exact reported case — both fields now render at the identical size.

## 2026-09-01 — Advice's font rendered too big relative to a long Progress, still risking a 3rd page

**Issue:** Progress and Saran (advice) were each sized from their *own* character count independently. A long Progress could already be shrunk to the smallest allowed font while a short Saran next to it still rendered at a much bigger size — as if it didn't know Progress had already used up most of the page's room.

**Solution:** Changed `deriveContentFontSize()` in `ReportDocument.tsx` to take both fields' *combined* length, so they're now sized off one shared budget instead of two independent ones — a short Saran next to a long Progress now shrinks along with it. Considered a fixed font size instead, but rejected it: it would either force every short/simple report to look unnecessarily small, or (if kept large) remove the only existing protection against long entries overflowing. Note: this narrows the overflow risk but doesn't eliminate it — a report where *both* fields are individually very long (confirmed by testing an 818-character real Progress field) can still need a 3rd page purely on content volume, which is an inherent capacity limit of the fixed-section layout, not a bug this fix addresses.

## 2026-09-01 — Report PDF's Progress/Saran text sometimes overflowed to an extra page for no obvious reason

**Issue:** A shorter Saran (advice) text pushed the report onto a 3rd page, while a longer one didn't — counter-intuitive, since the font-size-by-length heuristic alone would predict the opposite.

**Solution:** Both texts had been pasted in from elsewhere already hard-wrapped at a fixed column width — every wrapped line was a literal `\n`, and `react-pdf`'s `<Text>` preserves `\n` as a forced line break instead of reflowing it. So the text was rendering at its original ~80-character line width instead of the page's actual full width, wasting most of each line. Added `normalizeFreeText()` in `ReportDocument.tsx` to collapse all whitespace runs (including embedded newlines) into single spaces before font-size derivation and rendering, letting the text reflow naturally. Verified by reproducing both exact reported texts and confirming the shorter one now fits back on a single content page.

## 2026-09-01 — Org logo overlapping "Tipe Kelas" in report header

**Issue:** The organization logo in the report PDF header was too large and overlapped the "Tipe Kelas" biodata column — reports have 4 biodata columns (the other PDF templates built on this shared header only use 2), so there wasn't enough clearance for the logo's fixed top-right box.

**Solution:** Shrank the shared header logo from 80×80 to 60×60, and gave the report's biodata row a dedicated `paddingRight` reservation (scoped to `ReportDocument` only, so the invoice/payslip templates — which have room to spare — are unaffected) so the last column's text always clears the logo. Verified by re-rendering the exact reported scenario (long wrapping student name, 4 columns) to a PNG.

## 2026-09-01 — Emoji in report PDFs didn't render

**Issue:** Emoji typed into a report's Progress/Saran (advice) text showed up as missing-glyph boxes in the exported PDF.

**Solution:** `@react-pdf/renderer`'s font embedding can't render color emoji glyphs at all. Emoji sequences are now detected with a Unicode-aware regex and rendered as small inline `<Image>` bitmaps (fetched from Twemoji, cached in memory, falling back to the old behavior for that one glyph if a fetch fails) — placed inline in the same text flow as the surrounding Arabic/Latin runs.

## 2026-09-01 — Reassigning a student number failed if another student already had it

**Issue:** Giving Student A a number that Student B already held was rejected outright by the database's unique constraint, blocking the save entirely — there was no way to swap two students' numbers without a workaround.

**Solution:** `PATCH /users/:id` now detects the conflict and swaps the two students' numbers atomically in a transaction (via a temporary `null` step) instead of rejecting the change. The response includes the other affected student so the admin table updates both rows immediately.

## 2026-08-31 — Creating a user silently failed with no feedback

**Issue:** The `/users` page's "Create User" modal did nothing visible on failure — e.g. leaving the Role or Gender dropdown on its blank placeholder (nothing marked them required) caused the backend to reject the request, but the frontend only ever handled the success path. Reported as "I can't add a user."

**Solution:** Rebuilt the modal (relocated to Settings → User, admin-only) with real client-side validation (submit disabled until all required fields are valid) and proper success/error feedback.

## 2026-08-30 — Site went down after switching to a production build

**Issue:** After fixing the PM2 config to run the built server, the whole site went down — `curl` returned "connection refused."

**Solution:** `dist/server/server.js` (the TanStack Start production build) only exports a Web-standard `fetch` handler with no `http.createServer`/`.listen()` of its own — running it directly with `node` just executed the module and exited immediately, with no listener ever opened. Added `srvx` (a small universal server) to wrap the handler into an actual Node listener, configured with `--static ../client` so it also serves the built CSS/JS assets.

## 2026-08-30 — TanStack devtools fix had no effect on the live server

**Issue:** After gating the devtools panel behind `import.meta.env.DEV` in code, the live site still showed it — pulling the commit and rebuilding didn't help.

**Solution:** PM2 was running `pnpm vite dev` (the dev server) in production, where `import.meta.env.DEV` is always `true` regardless of the code fix. Changed `ecosystem.config.js` to run the built server bundle (`vite build` output) instead of the dev server.

## 2026-08-30 — TanStack devtools panel visible to real visitors

**Issue:** A floating debug icon (TanStack Router Devtools) was showing up in the bottom-right corner of the live public site for every visitor.

**Solution:** Wrapped `<TanStackDevtools>` in `{import.meta.env.DEV && ...}` in `__root.tsx`. Vite's devtools plugin strips the code out of production builds entirely once gated this way (confirmed via the build log: "Removed devtools code from: /src/routes/__root.tsx").

## 2026-08-29 — Admin WhatsApp number hardcoded in tracked source

**Issue:** The school's admin WhatsApp number was written directly into `whatsapp.ts`, including as a fallback default — meaning it lived in git history even though it's real contact information, not code.

**Solution:** Moved it to `VITE_ADMIN_WHATSAPP_NUMBER`, read only from environment with no fallback baked into the repo. It now only exists in the (gitignored) `.env`; a missing value logs a clear `console.error` instead of silently producing a broken `wa.me/undefined` link.

## 2026-08-29 — Registration form modal blocked git commits

**Issue:** `git commit` failed on the pre-commit hook (`pnpm lint`) — the new registration form modal's inner box had an `onClick` (for click-outside-to-close) but no `role` or keyboard handler, tripping Biome's accessibility rules.

**Solution:** Added `role="dialog"` and an `onKeyDown` Escape handler to the inner modal box, matching the pattern already used by the other modals in `settings_/user.tsx`.
