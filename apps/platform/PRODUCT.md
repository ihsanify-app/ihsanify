# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two distinct audiences share this app:

1. **Prospective parents/guardians** of children roughly aged 4–18, and adult women (ummahat) evaluating the program for themselves — visiting the public landing page to judge whether this is a trustworthy, structured Quran-centered Islamic education option, usually on mobile, deciding quickly and then following up over WhatsApp.
2. **Enrolled-family teachers, students, and the school's own admin staff** — the day-to-day users of the Ihsanify LMS dashboard (scheduling, attendance, reports, assignments, invoices, payroll, profile, notifications).

## Product Purpose

Madrasatul 'Ilmin Naafi' is an online Islamic learning center teaching Tahsin, Tahfizh, Bahasa Arab, Bahasa Inggris, and Calistung to children and adult women. Ihsanify is its own purpose-built LMS running the entire operation end to end: scheduling, attendance, monthly progress reports, assignments, invoicing, and teacher payroll. Success means parents trust the school enough to enroll, and staff can run the whole teaching operation inside one system instead of coordinating ad hoc.

## Positioning

The integrated Ihsanify LMS itself is the differentiator, per the user's explicit answer: most comparable home-based/online Islamic learning setups coordinate via WhatsApp/Zoom ad hoc with no unified system. Ihsanify gives parents transparent monthly progress reports and gives the school one place for scheduling, reporting, invoicing, and payroll — a neighboring school without a real LMS could not truthfully claim the same.

## Operating Context

Sessions run online/remote, organized as recurring weekly Group / Private / Semi-Private class types. Teachers submit monthly per-student progress reports (Month/Year/Progress/Advice/Score); these stay invisible to the student until explicitly submitted, then move through a submitted → read receipt. Admin generates per-student, per-group monthly invoices and per-teacher monthly payroll (computed from per-group-type rates and recorded attendance). New-family registration happens over a real WhatsApp conversation with admin, not a self-serve signup form.

## Capabilities and Constraints

- **Groups**: Group / Private / Semi-Private types. Teacher assignment and student enrollment are tracked as an audit log of JOIN/LEAVE and ASSIGN/REMOVED events, not plain foreign keys — history matters (e.g. a report for a past month must reflect who was enrolled *then*).
- **Reports**: draft until explicitly submitted (server-enforced visibility to the student), then submitted → read.
- **Assignments**: currently a basic per-group draft/finished list only; a cross-group "Assignments" hub is a placeholder menu, not built yet.
- **Invoices & Payroll**: admin-only by explicit decision this session — teachers and students currently have no page to view their own invoice/payslip.
- **Profile**: self-service per role (avatar, bio, address, phone, gender; student school selection; teacher title + teaching history).
- **Notifications**: real in-app notifications (not email/push) for report-submitted, assignment-posted, and group-assignment events only.
- **Web Analytics**: placeholder menu only, undecided whether it becomes internal usage tracking or a third-party embed.

## Brand Commitments

- The school's name is **"Madrasatul 'Ilmin Naafi'"**; the LMS/technology product is branded separately as **"Ihsanify"** ("Powered by Ihsanify"). Keep this distinction — don't merge the two identities into one brand.
- Founded 2021 as an online Tahsin/Tahfizh initiative during the COVID-19 pandemic, with real factual milestones through 2026 (Bahasa Arab added 2022, Bahasa Inggris 2023, monthly progress reports 2024, the Ihsanify LMS itself built 2026). This history must stay factually accurate under any redesign — restyle it, don't rewrite the facts.
- Registration routes to a real WhatsApp number with a pre-filled consultation message, not a generic contact form, unless the user says otherwise.
- The school states an explicit Al-Qur'an-dan-As-Sunnah / Salafus Shalih theological identity on the current landing page — recorded here as a real, factual fact about the institution's identity, not a redesign choice. **Not yet confirmed as a locked constraint**: when asked what must survive a redesign, the user selected the history timeline, the "Ihsanify" brand distinction, and the WhatsApp flow, but did not select this item. That may mean it's open to being restyled/reduced, or it may just not have made a short list — confirm intent before downplaying or removing it in new-work rather than assuming either way.

## Evidence on Hand

- Real founding timeline 2021–2026 (`apps/platform/src/components/landing/TentangKami.tsx`).
- Visi & Misi statements (`NiatTujuan.tsx`).
- Real FAQ content (`apps/platform/src/data/faq.json`).
- Hero Quran verse: QS. Al-Qamar:17 (`Hero.tsx`).
- Real WhatsApp registration link with a pre-filled message (`Registrasi.tsx`).
- Testimonials (`Testimonials.tsx`) use emoji avatars rather than photos, and first names matching this project's seeded demo student data (Maryam, Ibrahim, Ahmad) — likely illustrative/placeholder rather than verified real customer quotes. Do not present them as authoritative claims or expand on them without confirming with the user first.
- The Instagram marquee's content source (a hand-maintained JSON file at a public URL) is not configured yet as of this session — it currently shows placeholder cards.

## Product Principles

1. The integrated LMS is the actual competitive edge, not "just an app" — it's the stated reason to choose this school over an ad hoc alternative.
2. Real, factual history and credentials (timeline, teacher qualifications) are core trust-building content — never invent or exaggerate them.
3. The school's theological identity is a real institutional fact, independent of how prominently any given redesign chooses to visually feature it.
4. Registration funnels to a real human over WhatsApp, not a self-serve form — the landing page's job is to build enough trust to start that conversation, not to close a sale end-to-end.
5. One product, two very different surfaces: prospective-parent visitors deciding whether to enroll (Persuade), and already-enrolled teachers/students/admins running daily operations (Operate). A redesign spanning "all pages" needs to serve both without treating them the same way.
