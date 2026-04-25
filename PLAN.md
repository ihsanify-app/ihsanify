# LMS Full Stack Curriculum — UI First
**Stack:** HonoJS (backend) · TanStack Router + Query (frontend)  
**Approach:** Build UI with mock data first → derive real API needs → connect  
**Starting point:** Auth/login done  

---

## PHASE 1 — Public Pages (Hours 1–4)

**Hour 1 — Landing Page: Hero + Nav**
- Navbar: logo, "Login" CTA button
- Hero section: headline, subheadline, "Get Started" button
- Use static mock content for now (school name, tagline)

**Hour 2 — Landing Page: Features + Teachers Section**
- "Why choose us" feature cards (3 icons + text blocks)
- Teachers showcase: grid of teacher cards (photo, name, subject)
- Use hardcoded mock array of 4–5 teachers

**Hour 3 — Landing Page: Success Stories + Footer**
- Student success stories: testimonial cards with quote, name, photo
- Stats bar: "X Students", "X Teachers", "X Classes"
- Footer: links, copyright

**Hour 4 — Login Page**
- Centered card layout: email + password fields, submit button
- Form validation (empty fields, bad email format)
- Error state: "Invalid credentials" inline message
- Loading spinner on submit
- On success → redirect to `/dashboard` (hardcoded for now)

---

## PHASE 2 — Dashboard UI (Hours 5–9)

**Hour 5 — App Shell & Layout**
- Sidebar nav: Dashboard, Classes, Assignments, Progress Reports, (Admin: Users)
- Top header: page title, notification bell icon, user avatar + name
- Role-aware nav: different items visible per role (use mock role flag)
- Mobile: collapsible sidebar

**Hour 6 — Notification Panel**
- Bell icon → slide-out panel
- Mock notifications list: "New assignment posted", "Grade updated", etc.
- Unread badge count on bell
- Mark all as read button

**Hour 7 — Dashboard: Admin View**
- Summary cards: Total Students, Teachers, Classes, Active Assignments
- Recent enrollments table (mock data)
- Quick action buttons: "Add Teacher", "Add Student", "Create Class"

**Hour 8 — Dashboard: Teacher View**
- "My Classes" cards: class name, student count, next assignment due
- Recent activity feed: "Student X submitted assignment Y"
- Upcoming assignments widget

**Hour 9 — Dashboard: Student View**
- "My Classes" cards: class name, teacher name, progress %
- Upcoming assignments list with due dates
- Latest progress report summary card
- Notifications feed

---

## PHASE 3 — Class & Enrollment UI (Hours 10–13)

**Hour 10 — Classes List Page**
- Grid of class cards: name, teacher, student count, schedule
- Admin: "Create Class" button → modal (name, teacher dropdown, description)
- Search + filter bar (by subject, teacher)
- Mock data array of 5–6 classes

**Hour 11 — Class Detail Page**
- Header: class name, teacher info, description
- Tabs: "Students" | "Assignments" | "Progress Reports"
- Students tab: enrolled students table, "Enroll Student" button (admin only)
- All tabs use mock data for now

**Hour 12 — User Management Page (Admin)**
- Tabs: "Teachers" | "Students"
- Table: name, email, role, status, actions (edit, deactivate)
- "Add Teacher" / "Add Student" button → form modal
- Mock data: 5 teachers, 10 students

**Hour 13 — Enrollment Flow UI**
- "Enroll Student" → searchable student picker modal
- Selected students list with remove option
- Confirm enrollment button
- Visual: enrolled student card in Students tab updates immediately (optimistic UI mock)

---

## PHASE 4 — Assignment UI (Hours 14–19)

**Hour 14 — Assignment List Page**
- Teacher view: list of assignments they created, status badge (Draft/Published)
- Student view: list of assignments with status (Pending/Submitted/Graded)
- "Create Assignment" button (teacher only)
- Mock data: 4–5 assignments per class

**Hour 15 — Assignment Builder: Shell**
- Multi-step form layout: Step 1 Title/Instructions → Step 2 Questions → Step 3 Settings
- Step indicator at top
- Assignment title, description, due date, max score fields
- "Add Question" button to proceed

**Hour 16 — Assignment Builder: Question Types**
- Question type selector: Multiple Choice | True/False | Short Answer | File Upload
- Multiple Choice: input for question + 4 answer options, mark correct answer radio
- True/False: question input + correct answer toggle
- Short Answer: question input + optional model answer for teacher reference
- File Upload: question input + accepted file types selector

