# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
via the root `package.json` `version` field.

## [Unreleased]

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
