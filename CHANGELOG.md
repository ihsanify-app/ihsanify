# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
via the root `package.json` `version` field.

## [Unreleased]

### Added

- Dashboard — a working home page: nearest-session card, mini calendar,
  group calendar, and an attendance-recording prompt, backed by a new
  planned-sessions API.
- Payroll — teacher payroll end to end: per-group-type monthly rates set
  per teacher (Settings → User), monthly Payroll periods each containing
  per-teacher Payslips with per-student line items, a Payroll menu showing
  period totals (revenue/cost/profit/group count), and PDF payslip export.
- Profile — a self-service profile page for every role: avatar upload,
  status, address, phone, and gender; a school selector for students; an
  optional academic title plus a teaching-history log for teachers.
- Landing page revamp — FAQ, Instagram post marquee, program & facilities,
  registration call-to-action, and "Tentang Kami" / "Niat & Tujuan"
  sections.
- Assignments menu now shows a "Coming Soon" placeholder pointing to the
  existing per-group Assignments tab, ahead of a dedicated cross-group hub.
- Landing page — a structured registration form (name, gender, domicile,
  subject(s), and how they heard about us) that opens from the "Daftar
  Sekarang" and "Chat Admin via WhatsApp" buttons and hands off a
  pre-filled WhatsApp message to the admin, backed by a new public
  subjects endpoint.
- Report PDF's "Dibuat oleh Pengajar" now shows the teacher's honorific:
  "Ustadz"/"Ustadzah" (or "Mister"/"Miss" for Bahasa Inggris) as a prefix,
  and the Arabic du'a "حَفِظَهُ اللهُ"/"حَفِظَهَا اللهُ" as a suffix, based on
  the teacher's gender and subject.
- Reports now track a manually-ticked "Sent" checkbox (`isSent`), for an
  admin/teacher to mark once they've handed the exported PDF to the
  student/parent outside the app (e.g. WhatsApp). Visible and toggleable
  by admin/teacher on both the top-level Reports page and a group's
  Reports tab.
- `/users` now has a "Group" column showing which group(s) a student is
  currently enrolled in or a teacher is currently assigned to teach.
- Group cards on `/groups` now show an overlapping avatar stack (photo or
  initials) plus each student's name, instead of just a student count, and
  a row of "This Month's Sessions" circles — one per session logged for
  that group in the current month, each marked with a checkmark and its
  day of the month.
- Online/last-seen presence: `User.lastActiveAt` is updated by `requireAuth`
  on any authenticated request (throttled to once per 60s). `/users` now
  shows it — a green dot on the avatar plus an "Online" / "Active Xm ago" /
  "Never active" status, computed with a 2-minute online threshold.

### Changed

- Responsive styling pass across the app (sidebar, dashboard, and other
  views) for phone and tablet screen sizes.
- Replaced the placeholder dashboard widgets (`TeacherGroupMindMap`,
  `WeeklySchedule`) with the working Dashboard above.
- Removed the redundant `status` field from the `Session` model, superseded
  by `attendanceRecorded`.
- Removed unused sections from the landing page.
- Landing page section order: Stats now has its own section right after
  the Hero (previously buried inside "Tentang Kami"), and FAQ now comes
  before the Registrasi call-to-action so objections are addressed before
  the ask.
- Landing page stats now show class count (all groups, active and
  inactive) instead of subject count, reordered to Jam Pembelajaran, Kelas,
  Pembelajar, Pengajar, and light up on hover.
- Landing page body copy switched to the Nunito font family and bumped up
  a size step for a friendlier, more readable feel.
- Landing page navbar now shows the real uploaded organization logo and
  "Madrasatul 'Ilmin Naafi'" instead of the placeholder icon and
  "Ihsanify".
- Admin WhatsApp number moved to an environment variable
  (`VITE_ADMIN_WHATSAPP_NUMBER`) instead of being hardcoded.

## [1.0.0] - 2026-08-21

First tracked version — a snapshot of what's in place so far, not a single
release. Future changes are added above as new dated entries.

### Added

- Groups, sessions, and attendance tracking, with recurring planned-session
  schedules.
- Monthly student reports with PDF export — cover page, Arabic-text
  support, and font size that scales with content length to avoid page
  overflow.
- Invoices — multi-group line items per student, auto-generated invoice
  numbers, bank/receiver details, sent-status tracking, PDF export.
- Role-based access (Admin / Teacher / Student) across groups, reports, and
  invoices.
- Settings pages for Report, Subject, Group, User, and Invoice
  configuration (branding, card colors, group types, subject codes,
  student numbers, bank details).
- Top-level Reports and Invoices views, each scoped to what the signed-in
  role is allowed to see.