**Hour 17 — Assignment Builder: Settings & Preview**
- Settings: time limit toggle, randomize question order toggle, max attempts
- Preview tab: shows assignment exactly as student will see it
- "Save Draft" and "Publish" buttons

**Hour 18 — Student Assignment Attempt Page**
- Shows assignment title, instructions, time limit countdown
- Renders each question type correctly:
  - Multiple choice → radio buttons
  - True/False → toggle buttons
  - Short answer → textarea
  - File upload → drag & drop zone
- Progress bar: "3 of 5 questions answered"
- "Submit Assignment" button with confirm dialog

**Hour 19 — Assignment Results Page**
- Teacher view: table of all student submissions, score, submitted at
- Click a student → see their answers side by side with correct answers
- Short answer / file upload: manual grade input field per question
- Student view: their score, correct/incorrect per question, teacher feedback

---

## PHASE 5 — Progress Report UI (Hours 20–23)

**Hour 20 — Progress Report List**
- Teacher view: list of reports they've created per class, month badges
- Student view: list of reports they've received, sorted by date
- "Create Report" button (teacher only)
- Mock data: 2–3 reports per student

**Hour 21 — Progress Report Builder (Teacher)**
- Select student from class roster dropdown
- Select period: month + year picker
- Predefined criteria rating scale:
  - Criteria rows: e.g. "Participation", "Assignment Completion", "Understanding", "Behavior"
  - Each row: 1–5 star/dot rating scale
  - Optional short note per criteria
- Overall summary textarea
- "Save Draft" / "Publish to Student" buttons

**Hour 22 — Progress Report View (Student)**
- Clean card layout: student name, class, period
- Each criteria displayed as a labeled progress bar or dot scale
- Overall summary section
- Teacher name + date published
- Print/export button (placeholder)

**Hour 23 — Progress Report: Admin Overview**
- Class-level report: table of all students + their latest rating per criteria
- Color coding: green (4–5), yellow (3), red (1–2)
- Filter by month/year
- "Export Report" button (placeholder)

---

## PHASE 6 — Backend APIs (Hours 24–33)

> Now that UI is done, we know exactly what we need. Build only what the UI actually calls.

**Hour 24 — Users & Auth Endpoints**
- `GET /me` — current user profile + role
- `PATCH /me` — update profile
- `GET /users` — admin only, list all users with role filter
- `POST /users` — create teacher or student (admin)
- `PATCH /users/:id` — update user
- Attach role to JWT payload

**Hour 25 — Classes & Enrollment Endpoints**
- `GET /classes` — list (filter by teacher/student based on role)
- `POST /classes` — create (admin)
- `PATCH /classes/:id` — update
- `GET /classes/:id` — detail with teacher info
- `GET /classes/:id/students` — enrolled students
- `POST /enrollments` — enroll student
- `DELETE /enrollments/:id` — unenroll

**Hour 26 — Assignment Endpoints**
- `GET /classes/:id/assignments` — list
- `POST /classes/:id/assignments` — create with questions array
- `PATCH /assignments/:id` — update (draft → published)
- `GET /assignments/:id` — full detail with questions
- `DELETE /assignments/:id`

**Hour 27 — Submission Endpoints**
- `POST /assignments/:id/submissions` — student submits answers
- `GET /assignments/:id/submissions` — teacher views all submissions
- `GET /assignments/:id/submissions/:studentId` — single student submission
- `PATCH /submissions/:id/grade` — teacher grades short answer / file upload

**Hour 28 — Progress Report Endpoints**
- `POST /reports` — teacher creates report (student, period, criteria ratings, summary)
- `GET /reports?studentId=&classId=&month=&year=` — filtered list
- `GET /reports/:id` — single report detail
- `PATCH /reports/:id` — update / publish

**Hour 29 — Notification Endpoints**
- `GET /notifications` — current user's notifications
- `PATCH /notifications/read` — mark all as read
- Auto-create notifications on: new assignment published, report published, submission graded

**Hour 30 — Dashboard Aggregate Endpoints**
- `GET /dashboard/admin` — counts + recent activity
- `GET /dashboard/teacher` — my classes summary + upcoming assignments
- `GET /dashboard/student` — enrolled classes + upcoming assignments + latest report

**Hour 31 — Validation, Guards & Error Handling**
- Zod schemas for all POST/PATCH bodies
- Role middleware: teacher-only routes, student-only routes, admin-only routes
- Standardized error format `{ error, message, status }`

