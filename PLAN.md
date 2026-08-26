# LMS Full Stack Curriculum — UI First
**Stack:** HonoJS (backend) · TanStack Router + Query (frontend)  
**Approach:** Build UI with mock data first → derive real API needs → connect  
**Starting point:** Auth/login done  

**Legend:** `[commodity]` — vibe-code freely, light review · `[core]` — I state the logic myself first, wait for my go-ahead before writing any code · `[core-touching]` — the step itself is commodity (UI/wiring), but it implements or depends on a core rule below; treat any business logic inside it as `[core]`, not the surrounding UI shell. Core rules are listed in Data Model Decisions → Business Rules, expanded below each rule's first touchpoint.

**Rule reference:**
1. Billing formula (`Bill = PRESENT/expected × price`) + edge cases (mid-month join, teacher never logs session, mid-month price change)
2. Enrollment audit log (`GroupEnrollment`/`GroupTeacher` as JOIN/LEAVE events, not plain FKs)
3. Report visibility (draft invisible to students; visible once explicitly submitted, not on creation — see Post-Plan Additions for the actual `submittedAt`/`readAt` implementation, which replaced the `published` framing) — enforced server-side
4. Role-based scoping on every list endpoint (data-leak risk surface)
5. Monthly aggregate rules (published-only? zero-report handling?)
6. Report render-time joins (no denormalized duplication)

> Note: no Phase 6 hour currently owns billing/`Payment` endpoints (rule 1) — flagging this as a gap to fill in, not something to silently skip.

---

## PHASE 1 — Public Pages (Hours 1–4)

**Hour 1 — Landing Page: Hero + Nav** `[commodity]`
- Navbar: logo, "Login" CTA button
- Hero section: headline, subheadline, "Get Started" button
- Use static mock content for now (school name, tagline)

**Hour 2 — Landing Page: Features + Teachers Section** `[commodity]`
- "Why choose us" feature cards (3 icons + text blocks)
- Teachers showcase: grid of teacher cards (photo, name, subject)
- Use hardcoded mock array of 4–5 teachers

**Hour 3 — Landing Page: Success Stories + Footer** `[commodity]`
- Student success stories: testimonial cards with quote, name, photo
- Stats bar: "X Students", "X Teachers", "X Classes"
- Footer: links, copyright

**Hour 4 — Login Page** `[commodity]`
- Centered card layout: email + password fields, submit button
- Form validation (empty fields, bad email format)
- Error state: "Invalid credentials" inline message
- Loading spinner on submit
- On success → redirect to `/dashboard` (hardcoded for now)

---

## PHASE 2 — Dashboard UI (Hours 5–9)

**Hour 5 — App Shell & Layout** `[commodity]`
- Sidebar nav: Dashboard, Classes, Assignments, Progress Reports, (Admin: Users)
- Top header: page title, notification bell icon, user avatar + name
- Role-aware nav: different items visible per role (use mock role flag)
- Mobile: collapsible sidebar

**Hour 6 — Notification Panel** `[commodity]`
- Bell icon → slide-out panel
- Mock notifications list: "New assignment posted", "Grade updated", etc.
- Unread badge count on bell
- Mark all as read button

**Hour 7 — Dashboard: Admin View** `[core-touching: rule 2]` _(updated 2026-04-30)_
- 2 tabs: "Student Progress" and "Session Attendance"
- Tab 1 "Student Progress": all students × monthly assignments (submitted/score or N/A) + report status, filtered by month picker (default: current month)
- Tab 2 "Session Attendance": all students × sessions for selected month, gray cell = student not in that group, checkmark = present
- Gray cell distinguishes "not in this group" from "absent/not submitted"

**Hour 8 — Dashboard: Teacher View** `[core-touching: rules 3, 6]` _(updated 2026-05-01)_
- Month picker (default: current month)
- One table per group assigned to the teacher
- Columns: Student Name | Assignment | Report

**Assignment cell logic:**
- `null` → "No Assignment Yet" (all roles)
- `{ status: "created", score: null }` → teacher/admin: "Created" + "Edit Assignment" button → redirects to `/dashboard/assignments/create`
- `{ status: "created", score: null }` → student: "Do Assignment" button
- `{ status: "submitted", score: 90 }` → everyone: "Submitted (90/100)"

**Report cell logic:**
- `null` → "No Report Yet" (all roles)
- `{ status: "created" }` → teacher/admin: "Draft" + "Edit Report" button → opens modal with textarea
- `{ status: "created" }` → student: "No Report Yet" (student cannot see draft)
- `{ status: "published" }` → everyone: "Published" + student sees download PDF button

- Report can be downloaded by student as PDF (clean layout per month)
- PDF generation joins Group, Student, Teacher, Subject data at render time — no duplication in Report model
- Tab 2 "Session Attendance": same structure as Admin View Tab 2, filtered to teacher's own groups

**Hour 9 — Dashboard: Student View** `[commodity]`
- "My Classes" cards: class name, teacher name, progress %
- Upcoming assignments list with due dates
- Latest progress report summary card
- Notifications feed

---

## PHASE 3 — Class & Enrollment UI (Hours 10–13)

**Hour 10 — Classes List Page** `[core-touching: rule 4]` _(updated 2026-05-01)_
- Accessible by all roles (admin, teacher, student) at `/classes`
- Grid of class cards: group name, teacher name, student count
- Role-based differences:
  - Admin: can create, edit, deactivate groups
  - Teacher: read-only view
  - Student: sees a "Join" button per group → redirects to enrollment form
- Search + filter bar (by subject, teacher)
- Mock data array of 5–6 groups

**Hour 11 — Class Detail Page** `[core-touching: rule 2]`
- Header: class name, teacher info, description
- Tabs: "Students" | "Assignments" | "Progress Reports"
- Students tab: enrolled students table, "Enroll Student" button (admin only)
- All tabs use mock data for now

**Hour 12 — User Management Page (Admin)** `[commodity]`
- Table: name, email, role, subject badges, status — no tabs
- "Add User" button → form modal (name, email, role, subjects)
- Edit User: pencil icon per row → prefills modal
- Delete User: trash icon per row → ConfirmModal

**Hour 13 — Enrollment Flow UI** `[core-touching: rule 2]`
- "Enroll Student" → searchable student picker modal
- Selected students list with remove option
- Confirm enrollment button
- Visual: enrolled student card in Students tab updates immediately (optimistic UI mock)

---

## PHASE 4 — Assignment UI (Hours 14–19)

**Hour 14 — Assignment List Page** `[commodity]`
- Teacher view: list of assignments they created, status badge (Draft/Published)
- Student view: list of assignments with status (Pending/Submitted/Graded)
- "Create Assignment" button (teacher only)
- Mock data: 4–5 assignments per class

**Hour 15 — Assignment Builder: Shell** `[commodity]`
- Multi-step form layout: Step 1 Title/Instructions → Step 2 Questions → Step 3 Settings
- Step indicator at top
- Assignment title, description, due date, max score fields
- "Add Question" button to proceed

**Hour 16 — Assignment Builder: Question Types** `[commodity]`
- Question type selector: Multiple Choice | True/False | Short Answer | File Upload
- Multiple Choice: input for question + 4 answer options, mark correct answer radio
- True/False: question input + correct answer toggle
- Short Answer: question input + optional model answer for teacher reference
- File Upload: question input + accepted file types selector

