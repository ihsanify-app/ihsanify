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
- ✅ Hour 1 — Landing Page: Hero + Nav
- ✅ Hour 2 — Landing Page: Features + Teachers Section
- ✅ Hour 3 — Landing Page: Success Stories + Footer
- ✅ Hour 4 — Login Page

**Phase 2 — Dashboard UI**
- ✅ Hour 5 — App Shell & Layout
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
  - `GET /groups/:id/reports/:reportId/pdf` — new endpoint, reuses the exact same visibility rule as the report itself (teacher/admin see any report including drafts; a student only their own submitted-or-later report). Renders via `@react-pdf/renderer` (chosen over an HTML+Puppeteer approach to avoid a headless-Chromium runtime dependency) into a themed one-page PDF and streams it back.
  - Scope note: this is a functional v1, not a redesign of the real example report PDFs supplied — no cover page, no Arabic Bismillah text/floral decorations (would need proper Arabic-script font embedding, deferred), no per-report cover photo (deferred, agreed to use the theme color instead).
- **Settings page redesigned into tabs** (2026-08-18) — `/settings` now redirects to `/settings/report`, with a shared `SettingsTabs` bar (same pattern as `GroupTabs`) across six sub-routes: Report, Subject, User, Group, Invoice, Assignment.
  - `/settings/report` — the report-theme-per-subject table above.
  - `/settings/subject` — new, real: `POST /subjects` + an Add Subject modal, not a placeholder.
  - `/settings/user`, `/settings/group`, `/settings/invoice`, `/settings/assignment` — placeholder pages only ("coming soon" / "not planned yet"), reserving the destinations for later: a Group-card color theme system (mirroring `ReportTheme` but for the Groups list), Invoice header/footer config, and User settings, none of which have been designed yet.

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