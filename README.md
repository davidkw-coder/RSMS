# Intango Student Management System

A responsive React and Vite student administration app for the Intango Technical Secondary School DSE group practical. Student records, academic calculations, reports, and simulated sign-in are handled in the browser; no backend service is required.

## Requirements

- Node.js 20.19+ or 22.12+
- pnpm (the project includes `pnpm-lock.yaml`)

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Verify a production build with `pnpm build` and code style with `pnpm lint`.

## Demo sign-in

- Email: `admin@intango.edu`
- Password: `Student123!`

The login screen also supports creating a local demo account. Registered demo passwords are stored as salted PBKDF2-SHA-256 hashes, not plaintext. Authentication is for classroom demonstration only and is not a substitute for server-side identity management.

## Features

- Six assignment screens: login/registration, dashboard, add/edit student, student directory, student details, and reports.
- Protected React Router routes and a shared sidebar/header layout.
- Student create, search, class filter, detail, edit, and confirmed delete workflows.
- Subject mark entry with validation, calculated student averages, grade badges, and downloadable CSV reports.
- Dashboard and report statistics/charts derived from the same student records.
- Browser localStorage persistence and five sample records on first launch.
- Responsive desktop, tablet, and mobile layouts.

## Academic rules

These defaults are centralized in `src/utils/calculations.js`:

- A mark is valid when it is a number from 0 through 100. Blank marks are ignored.
- Student average is the arithmetic mean of valid subject marks. Students with no valid marks are ungraded, not assigned a zero.
- Pass mark: 50%. A student passes when their average is at least 50%; otherwise the student needs support.
- Grades: A = 80–100, B = 70–79.99, C = 60–69.99, D = 50–59.99, F = 0–49.99.
- Overall average is the mean of graded students' averages. Students with no valid marks are excluded. Pass/fail counts likewise include graded students only.

## Data flow

`src/utils/storage.js` loads the student list and session from localStorage when `App` starts. The app passes its one student collection through the authenticated route outlet; add, edit, and delete update this shared state, and an effect persists it. The dashboard, directory, student profile, and reports read from that same collection. Academic math lives in `src/utils/calculations.js`, so grade rules stay consistent across screens. Reusable UI such as the sidebar, statistic cards, badges, empty states, and student form is kept in `src/App.jsx` for a straightforward practical walkthrough.

## Screenshots checklist

- [ ] Login screen
- [ ] Registration screen
- [ ] Dashboard
- [ ] Add student form
- [ ] Student directory, including search results
- [ ] Student details
- [ ] Reports, including a class-filtered view

Capture the authenticated screens at desktop width and at least one narrow mobile width. Registration is a state of the login screen, so capture both states separately.

## Testing checklist

- [ ] Sign in with the demo credentials; confirm invalid credentials show an error.
- [ ] Register a local demo account; confirm a wrong password is rejected after sign-out.
- [ ] Add a student; confirm invalid email, duplicate email, and out-of-range marks are rejected.
- [ ] Search by student name and email; filter the directory by class.
- [ ] Open a student profile; edit details and marks; confirm the profile and statistics update.
- [ ] Delete a record and cancel/confirm the confirmation dialog.
- [ ] Filter reports by class and export a CSV.
- [ ] Refresh the browser and confirm student records and the session persist; sign out and revisit a protected route.
- [ ] Check the interface at desktop and mobile widths.
- [ ] Run `pnpm build` and `pnpm lint`.

## Group contributions

Record the actual group members and their work before submission:

- Member 1: [name] — project structure, navigation/authentication, dashboard.
- Member 2: [name] — student registration, directory, search, edit, and delete.
- Member 3: [name] — student details, reports, testing, and documentation.

For two-person groups, explain how the third set of responsibilities was shared. Every member should be ready to explain the complete application.

## Known limitations

- Data and demo accounts are stored in the current browser only. Clearing site data removes them; there is no synchronization between devices or users.
- This frontend-only authentication is not suitable for real personal or student data.
- Five sample records are seeded only when no student data exists in localStorage. Clear the `rsms_students_v1` key in browser storage to restore the initial examples.
- The app does not include server backups, role management, or institutional grading policies beyond the configurable defaults above.