**Hour 17 — Assignment Builder: Settings & Preview** `[commodity]`
- Settings: time limit toggle, randomize question order toggle, max attempts
- Preview tab: shows assignment exactly as student will see it
- "Save Draft" and "Publish" buttons

**Hour 18 — Student Assignment Attempt Page** `[commodity]`
- Shows assignment title, instructions, time limit countdown
- Renders each question type correctly:
  - Multiple choice → radio buttons
  - True/False → toggle buttons
  - Short answer → textarea
  - File upload → drag & drop zone
- Progress bar: "3 of 5 questions answered"
- "Submit Assignment" button with confirm dialog

**Hour 19 — Assignment Results Page** `[commodity]`
- Teacher view: table of all student submissions, score, submitted at
- Click a student → see their answers side by side with correct answers
- Short answer / file upload: manual grade input field per question
- Student view: their score, correct/incorrect per question, teacher feedback

---

## PHASE 5 — Progress Report UI (Hours 20–23)

**Hour 20 — Progress Report List** `[commodity]`
- Teacher view: list of reports they've created per class, month badges
- Student view: list of reports they've received, sorted by date
- "Create Report" button (teacher only)
- Mock data: 2–3 reports per student

**Hour 21 — Progress Report Builder (Teacher)** `[core-touching: rule 3]`
- Select student from class roster dropdown
- Select period: month + year picker
- Predefined criteria rating scale:
  - Criteria rows: e.g. "Participation", "Assignment Completion", "Understanding", "Behavior"
  - Each row: 1–5 star/dot rating scale
  - Optional short note per criteria
- Overall summary textarea
- "Enhance with AI" button next to the summary textarea → sends draft content to Claude API → streams improved version back into the textarea (teacher can edit further before saving)
- "Save Draft" / "Publish to Student" buttons

**Hour 22 — Progress Report View (Student)** `[core-touching: rule 3]`
- Clean card layout: student name, class, period
- Each criteria displayed as a labeled progress bar or dot scale
- Overall summary section
- Teacher name + date published
- Print/export button (placeholder)

**Hour 23 — Progress Report: Admin Overview** `[core-touching: rule 5]`
- Class-level report: table of all students + their latest rating per criteria
- Color coding: green (4–5), yellow (3), red (1–2)
- Filter by month/year
- "Export Report" button (placeholder)

---

## PHASE 6 — Backend APIs (Hours 24–33)

