# Engineering Log

This folder is a personal engineering log for working through a Backend
Engineering Curriculum for LMS Ihsanify (7 stages, 0–6, covering orientation,
transactions, database performance, authorization, testing/CI, observability,
and system design), using this repository as a lab. It exists to turn each
session's work into
evidence: what was investigated, what was decided, what was measured, and
what is still unknown — the kind of record that can be told as an interview
story later, not just remembered.

This is a personal learning record, not product documentation. Findings,
diagrams, and risk assessments inside it are a snapshot of what was known
at the time they were written, not a claim about the current state of the
app — check the code itself for that.

## How to use this

- Work in small iterations, one real problem at a time.
- Close every session with **one commit** and **one entry in
  [`journal.md`](./journal.md)**, even if the entry is short.
- When a non-trivial technical decision gets made, write it up in
  [`decisions/`](./decisions/) using the template.
- When something gets measured (a benchmark, a before/after), write it up in
  [`experiments/`](./experiments/) using the template.
- Each curriculum stage has its own file under [`stages/`](./stages/) —
  update its checklist and notes as deliverables are completed.
- If an audit turns up a real risk (security, data loss, correctness), file
  it as a GitHub issue using the `risk` issue template
  (`.github/ISSUE_TEMPLATE/risk.md`) instead of only noting it here.

## Stage index

| Stage | Focus | Status | File |
|---|---|---|---|
| 0 | Repo orientation & baseline | not started | [tahap-0-orientasi.md](./stages/tahap-0-orientasi.md) |
| 1 | Transactions & data integrity | not started | [tahap-1-transaksi.md](./stages/tahap-1-transaksi.md) |
| 2 | Database profiling & optimization | not started | [tahap-2-performa-database.md](./stages/tahap-2-performa-database.md) |
| 3 | Authorization & API security | not started | [tahap-3-authorization.md](./stages/tahap-3-authorization.md) |
| 4 | Testing, CI & error handling | not started | [tahap-4-testing-ci.md](./stages/tahap-4-testing-ci.md) |
| 5 | Observability, backup & recovery | not started | [tahap-5-observability.md](./stages/tahap-5-observability.md) |
| 6 | Background jobs & system design | not started | [tahap-6-system-design.md](./stages/tahap-6-system-design.md) |

Status values: `not started` / `in progress` / `done`.