**Hour 32 — Monthly Report Aggregate Endpoint**
- `GET /reports/monthly?month=&year=&classId=` 
- Returns per-student criteria averages
- Returns class-wide averages per criteria

**Hour 33 — Seed Script**
- 1 admin, 3 teachers, 10 students
- 3 classes with enrollments
- Assignments with all 4 question types
- Submissions + grades
- Progress reports for 2 months

---

## PHASE 7 — Connect UI to Real API (Hours 34–39)

**Hour 34 — Auth + /me connection**
- Swap mock role flag → decode JWT from `/me`
- Redirect logic based on real role
- Persist token, auto-logout on 401

**Hour 35 — Dashboard + Notifications**
- Replace mock dashboard data → `useQuery` to `/dashboard/:role`
- Wire notification panel → `GET /notifications` + mark-read mutation

**Hour 36 — Classes + Enrollment**
- Replace mock classes → `useQuery` to `GET /classes`
- Wire enroll/unenroll modals → `useMutation`
- Wire user management CRUD

**Hour 37 — Assignments**
- Wire assignment builder → `POST /classes/:id/assignments`
- Wire student attempt → `POST /assignments/:id/submissions`
- Wire grading table → `PATCH /submissions/:id/grade`

**Hour 38 — Progress Reports**
- Wire report builder → `POST /reports`
- Wire student report view → `GET /reports?studentId=`
- Wire admin overview → `GET /reports/monthly`

**Hour 39 — Polish: Loading, Errors, Empty States**
- Add loading skeletons to every page
- Error boundaries per route
- Empty state illustrations ("No assignments yet")
- Toast notifications for all mutations

---

## PHASE 8 — Deployment & Launch (Hour 40)

**Hour 40 — Deploy & Smoke Test**
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
- ❌ Hour 4 — Login Page

**Phase 2 — Dashboard UI**
- ❌ Hour 5 — App Shell & Layout
- ❌ Hour 6 — Notification Panel
- ❌ Hour 7 — Dashboard: Admin View
- ❌ Hour 8 — Dashboard: Teacher View
- ❌ Hour 9 — Dashboard: Student View

**Phase 3 — Class & Enrollment UI**
- ❌ Hour 10 — Classes List Page
- ❌ Hour 11 — Class Detail Page
- ❌ Hour 12 — User Management Page (Admin)
- ❌ Hour 13 — Enrollment Flow UI

**Phase 4 — Assignment UI**
- ❌ Hour 14 — Assignment List Page
- ❌ Hour 15 — Assignment Builder: Shell
- ❌ Hour 16 — Assignment Builder: Question Types
- ❌ Hour 17 — Assignment Builder: Settings & Preview
- ❌ Hour 18 — Student Assignment Attempt Page
- ❌ Hour 19 — Assignment Results Page

**Phase 5 — Progress Report UI**
- ❌ Hour 20 — Progress Report List
- ❌ Hour 21 — Progress Report Builder (Teacher)
- ❌ Hour 22 — Progress Report View (Student)
- ❌ Hour 23 — Progress Report: Admin Overview

**Phase 6 — Backend APIs**
- ✅ `GET /me` — current user profile
- ❌ `PATCH /me` — update profile
- ❌ Hour 24 — Users & Auth Endpoints (remaining)
- ❌ Hour 25 — Classes & Enrollment Endpoints
- ❌ Hour 26 — Assignment Endpoints
- ❌ Hour 27 — Submission Endpoints
- ❌ Hour 28 — Progress Report Endpoints
- ❌ Hour 29 — Notification Endpoints
- ❌ Hour 30 — Dashboard Aggregate Endpoints
- ❌ Hour 31 — Validation, Guards & Error Handling
- ❌ Hour 32 — Monthly Report Aggregate Endpoint
- ❌ Hour 33 — Seed Script

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

## Build Order Summary

```
Landing (H1–3) → Login (H4) → App Shell (H5)
→ Dashboard UI mock (H6–9) → Classes UI mock (H10–13)
→ Assignment UI mock (H14–19) → Progress Report UI mock (H20–23)
→ Backend APIs (H24–33) → Connect everything (H34–39)
→ Deploy (H40)
```

> **Rule:** If you get stuck on a UI component, drop a `// TODO: connect to API` comment and move on. The goal in Phase 1–5 is pixel-perfect UI with clean mock data. APIs come after.