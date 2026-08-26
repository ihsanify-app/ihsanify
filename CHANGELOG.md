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

### Changed

- Responsive styling pass across the app (sidebar, dashboard, and other
  views) for phone and tablet screen sizes.
- Replaced the placeholder dashboard widgets (`TeacherGroupMindMap`,
  `WeeklySchedule`) with the working Dashboard above.
- Removed the redundant `status` field from the `Session` model, superseded
  by `attendanceRecorded`.
- Removed unused sections from the landing page.

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