> Now that UI is done, we know exactly what we need. Build only what the UI actually calls.
> **Stack decision:** Use **Prisma** as the ORM against Postgres (matches what's already running — see `docker-compose.dev.yml` and `apps/api/prisma`). HonoJS owns auth (JWT, already in place via `apps/api/auth`) and all business logic. Supabase is not used.
>
> Open gap: dropping Supabase also drops its file storage, and `Payment.proofOfTransfer` needs somewhere to store the uploaded image — not decided yet, flagging rather than picking a default.

**Hour 24 — Users & Auth Endpoints** `[commodity]`
- `GET /me` — current user profile + role
- `PATCH /me` — update profile
- `GET /users` — admin only, list all users with role filter
- `POST /users` — create teacher or student (admin)
- `PATCH /users/:id` — update user
- Attach role to JWT payload

**Hour 25 — Classes & Enrollment Endpoints** `[core: rules 2, 4]`
- `GET /classes` — list (filter by teacher/student based on role)
- `POST /classes` — create (admin)
- `PATCH /classes/:id` — update
- `GET /classes/:id` — detail with teacher info
- `GET /classes/:id/students` — enrolled students
- `POST /enrollments` — enroll student
- `DELETE /enrollments/:id` — unenroll

**Hour 26 — Assignment Endpoints** `[commodity]`
- `GET /classes/:id/assignments` — list
- `POST /classes/:id/assignments` — create with questions array
- `PATCH /assignments/:id` — update (draft → published)
- `GET /assignments/:id` — full detail with questions
- `DELETE /assignments/:id`

**Hour 27 — Submission Endpoints** `[commodity]`
- `POST /assignments/:id/submissions` — student submits answers
- `GET /assignments/:id/submissions` — teacher views all submissions
- `GET /assignments/:id/submissions/:studentId` — single student submission
- `PATCH /submissions/:id/grade` — teacher grades short answer / file upload

**Hour 28 — Progress Report Endpoints** `[core: rule 3]`
- `POST /reports` — teacher creates report (student, period, criteria ratings, summary)
- `GET /reports?studentId=&classId=&month=&year=` — filtered list
- `GET /reports/:id` — single report detail
- `PATCH /reports/:id` — update / publish

**Hour 29 — Notification Endpoints** `[commodity]`
- `GET /notifications` — current user's notifications
- `PATCH /notifications/read` — mark all as read
- Auto-create notifications on: new assignment published, report published, submission graded

**Hour 30 — Dashboard Aggregate Endpoints** `[core-touching: rule 4]`
- `GET /dashboard/admin` — counts + recent activity
- `GET /dashboard/teacher` — my classes summary + upcoming assignments
- `GET /dashboard/student` — enrolled classes + upcoming assignments + latest report

**Hour 31 — Validation, Guards & Error Handling** `[core: rule 4]`
- Zod schemas for all POST/PATCH bodies
- Role middleware: teacher-only routes, student-only routes, admin-only routes
- Standardized error format `{ error, message, status }`

**Hour 32 — Monthly Report Aggregate Endpoint** `[core: rule 5]`
- `GET /reports/monthly?month=&year=&classId=` 
- Returns per-student criteria averages
- Returns class-wide averages per criteria

**Hour 33 — Seed Script** `[commodity]`
- 1 admin, 3 teachers, 10 students
- 3 classes with enrollments
- Assignments with all 4 question types
- Submissions + grades
- Progress reports for 2 months

---

## PHASE 7 — Connect UI to Real API (Hours 34–39)

**Hour 34 — Auth + /me connection** `[commodity]`
- Swap mock role flag → decode JWT from `/me`
- Redirect logic based on real role
- Persist token, auto-logout on 401

**Hour 35 — Dashboard + Notifications** `[commodity]`
- Replace mock dashboard data → `useQuery` to `/dashboard/:role`
- Wire notification panel → `GET /notifications` + mark-read mutation

**Hour 36 — Classes + Enrollment** `[core-touching: rules 2, 4]`
- Replace mock classes → `useQuery` to `GET /classes`
- Wire enroll/unenroll modals → `useMutation`
- Wire user management CRUD

**Hour 37 — Assignments** `[commodity]`
- Wire assignment builder → `POST /classes/:id/assignments`
- Wire student attempt → `POST /assignments/:id/submissions`
- Wire grading table → `PATCH /submissions/:id/grade`

**Hour 38 — Progress Reports** `[core-touching: rule 3]`
- Wire report builder → `POST /reports`
- Wire student report view → `GET /reports?studentId=`
- Wire admin overview → `GET /reports/monthly`

**Hour 39 — Polish: Loading, Errors, Empty States** `[commodity]`
- Add loading skeletons to every page
- Error boundaries per route
- Empty state illustrations ("No assignments yet")
- Toast notifications for all mutations

---

## PHASE 8 — Deployment & Launch (Hour 40)

**Hour 40 — Deploy & Smoke Test** `[commodity]`
- Deploy HonoJS → Railway / Render
- Deploy React → Vercel
- Set env vars both sides
- Log in as each role, test full flow end to end
- PDF export wiring (print CSS or jsPDF)

---

## Progress Checklist

**Backend (pre-plan)**
- ✅ `POST /register`
- ✅ `POST /login`
- ✅ `GET /me`

**Phase 1 — Public Pages**
- ✅ Hour 1 — Landing Page: Hero + Nav (fully rebuilt 2026-08-25 into a real anchor-nav single page with the user's actual content — see Post-Plan Additions)
- 🔄 Hour 2 — Landing Page: Features + Teachers Section (the "Features" and "Teachers" components were deleted entirely in the 2026-08-25 rebuild — their content role is now covered by "Program & Fasilitas" and "Tentang Kami" instead, not a 1:1 replacement)
- 🔄 Hour 3 — Landing Page: Success Stories + Footer (Testimonials kept and restyled into the new page; the "stats bar" now shows live counts via `/public/stats` instead of hardcoded numbers — see Post-Plan Additions)
- ✅ Hour 4 — Login Page

**Phase 2 — Dashboard UI**
- ✅ Hour 5 — App Shell & Layout (extended 2026-08-24 with a mobile/tablet bottom nav bar, replacing the left sidebar below the `lg` breakpoint — see Post-Plan Additions)
- ✅ Hour 6 — Notification Panel
- ✅ Hour 7 — Dashboard: Admin View (completed 2026-05-01)
- ✅ Hour 8 — Dashboard: Teacher View (completed 2026-05-01)
- ✅ Hour 9 — Dashboard: Student View (completed 2026-05-01)

**Phase 3 — Class & Enrollment UI**
- ✅ Hour 10 — Groups List Page (fully complete — Create, Edit, Delete all working; Edit reuses CreateGroupModal with pre-filled data; Delete uses ConfirmModal with selection-slot pattern) — extended 2026-08-05 with startDate/endDate/plannedSessions + redesigned card (see Post-Plan Additions)
- 🔄 Hour 11 — Class Detail Page (superseded by GroupTabs: Sessions/Reports/Assignments/Invoices tabs per group, not the originally planned Students/Assignments/Progress Reports tabs — see Post-Plan Additions)
- 🔄 Hour 12 — User Management Page (Create + Edit both wired via shared modal; avatar upload added 2026-08-05 with 300KB/type validation client + server; Delete button still has no handler — not implemented)
- ❌ Hour 13 — Enrollment Flow UI

**Phase 4 — Assignment UI**
- ❌ Hour 14 — Assignment List Page
- ❌ Hour 15 — Assignment Builder: Shell
- ❌ Hour 16 — Assignment Builder: Question Types
- ❌ Hour 17 — Assignment Builder: Settings & Preview
- ❌ Hour 18 — Student Assignment Attempt Page
- ❌ Hour 19 — Assignment Results Page

**Phase 5 — Progress Report UI**
- 🔄 Hour 20 — Progress Report List (superseded by the Reports tab's table — per-group, not cross-group; see Post-Plan Additions)
- 🔄 Hour 21 — Progress Report Builder (Teacher) (built with Month/Year/Student/Progress/Advice/Score fields instead of the criteria-rating scale spec'd here; no "Enhance with AI" button — see Post-Plan Additions)
- 🔄 Hour 22 — Progress Report View (Student) (built as a read-only popup with a Submitted→Read receipt instead of a dedicated page; Download PDF is now functional — real `@react-pdf/renderer` PDF, themed, role-gated — but is a simplified v1, not the cover-page/Arabic-decorated design from the real example reports — see Post-Plan Additions)
- ❌ Hour 23 — Progress Report: Admin Overview (no cross-group/class-level aggregate view exists — admin sees the same per-group table as everyone with manage rights)

**Phase 6 — Backend APIs**
- ✅ `GET /me` — current user profile
- ❌ `PATCH /me` — update profile
- 🔄 Hour 24 — Users & Auth Endpoints (`GET`/`POST`/`PATCH /users` done, incl. `avatarUrl`; no `DELETE /users` yet — ties to Hour 12's unwired Delete button)
- 🔄 Hour 25 — Classes & Enrollment Endpoints (`/groups` CRUD done with role-scoped `GET`, enrollment via `GroupEnrollment` JOIN/LEAVE log — not a separate `/enrollments` resource as originally sketched)
- ❌ Hour 26 — Assignment Endpoints (the quiz-builder version — see Post-Plan Additions for what was actually built instead)
- ❌ Hour 27 — Submission Endpoints
- 🔄 Hour 28 — Progress Report Endpoints (`/groups/:id/reports` CRUD + `/submit` + `/read` action endpoints exist, but shaped around Month/Year/Student/Progress/Advice/Score + a submitted/read receipt, not the criteria-rating version spec'd here — see Post-Plan Additions)
- ❌ Hour 29 — Notification Endpoints
- ❌ Hour 30 — Dashboard Aggregate Endpoints (dashboard went a different direction entirely — see Post-Plan Additions)
- ❌ Hour 31 — Validation, Guards & Error Handling
- ❌ Hour 32 — Monthly Report Aggregate Endpoint
- 🔄 Hour 33 — Seed Script (exists and actively maintained, but scoped to what's actually built — not assignments/submissions/reports as spec'd here)

**Phase 7 — Connect UI to Real API**
- ❌ Hour 34 — Auth + /me connection
- ❌ Hour 35 — Dashboard + Notifications
- ❌ Hour 36 — Classes + Enrollment
- ❌ Hour 37 — Assignments
- ❌ Hour 38 — Progress Reports
- ❌ Hour 39 — Polish: Loading, Errors, Empty States

**Phase 8 — Deployment**
- ❌ Hour 40 — Deploy & Smoke Test

---

## Post-Plan Additions
_Added 2026-08-05 — work that grew organically per-feature (schema → API → UI → verify, all in one pass) instead of following the Phase 1–5 mock-first / Phase 6 backend / Phase 7 connect ordering above. Recorded here so the plan doesn't silently go stale._

- **Sessions CRUD** — `Session` + `SessionAttendance` models, full CRUD at `api/src/routes/sessions.ts` (admin + assigned-teacher only, via `canManageGroup`). Per-group Sessions page gained inline Edit (date/status/students/duration) and Delete (confirm modal) actions. `Session.attendanceRecorded` boolean added to distinguish "never edited" from "explicitly recorded 0 attendees" — fixes a real bug where those two cases collapsed together.
- **Group detail tabs** — Sessions / Reports / Assignments / Invoices tabs (`GroupTabs.tsx`), same CRUD pattern reused for `Report` and `Assignment` models. **Note:** `Assignment`/`Invoice` as actually built are still minimal placeholders (`id, groupId, title, description, status`) — not the rich quiz-builder (`AssignmentQuestion`/`AssignmentSubmission`/`AssignmentAnswer`, Hours 14–19) described earlier in this plan. `Report` has since been fully redesigned away from that placeholder shape — see below.
- **Invoice model** — new, not in the original Core Entities list below. Same placeholder shape as Report/Assignment. **Does not implement rule 1 (billing formula)** — no `Payment` model, no PRESENT/expected calculation, no proof-of-transfer upload. Rule 1 is still a fully open gap. Invoices tab + all 4 endpoints are locked to `requireRole("ADMIN")` directly, no teacher/student access at all.
- **"Tests" renamed to "Assignments"** across schema, routes, and UI (model, table, files) — pure rename, not the Hour 26 endpoint.
- **Route restructure** — dropped the `/dashboard/*` URL prefix via a pathless `_app` layout route; per-group subpages use TanStack Router's trailing-underscore escape (`groups_/$groupId.sessions.tsx`) so they aren't swallowed as children of `groups.tsx`. Filenames normalized to match.
- **Group scheduling** — `Group.startDate`/`endDate` (nullable end = ongoing) + new `PlannedSession` model (`groupId, dayOfWeek, time` — recurring weekly slot, distinct from `Session`'s after-the-fact log; no timezone field, single-locale WIB assumption). Group card redesigned to show the date range + planned-session pills.
- **Dashboard rebuilt, diverges from Hours 7–9** — old mock-data Admin/Teacher/Student table views deleted entirely. Replaced with:
  - `WeeklySchedule` — Mon–Sun bar chart driven by `PlannedSession` counts, today's bar/circles emphasized, live status dot on today only (amber "upcoming" → green "in session", assuming a 60min duration since `PlannedSession` has no duration field → gray "done").
  - `TeacherGroupMindMap` ("Team Structure") — Teacher → Group → {Students, Planned Sessions} tree via nested indentation + dashed connector lines (not the Hour 7/8 attendance/progress tables).
  - Role-scoping for both reuses `/groups`' existing per-role scoping (admin sees all, teacher/student see their own) rather than new dashboard-specific endpoints — Hour 30's `/dashboard/:role` aggregate endpoints were never built.
- **User avatars** — `User.avatarUrl` (nullable String), upload wired into `/users` create/edit modal (client `FileReader` → base64 data URL, no cloud storage set up). 300KB size cap + png/jpeg/webp/gif type restriction enforced both client-side and server-side (`isValidAvatarDataUrl` in `users.ts`). Rendered as circles in the users table, `WeeklySchedule`, and `TeacherGroupMindMap`, falling back to initials when unset.
- **`Report` fully redesigned** (2026-08-17/18) — replaces the placeholder shape and implements rule 3 for real, in a different way than originally framed:
  - Per-student now (`studentId` FK), not shared across the group — one report per student per period.
  - `title`/`description` replaced with `title`, `progress`, `advice`, and `score` (Int numerator, validated 0–100 both create and edit; UI shows it next to a disabled, permanently-`100` denominator input rather than a stored second field).
  - `month`/`year` added; `teacherId` is always stamped from the group's *current* teacher (`getCurrentTeacherId`) regardless of whether an Admin or the Teacher clicked Add Report — there's no path where it's null or an Admin's own id.
  - Status is no longer a `RecordStatus` enum — replaced with two nullable timestamps, `submittedAt`/`readAt`, that double as both the workflow state and the visibility gate: `null/null` = Draft (admin/current-teacher only, via a separate "Save Draft" action), `set/null` = "Submitted by {teacher}" (now visible to that one student, via a separate "Submit" action — deliberately two-step, not visible the instant Create is clicked), `set/set` = "Read by {student}" (set only when that specific student opens it, never by a teacher/admin preview).
  - Enforced server-side in `GET /groups/:id/reports`: students only ever receive their own `submittedAt`-not-null reports; drafts and other students' reports are invisible at the query level, not just hidden in the UI. Re-targeting a report to a different student resets `submittedAt`/`readAt` (old submitted/read state described the wrong person). Names still resolved at render time from `teacherId`/`studentId`, never denormalized — rule 6 holds.
- **Report PDF generation + color themes** (2026-08-18) — the Download PDF button (placeholder as of the entry above) is now real:
  - New `ReportTheme` model (`name`, `primaryColor`) with a nullable `Subject.reportThemeId` FK — one accent color per subject, reused across every report PDF for that subject. Falls back to a hardcoded default green when a subject has none assigned.
  - `Report.score` stays the only persisted number (kept for future progress-over-time graphing); the qualitative grade label (Mumtaz 90-100 / Jayyid Jiddan 80-89 / Jayyid 70-79 / Maqbul 60-69 / Dhaif <60, gender-agreed per the student — e.g. "Mumtaazah" for a female student) is derived at read time in `reports.ts`, never stored — same no-denormalization approach as everything else on this model.
  - `GET /groups/:id/reports/:reportId/pdf` — new endpoint, reuses the exact same visibility rule as the report itself (teacher/admin see any report including drafts; a student only their own submitted-or-later report). Renders via `@react-pdf/renderer` (chosen over an HTML+Puppeteer approach to avoid a headless-Chromium runtime dependency).
- **Settings page redesigned into tabs** (2026-08-18) — `/settings` now redirects to `/settings/report`, with a shared `SettingsTabs` bar (same pattern as `GroupTabs`) across six sub-routes: Report, Subject, User, Group, Invoice, Assignment.
  - `/settings/subject` — real Subject CRUD: `POST`/`DELETE /subjects/:id` + an Add Subject modal that picks a `ReportTheme` right at creation time. The per-subject color-theme table (originally built under `/settings/report`) lives here now, refactored per explicit request so theme is set in the same place a subject gets created — `/settings/report` no longer touches color at all.
  - `DELETE /subjects/:id` relies entirely on existing DB constraints for safety: `Group.subjectId`/`TeacherSubject.subjectId` are both `ON DELETE RESTRICT`, so Postgres refuses the delete outright (caught as Prisma `P2003`, surfaced as a friendly message) if any group or teacher assignment still references the subject — no soft-delete/`isActive` flag needed, deletion is simply blocked rather than corrupting anything.
  - `/settings/user`, `/settings/group`, `/settings/invoice`, `/settings/assignment` — still placeholder pages only ("coming soon" / "not planned yet"), reserving the destinations for a future Group-card color theme system, Invoice header/footer config, and User settings, none of which have been designed yet.
- **Report PDF template made fully configurable** (2026-08-18) — new global singleton `ReportSettings` model (title, organization name, footer phone/email/instagram, `font` enum, `headerPattern` enum, `coverImageUrl`), editable at `/settings/report`. Deliberately separate from the per-subject `ReportTheme` (color only) — title/footer/font/cover/pattern are institution-wide, not something that should vary by subject. This directly supersedes the "functional v1, no cover page" scope note from the entry above:
  - **Real cover page added** — student name, organization name, subject, and month/year overlaid on either the uploaded cover image (with a theme-color tint at 55% opacity for text legibility) or, if none is uploaded, a solid theme-color background. Cover image upload reuses the avatar's base64-data-URL pattern (client `FileReader`, PNG/JPEG/WEBP/GIF, capped at 800KB, validated both client- and server-side).
  - **Header patterns** — `NONE`/`LINES`/`DOTS`/`BLOCKS`/`SWIRL`, drawn as tiled SVG primitives (`@react-pdf/renderer`'s `Svg`/`Line`/`Circle`/`Rect`) in white at 18% opacity over the header's theme color, in a fixed 595×200pt design space scaled to fill the banner — legible-by-construction rather than user-configurable opacity.
  - **Font choice** — Helvetica (react-pdf's built-in, zero setup) plus two real embedded fonts, Poppins and PT Serif, both OFL-licensed static `.ttf` files fetched once into `apps/api/src/pdf/fonts/` and registered locally via `Font.register` (no runtime network fetch). Lora was the original second choice but Google Fonts only ships it as a variable font now, which react-pdf can't reliably use for static weights — swapped for PT Serif, including a hand-written `ALTER TYPE ... RENAME VALUE` migration since the enum value had already been created.
  - Footer bar now renders real phone/email/Instagram text (whichever are set) instead of being purely decorative, and disappears entirely when none are configured.
- **Dashboard rebuilt a second time — fully supersedes the `WeeklySchedule`/`TeacherGroupMindMap` entry above** (2026-08-24). That version (bar-chart weekly view + teacher/group mind-map) is deleted entirely, replaced with four components on one page:
  - `MiniCalendar` — month grid, click-to-focus a date, stays in sync with the big calendar below it.
  - `NearestSessionCard` — soonest upcoming planned session across the signed-in user's groups (reuses `/groups`' existing role-scoping, no new endpoint), with a live relative countdown.
  - `AttendancePrompt` — new, not previously planned anywhere. Gated to teacher/admin client-side (students have no server-side path to write attendance at all — enforcement is `canManageGroup`, unchanged). Appears once today's nearest planned session has actually started (`findTodaysStartedSession`, start-time only — `PlannedSession` still carries no duration field, confirmed against real seed data). One click finds-or-creates today's `Session` for that group and `PATCH`es it with the full current roster as present — a "mark everyone present" shortcut, not per-student toggling (that still only exists in the Sessions page's `EditSessionModal`). This is a first, partial touch on attendance-adjacent territory; it does **not** implement rule 1 (billing) — no `Payment`, no PRESENT/expected math, just `SessionAttendance` rows.
  - `GroupCalendar` — Daily/Weekly/Monthly toggle. Daily/Weekly's Y-axis is dynamic: 1 hour before the earliest visible planned session's *start time* and 1 hour after the latest's *start time* — no end-time math, since none exists to do. Monthly is a plain date grid, no hourly axis (never specified for that view). Event blocks are clickable through to that group's Sessions page and show `{teacherName} - {student list}` under the time.
  - New shared lib `apps/platform/src/lib/plannedSessions.ts` — day/time helpers, occurrence-building, the axis-range formula, `findTodaysStartedSession`/`findNearestUpcoming`.
  - No backend changes were needed for any of this — `GET /groups` already returned everything required, already role-scoped.
- **`Session.status` field removed** (2026-08-24) — dropped from the schema entirely (migration `remove_session_status`, `SessionStatus` enum deleted), after a full-codebase check confirmed no report/invoice/aggregate logic ever filtered on it — `attendanceRecorded` was already documented as the sole eligibility gate in `invoices.ts`. It only ever drove a redundant, driftable "Draft/Finished" label in the Sessions page table (now shows "Recorded"/"Pending" off `attendanceRecorded` instead) and a dropdown in `CreateSessionModal` (removed). `AttendancePrompt`'s auto-created sessions never passed a status either.
- **App-wide mobile/tablet responsive pass** (2026-08-24) — `Sidebar` renders as a bottom icon bar below the `lg` breakpoint (1024px) instead of the left rail everywhere; `_app.tsx`'s `<main>` reserves bottom padding on mobile so the bar doesn't cover content. Every page under `_app/*` got a pass: stacking toolbars, `overflow-x-auto` on tables, viewport-relative modal widths, responsive grids, reduced outer padding on small screens.
  - **Landmine worth remembering**: `__root.tsx` imports `@lmsproject/ui/globals.css` purely for its `--font-heading`/Google Fonts side effect — nothing in the app imports actual components from that package anymore (only a commented-out reference remains in `index.tsx`). TanStack Start always injects that stylesheet's `<link>` *after* the app's own compiled CSS (confirmed reordering the two import statements in `__root.tsx` does **not** change this — the dev-styles link is forced last unconditionally), and both stylesheets share Tailwind's `utilities` cascade layer. So any bare/unconditional utility class that also happens to appear somewhere in that old package's own leftover source — currently a small, essentially arbitrary set: `flex`, `flex-col`, `items-center`, `justify-between`, `flex-1`, `p-3`, `p-4`, `px-3`, plus a handful of colors/sizing classes — permanently overrides any `sm:`/`lg:`-scoped override of that same CSS property in the app, **at every screen width**, not just below some breakpoint. The only real fix: never pair one of those specific bare classes with a responsive override of the same property on the same element — scope *both* sides instead (`max-lg:flex-col lg:flex-row`, not `flex-col lg:flex-row`). Every instance from this pass was found by cross-referencing every class that stylesheet defines against every responsive pair introduced; a future responsive change should re-check the same way, or (better, not yet done) finally drop the dead `@lmsproject/ui` dependency and move the two CSS declarations it actually provides straight into `apps/platform/src/styles.css`.
- **Public landing page (`/`) fully rebuilt, replacing the Hour 1–3 mock content** (2026-08-25) — single page, anchor-nav driven (`Navbar` scroll-spies each section via `IntersectionObserver` and highlights the active link; smooth-scrolls via `html { scroll-behavior: smooth }` + `scroll-mt-20` per section; collapses to a hamburger menu below `lg`). Sections, in order: Hero → `InstagramMarquee` → `TentangKami` (Tentang Kami) → `NiatTujuan` (Visi & Misi) → `ProgramFasilitas` (Program & Fasilitas) → `Testimonials` (Testimoni) → `Registrasi` → `Faq` → `Footer`. All real content supplied by the user (Indonesian copy, WhatsApp registration link, FAQ answers), not placeholder.
  - `Faq.tsx` reads from `apps/platform/src/data/faq.json` (per explicit request) and renders as an accordion.
  - `Registrasi.tsx` is a single WhatsApp deep-link CTA (`wa.me/6285282821607`), no form/backend involved.
  - Real branding instead of a placeholder leaf emoji: new public endpoints `GET /public/stats` (teacher/student/subject counts + total session hours, aggregated from existing tables — no PII) and `GET /public/branding` (just `logoUrl`, sourced from the existing `ReportSettings.logoUrl` so the same logo used in Report/Invoice PDFs now also drives the Hero image and the browser favicon, swapped in client-side once fetched via `useBrandLogo()`). Both endpoints are intentionally unauthenticated — safe since they expose only aggregate counts / a public-facing image, never user data.
  - Decorative section icons use lucide-react, not emoji (explicit request) — including a small custom `ArabicLetterIcon` component (renders the literal letter "ا") for Bahasa Arab, since lucide's `Languages` icon depicts a CJK character and visually reads as Mandarin, not Arabic — no Arabic-script icon exists in lucide.
  - Lightweight scroll-reveal animation (`Reveal.tsx`, `IntersectionObserver` + the existing `animate-fade-slide-up` keyframe) reused across every section — no animation library added.
- **`InstagramMarquee` component** (2026-08-25) — an infinite left-to-right auto-scrolling row of the account's latest posts (`@ilmin_naafi`), shown right below the Hero.
  - Frontend (`InstagramMarquee.tsx`): pure-CSS marquee (`@keyframes marquee-right` in `styles.css`, same pattern as `fade-slide-up`) — content duplicated exactly 2x at `width: max-content` so `translateX(-50%)` always shifts by exactly one set's width regardless of item count/width; pauses on hover. Edge fade + `border-x-2` frame added so cards don't look abruptly clipped at the viewport edge. Falls back to 6 gradient placeholder cards whenever there's no data yet (`posts.length === 0`).
  - **Architecture changed same-day, superseding the original design**: first built against Instagram's own Graph API (OAuth app, long-lived access token, `InstagramPost`/`InstagramSettings` DB tables, `node-cron` weekly sync + token refresh) — then torn out entirely once the user judged the Meta Developer setup too much friction for a 10-post weekly feed. Replaced with a much simpler design the user proposed: a hand-maintained JSON file hosted at a public Dropbox direct-download link.
    - `GET /public/instagram-posts` (`routes/public.ts`) fetches `INSTAGRAM_POSTS_JSON_URL` directly, cached in-memory for 1 hour (module-level variable, not DB-backed) to avoid hitting Dropbox on every page view. No cron job, no DB table, no OAuth, no token refresh — the Dropbox file itself is the entire data store.
    - Expected JSON shape at that URL: `[{ "imageUrl": "https://.../poster.jpg?raw=1", "permalink": "https://www.instagram.com/p/XXXX/", "caption": "optional" }, ...]` — hand-maintained by whoever runs the account; the link must be the *direct* file URL (Dropbox's normal "copy link" is a share-page, not a raw file — needs `?raw=1` or `?dl=1` depending on link format).
    - Verified end-to-end with a local stand-in file server before considering this done (real Dropbox link not tested yet, since none has been created).
  - **Still blocked on the user, not code**: needs an actual public Dropbox link + hand-written JSON file, then `INSTAGRAM_POSTS_JSON_URL` set in `.env`. Until then the endpoint returns `[]` and the marquee shows placeholders — intentional graceful degradation.
  - **Trade-offs & hidden costs, called out per standing instruction ([[feedback_explain_server_tradeoffs]])**:
    - Removes essentially every cost the Graph API version had (no background timer, no OAuth/token-refresh dependency, no DB writes, no Meta ToS/rate-limit/deprecation exposure).
    - What's left: Dropbox is known to throttle/block public links that see heavy traffic (a "this link is generating a lot of traffic" page in place of the file) — unlikely to matter at this site's scale, but not infinitely scalable the way the old design's failure mode wasn't either.
    - The manual-curation burden didn't disappear, it moved: someone has to hand-edit a JSON file and manage individual Dropbox share links every time the featured posts change — comparable effort to the in-app-admin-panel alternative that was also considered, just using Dropbox + a text file as the "CMS" instead of this app's own UI. A malformed JSON edit will silently keep serving the last good cached copy for up to an hour, then start returning `[]` (placeholders) rather than erroring loudly.
- **Payroll module added** (2026-08-26) — a genuinely new domain, not spec'd anywhere above; finally starts filling the billing gap this doc has flagged as open since the top ("Rule reference" note 1 / the `Payment` model that was never built). This is teacher payroll specifically, not the parent-facing billing formula from that original rule — the two are related but distinct, and rule 1's gap (PRESENT/expected × price billing to parents) is still open.
  - Four business rules were confirmed explicitly with the user before writing any code, since this is real financial math (see [[feedback_commodity_vs_core]]):
    1. **Manual price entry is per-student**, not per-group — even two students in the same group can be charged different negotiated amounts.
    2. **Historical accuracy for past months**: a payslip for a past period shows the teacher's groups and each group's students *as they stood at the end of that month*, not today's roster. This required adding an optional `asOf: Date` parameter (defaulting to `new Date()`, so every existing caller's behavior is unchanged) to `getCurrentStudentIds`/`getCurrentGroupIdsForTeacher` in `groupState.ts` — the first time this codebase's audit-log replay has supported a historical query instead of only "as of right now."
    3. **`totalGroup`** on the period dashboard counts distinct groups covered by payslips *actually created* for that period, not all active groups — so it reads 0 until at least one payslip exists.
    4. **Duplicate payslips are blocked** — `@@unique([payrollId, teacherId])` on `Payslip`, enforced with a friendly 409 rather than a raw constraint error.
  - **The two totals confirmed via a worked example, not assumption**: a teacher's `TeacherRate` for a group type is charged **once per student enrolled in that group**, not once per group — e.g. a Semi-Private group with 2 students contributes 2× that rate to cost, regardless of each student's individual attendance that month. Neither cost nor profit is attendance-weighted; attendance (`sessionsAttended`/`sessionsTotal`) is captured for display/context only. The session-count denominator only counts sessions with `attendanceRecorded: true` — an unrecorded session isn't evidence of absence, so including it would unfairly deflate every student's fraction for what's actually the teacher's bookkeeping gap.
  - **Data model — corrected same-day after the first pass flattened a real entity into a query filter**: the first version had no `Payroll` model at all — a "period" was just a `month`/`year` filter directly on `Payslip`, with totals computed from a raw `WHERE` query. The user caught this: a month of payroll is a real parent entity that many payslips belong to, not an implicit grouping. Corrected to `Payroll` (`id, month, year`, `@@unique([month, year])`) ← hasMany → `Payslip` (`payrollId` FK, `@@unique([payrollId, teacherId])`) ← hasMany → `PayslipLine`. `TeacherRate` (per-teacher, per-`GroupType` flat monthly rate — reuses the existing `GroupType` enum, edited in Settings → User) is unaffected by this correction. A `Payroll` row is only created lazily, at the moment its first `Payslip` is (`prisma.payroll.upsert` in `POST /payroll/payslips`) — merely viewing an empty period in `GET /payroll` does not create one, it just returns zero totals. Every numeric fact on a `PayslipLine` — `sessionsAttended`, `sessionsTotal`, `groupTypeSnapshot`, `teacherRateSnapshot` — is still computed authoritatively server-side and frozen at creation time (the `InvoiceLine.price` precedent). Confirmed explicitly with the user as a second core-domain decision: aggregates (`totalRevenue`/`totalCost`/`totalProfit`/`totalGroup`) are **not** stored columns on `Payroll` — always computed live from its `Payslip`/`PayslipLine` rows on every read, so they can't drift out of sync with what they summarize, matching this project's no-denormalization convention.
  - **Routes**: `apps/api/src/routes/payroll.ts` — `GET/PATCH /teachers/:id/rates`, `GET /payroll?month=&year=` (aggregate), `GET/POST/DELETE /payroll/payslips` + `GET /payroll/payslips/:id`, `GET /payroll/create-payslip-data?teacherId=&month=&year=` (the roster/session-fraction/rate preview the "Create Payslip" modal renders). All admin-only.
  - **Frontend**: new `/payroll` route (period picker, 4 stat cards, payslip list, Create Payslip modal) and `/payroll/$payslipId` (line-item detail), new Sidebar nav entry (`Wallet` icon — no financial icon existed in the app before this). Settings → User's Edit modal gained a per-group-type rate editor for teacher-role users, saving independently of the name/email/gender fields via its own `PATCH /teachers/:id/rates` call.
  - Verified end-to-end against real seeded data (not just typecheck) both before and after the `Payroll` model correction: set real rates on the actual "Ustadzah Lisna" seed teacher, fetched a live create-payslip preview, created a real payslip, confirmed the period aggregate math matched by hand, confirmed the duplicate-payslip 409, confirmed the detail endpoint's month/year correctly resolve through the new `payroll` relation, then deleted the test payslip each time (kept the rate configuration as realistic reference data). The frontend needed zero changes across the correction — the API's JSON response shape was kept identical on purpose.
  - No meaningful server-side trade-offs to flag here per [[feedback_explain_server_tradeoffs]] — this is ordinary new tables + CRUD routes, no cron job, no external dependency, no background process.
  - **Payslip PDF download added** (2026-08-26) — mirrors the existing Invoice PDF pattern exactly: `apps/api/src/pdf/PayslipDocument.tsx` (new `react-pdf` template + `renderPayslipPdf`) rendered by `GET /payroll/payslips/:id/pdf`, downloaded client-side via the same `downloadFile` helper already used for invoices, with a Download-icon button added both to each row of the `/payroll` payslip table and to the `/payroll/$payslipId` detail page. One deliberate design call, not asked of the user because it follows directly from the payslip/invoice distinction already established above: the PDF shows only the teacher's own per-line rate/earnings (`teacherRateSnapshot`) and total, never the parent-facing `price` a family was billed — that figure is the school's margin, not the teacher's business. Verified end-to-end against the real seeded "Ustadzah Lisna" payslip (not just typecheck): downloaded the PDF via curl, confirmed `Content-Type: application/pdf` and a correct `Content-Disposition` filename, and extracted its text to confirm the rendered total (Rp 300.000 = 3 × the Rp 100.000 group-type rate) matches `teacherRateSnapshot` math and that no `price` figure leaks into the document.
- **Self-service Profile page built out** (2026-08-26) — the `/profile` route existed only as a placeholder stub before this; every field on it is now real and self-editable by whichever user is logged in (admin/teacher/student), separate from the admin-only editing already available at Settings → User.
  - **New model**: `TeachingHistory` (`teacherId` FK, `startYear`, `endYear`, `organization`) — a teacher's freeform prior-employment record, hasMany off `Teacher`, fully self-managed (add/delete) from the Profile page. Not modeled as anything richer since these are outside organizations this system has no other relationship with.
  - **New fields**: `User.bio`/`address`/`phone` (any role); `Student.school` (new `School` enum, `MEDINA_INTERNATIONAL_SCHOOL` | `AL_WILDAN_INTERNATIONAL_ISLAMIC_SCHOOL` — deliberately an enum, not a free-text field or a full CRUD-able table, since the user framed it as a small fixed list "for now"; adding a school later is a one-line enum change + migration, matching this codebase's existing convention for small controlled vocabularies like `GroupType`/`Gender`); `Teacher.title` (new `TeacherTitle` enum, `S_PD` | `S_T` | `LC`, nullable/optional per the user's spec).
  - **Routes**: `apps/api/src/routes/profile.ts` — `GET/PATCH /profile` (self, any authenticated role) and `POST/DELETE /profile/teaching-history` (teacher-only, ownership-checked on delete). Deliberately separate from `usersRouter`'s admin-only `/users` endpoints rather than reusing them — a self-edit has a different auth shape (`requireAuth` keyed off the caller's own id, no `requireRole("ADMIN")`) and a different allowed-field set (no `name`/`email`/`isActive`, which stay admin-managed).
  - **Validation**: avatar reuses the existing PNG/JPEG/WEBP/GIF-under-300KB data-URL check (duplicated locally per this codebase's established small-helper-per-file convention, same as `groupTypeLabel` in `payroll.ts`); status/bio is capped at 300 words server-side (`countWords`, whitespace-split — not a DB constraint); `school`/`title` are 400-rejected if sent by the wrong role (a teacher can't set a school, a student can't set a title) or if the value isn't in the allowed list.
  - Judged as commodity UI, not core-domain (per [[feedback_commodity_vs_core]]) — no confirmation questions asked before implementing, since none of this touches billing/attendance/audit-log math.
  - Verified end-to-end against real seeded accounts (not just typecheck): logged in as both the teacher "Ustadzah Lisna" and the student "Maryam", fetched and patched each one's own profile (bio/address/phone/gender plus their role-specific field), confirmed the opposite-role field is rejected with 400 for each, confirmed a 301-word bio is rejected, added and then deleted a real `TeachingHistory` entry for Lisna (confirming a student gets 403 on the same endpoint), and confirmed the `/profile` page itself renders (200) on the dev server.
- **Invoices/Payroll/Settings locked to admin-only** (2026-08-27) — `GET /invoices` and `GET /invoices/:invoiceId/pdf` were previously role-scoped (teachers saw invoices for their groups, students saw their own); per the user's explicit call, both are now `requireRole("ADMIN")` and the dead role-branching logic was removed. Payroll and the other Settings endpoints were already admin-only server-side. Closed one real gap found in the process: Settings → Group and the Settings → Assignment stub relied on the shared `GET /groups` endpoint, which is *intentionally* role-scoped for the actual Groups feature (returns 200, not 403, for a teacher/student) — so those two Settings pages never triggered their own "unauthorized" state. Added an explicit client-side admin check to both instead of touching the shared endpoint. `Sidebar.tsx` now hides the Invoices/Payroll/Settings nav items entirely for non-admin roles via a new `adminOnly` flag on `navItems`. Noted but left alone (out of the requested scope): `/users` has the same class of gap — backend admin-only, but still visible in the Sidebar to every role.
- **Header shows the real logged-in user** (2026-08-27) — `Header.tsx`'s avatar/name was hardcoded to "Admin" with a generic icon; it now fetches `GET /profile` on mount and shows that user's actual name and avatar (falling back to colored initials, matching the avatar-circle convention used elsewhere), with an instant fallback to the cached `mockUser.name` so there's no blank flash before the fetch resolves. The avatar/name block now links to `/profile`.
- **Dashboard "Verse of the Day"** (2026-08-27) — a small card above the calendars showing a daily Quran verse in Arabic (RTL), English, and Indonesian.
  - **Went through two iterations on sourcing, both driven by the user's questions rather than assumed upfront**: v1 hand-typed 10 well-known short verses into a local `dailyVerses.json`, rotating by day-of-year client-side — zero server cost, can't fail, but accuracy was bounded by what I could reliably recall, and coverage was capped at 10 verses. When the user asked why not use an open Quran API, v2 replaced this with `GET /public/daily-verse` (`apps/api/src/routes/public.ts`), which fetches live from `api.alquran.cloud` (free, no key) for a small rotating pool of ~14 candidate `surah:ayah` references — chosen for reading coherently in isolation (not mid-narrative/legal-context verses), but the actual Arabic/English/Indonesian text always comes from the API now, not memory. Spot-checking the API against the original hand-typed text after the switch showed they matched almost exactly — a reasonable, but not certain, outcome to have assumed in advance.
  - **Trade-off, per [[feedback_explain_tradeoffs]]**: the API version trades zero-cost/can't-fail for a real external dependency — one more service that can rate-limit, go down, or deprecate. Mitigated with the same graceful-degradation pattern as the Instagram feed: cached per calendar day (one external call per day, not per page view) with try/catch falling back to the last good cache, and finally to one small hand-checked static verse if even that's empty — this feature is designed to never be the reason the Dashboard breaks.
  - The local `dailyVerses.json` was deleted once the API path replaced it as the only data source.
- **Real notification system added** (2026-08-27) — the Header's bell dropdown was fully fake (hardcoded "3" badge, two static placeholder rows, a no-op "Mark All as Read" button). Replaced with a genuine per-user `Notification` model and three real event triggers, scoped deliberately narrow rather than a generic "notify on everything" system:
  1. **Report submitted → the student** (`reportsRouter`, both the create-with-`submit:true` path and the dedicated `/submit` endpoint, guarded so re-hitting an already-submitted report doesn't re-notify).
  2. **Assignment posted → every currently enrolled student** (`assignmentsRouter`, on create; fires regardless of draft/finished status since the assignments page itself doesn't gate on that either).
  3. **Assigned to a group → that teacher/student** (`groupsRouter`, on `ASSIGN`/`JOIN` only, both at group-create and group-edit time — not on `REMOVED`/`LEAVE`, which isn't something to celebrate).
  - **A fourth trigger was deliberately dropped**: "payslip created → the teacher" was in the original list of options but the user said "no need yet" once I flagged that it would be a dead-end link — Payroll has been admin-only from the start, so a teacher has no page to view their own payslip on today. Revisit if/when teacher-scoped payslip access gets built.
  - **Schema**: `Notification` (`userId` FK, `type` enum `REPORT`/`ASSIGNMENT`/`GROUP_ASSIGNMENT`, `title`, `message`, nullable `link`, `readAt`) — one row per recipient per event (a 5-student assignment creates 5 rows), not fanned out at read time, trading some duplication for simplicity.
  - **Routes**: `apps/api/src/routes/notifications.ts` — `GET /notifications` (own list, capped at 30, plus `unreadCount`), `POST /notifications/:id/read` (ownership-checked, confirmed a different user gets 404 not someone else's notification), `POST /notifications/read-all`. `apps/api/src/utils/notify.ts` centralizes the `prisma.notification.create` call so all three trigger sites share one shape.
  - **Frontend**: `Header.tsx`'s bell now fetches real data — badge only renders when `unreadCount > 0` (capped display at "9+"), each row shows a per-type icon and an unread dot, clicking a row marks it read and navigates to its `link` (or just marks read if `link` is null), "Mark All as Read" actually works.
  - Admin intentionally gets no notification feed (confirmed with the user) — admin already sees everything directly through the admin-only pages, so the bell shows an empty state for that role rather than needing admin-specific event types.
  - Verified end-to-end against real seeded accounts, not just typecheck: as admin, created a real assignment in a group Maryam (student) is enrolled in and confirmed she received it with the correct link/message; created and submitted a real report for her and confirmed a second, independent notification; removed and re-assigned Ustadzah Lisna (teacher) to a group and confirmed the group-assignment notification fired only on the re-`ASSIGN`, not the `REMOVED`; confirmed `POST /notifications/:id/read` 404s when a different user tries it; confirmed `read-all` zeroes `unreadCount`; deleted all test assignment/report/notification rows afterward.

---

## Data Model Decisions
_Last updated: 2026-04-30_

> This diagram predates the Post-Plan Additions above. It does not include `PlannedSession`, `User.avatarUrl`, `Invoice`, or `ReportTheme`/`Subject.reportThemeId`. `Assignment` here describes the rich Hour 14–19 quiz-builder version — the actual model is still a minimal placeholder. `Report` here describes the Hour 20–23 criteria-rating version — the actual model was fully redesigned (Month/Year/Student/Progress/Advice/Score + a submitted/read receipt + a themed PDF export) and is neither this nor the placeholder anymore. See Post-Plan Additions for what's real today.

### Core Entities
```
Subject              → the curriculum (Tahsin, Tahfizh, Bahasa Arab, Bahasa Inggris)
Group                → a set of students + teacher studying a Subject (replaces "Class")
Session              → a log of a completed meeting, created by teacher after class
GroupEnrollment      → audit log of student joins/leaves per Group
GroupTeacher         → audit log of teacher assignments/switches per Group
GroupPricing         → price history per Group (new record on price change)
SessionAttendance    → per-session attendance per student
Assignment           → monthly multiple choice quiz created by teacher per Group
AssignmentQuestion   → individual question with options and correct answer
AssignmentSubmission → student's completed attempt with auto-calculated score
AssignmentAnswer     → student's selected option per question
Report               → free text monthly report written by teacher per student
Payment              → monthly billing record per student per Group
```

### Business Rules
- 1 Subject → many Groups
- 1 Group → many Sessions, many Students (via GroupEnrollment), 1 active Teacher
- Bill = (PRESENT sessions / expectedSessionsPerMonth) × pricePerMonth
- Sessions are logged after the fact by the teacher — no pre-scheduling
- Student absent → not billed for that session
- Student always enrolled from start of month — billing always filtered per month
- Payment method: bank transfer with proof of transfer image
- Payment status: PENDING → VERIFIED (admin manually verifies)
- Monthly cycle: Teacher creates Assignment → Students answer → Teacher writes Report → Student sees score + report

### Mock ID Convention
```
userId:    usr-{seq}   → usr-01, usr-02
teacherId: te-{seq}    → te-01, te-02, te-03
studentId: st-{seq}    → st-01, st-02, st-03
groupId:   gr-{seq}    → gr-01, gr-02, gr-03
subjectId: sub-{seq}   → sub-01, sub-02, sub-03
sessionId: s-{seq}     → s-01, s-02, s-03
```

### User & Role Architecture

- No separate Admin table — `role: "admin"` on User is sufficient, admins have no extra profile data
- Teacher and Student have separate profile tables linked via `userId`
- IDs everywhere should be **strings** (cuid/uuid) — never integers, to match Prisma defaults and avoid mock-to-real mismatch in Phase 7

```
User    → id (cuid), email, password, role ("admin" | "teacher" | "student")
Teacher → id (cuid), userId, name
Student → id (cuid), userId, name
```

### Key Models (for Prisma schema in Phase 6)

**Group**
- id, subjectId, name, expectedSessionsPerMonth

**GroupEnrollment**
- id, groupId, studentId, action (JOIN | LEAVE), date

**GroupTeacher**
- id, groupId, teacherId, action (ASSIGN | REMOVED), date

**GroupPricing**
- id, groupId, pricePerMonth, effectiveFrom

**Session**
- id, groupId, teacherId, date, createdAt

**SessionAttendance**
- id, sessionId, studentId, present (boolean)

**Assignment**
- id, groupId, teacherId, month, year, title

**AssignmentQuestion**
- id, assignmentId, question, options (string[]), correctAnswer (string)

**AssignmentSubmission**
- id, assignmentId, studentId, score, submittedAt

**AssignmentAnswer**
- id, submissionId, questionId, selectedOption (string)

**Report**
- id, groupId, studentId, teacherId, month, year, content, publishedAt

**Payment**
- id, studentId, groupId, month, year, amount, proofOfTransfer, status (PENDING | VERIFIED)

---

## Build Order Summary

```
Landing (H1–3) → Login (H4) → App Shell (H5)
→ Dashboard UI mock (H6–9) → Classes UI mock (H10–13)
→ Assignment UI mock (H14–19) → Progress Report UI mock (H20–23)
→ Backend APIs (H24–33) → Connect everything (H34–39)
→ Deploy (H40)
```

> **Rule:** If you get stuck on a UI component, drop a `// TODO: connect to API` comment and move on. The goal in Phase 1–5 is pixel-perfect UI with clean mock data. APIs come after.