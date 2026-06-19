# CapVault V2

CapVault V2 is the Google-first rebuild of CapVault for Sir Ralph Laviste's capstone workflow. The current app focuses on public student submission forms, Google Sheet-based class records, tracker visibility, teacher/adviser review, and final archive preparation.

Current state: the UI is React/Vite and the backend is Spring Boot. Workspace Sheet imports call the backend first, then the frontend can refresh students, tracker rows, tracker columns, project metadata, and deliverables from backend data. Public submissions, review notes, archive actions, and most screen state are still browser-local while the backend is expanded.

## Read This First

Before changing behavior, read these documents:

- `docs/SRS (2526-sem2-it332-41) (CapVault V2 - Google-first Pivot).md`
- `docs/SDD (2526-sem2-it332-41) (CapVault V2 - Google-first Pivot).md`
- `docs/CapVaultV2_Workflow_Pivot_Notes.md`
- `docs/CapVaultV2_UIUX_Scale_And_Live_Sheet_Concerns.md`
- `docs/CapVaultV2_Current_Batch_Actionable_Change_Instructions.md`
- `design-system/MASTER.md`

The V2 direction is not the old login-first vault. The main workflow is:

1. Sir connects public Google Sheets for Team Formation, Tracker, and Software Project Monitoring.
2. Sir publishes one form link per deliverable.
3. Students submit Google Drive PDF links through a Google-Forms-like CapVault form.
4. Student Number comes from Team Formation and auto-fills name/team when selected.
5. The tracker stores lateness values and submission state.
6. Sir/advisers review file checks and AI summaries.
7. Final accepted PDFs are prepared for archive.

## Repository Layout

- `frontend/` - Current CapVault V2 React + Vite app.
- `backend/` - Spring Boot backend foundation for secure Google/API work.
- `docs/` - SRS, SDD, transcript notes, pivot notes, and current UX/action docs.
- `design-system/` - UI/UX rules for the app.
- `legacy/` - Old CapVault implementation kept for reference only.

Do not build new V2 work inside `legacy/`.

## Requirements

Install these first:

- Git
- Node.js 20+ recommended
- npm, included with Node.js
- Java 21+
- Maven 3.9+

PostgreSQL is not required for the default local backend profile. The backend uses a local H2 database by default so teammates can run it immediately.

## How To Run Locally: Backend And Frontend

This is the section teammates should use first.

Use two terminals from the repo root.

Terminal 1, backend:

```powershell
cd backend
mvn spring-boot:run
```

Terminal 2, frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Check the backend:

```text
http://127.0.0.1:8080/api/health
```

The frontend expects the backend at `http://127.0.0.1:8080/api` by default. If the backend is not running, Workspace import falls back to the frontend public-Sheet importer where possible. For the current backend-backed flow, run both servers.

The default backend profile is `local`. It creates a local H2 database under `backend/data/`, which is intentionally ignored by Git. To run backend tests, use:

```powershell
cd backend
mvn test
```

## Run Backend With PostgreSQL

Create a PostgreSQL database first, then run:

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE='postgres'
$env:CAPVAULT_DB_URL='jdbc:postgresql://localhost:5432/capvault'
$env:CAPVAULT_DB_USERNAME='capvault'
$env:CAPVAULT_DB_PASSWORD='capvault'
mvn spring-boot:run
```

The same Flyway migrations run in both local and PostgreSQL profiles.

## Build And Preview

Use this before pushing larger UI or workflow changes:

```powershell
cd frontend
npm run build
npm run preview
```

Preview opens on the Vite preview URL printed in the terminal.

## Important Routes

- `/` - Command Center / teacher overview
- `/workspace` - Connect/import Team Formation, Tracker, and Software Project Monitor Sheets
- `/forms` - Publish, edit, unpublish, and copy/open deliverable form links
- `/submit/:slug` - Public student submission form
- `/tracker` - Class tracker table and selected student summary
- `/review` - Sir/teacher review view
- `/adviser` - Adviser-scoped review view
- `/archive` - Final archive preparation
- `/student` - Student status/dashboard view
- `/register` - Optional student account registration/login flow

## How To Test The Main Demo Flow

1. Start the backend and frontend.
2. Go to `/workspace`.
3. Import or refresh the three source Sheets:
   - Team Formation: Student Number, name, team code, member number, CIT account.
   - Tracker: deliverable columns and lateness values.
   - Software Project Monitor: project titles, software names, remarks, adviser/status, category.
4. Go to `/forms`.
5. Publish or edit a deliverable form.
6. Open the generated `/submit/...` link.
7. Select a Student Number, confirm auto-filled details, and submit a Drive PDF link.
8. Check `/tracker`, `/review`, `/adviser`, and `/student`.

Useful testing controls:

- `/workspace` -> **Refresh backend data** reloads imported backend data into the frontend.
- `/workspace` -> **Restore starter data** resets the browser state to the local starter dataset and disables backend auto-refresh until you import or refresh again.
- `/tracker` -> **Load all rows** shows every tracker row at once; **Use pages** returns to 25 rows per page.
- `/tracker` -> **Summary** opens the hidden tracker value counts.

## Current Data Behavior

The current V2 app still stores most interactive demo data in browser `localStorage` under:

```text
capvault.v2.workflow
```

This means:

- Data is local to your browser.
- Other teammates will not see your local changes unless they import the same Sheets or share code/state another way.
- Public form responses, adviser feedback, archive actions, and many UI choices are not persisted to the backend yet.
- If old test data appears, use **Restore starter data** in Workspace or clear the `localStorage` key in browser devtools.

Workspace imports now try the backend API first. If the backend is unavailable, the frontend falls back to the local public-Sheet importer so the demo can still run.

The backend currently persists imported Sheet data, workspace source records, deliverable records, tracker rows/cells, tracker columns, project metadata, and tracker writeback attempts in the local H2 database.

Use **Refresh backend data** in Workspace to reload backend students, tracker rows, tracker columns, project metadata, and deliverables into the frontend.

Use **Restore starter data** in Workspace to return to the local starter dataset for testing. This disables backend auto-refresh until you import a Sheet again or press **Refresh backend data**.

## Current Integration Status

Working now:

- React + Vite frontend.
- Spring Boot backend foundation.
- Backend health endpoint: `GET /api/health`.
- Backend workspace source endpoints:
  - `GET /api/workspace/sources`
  - `PUT /api/workspace/sources/{sourceType}`
- Backend deliverable endpoints:
  - `GET /api/deliverables`
  - `GET /api/deliverables/{id}`
  - `POST /api/deliverables`
  - `PUT /api/deliverables/{id}`
- Backend Sheet import endpoints:
  - `POST /api/sheets/import/TEAM_FORMATION`
  - `POST /api/sheets/import/TRACKER`
  - `POST /api/sheets/import/PROJECT_MONITOR`
  - `GET /api/sheets/import-runs`
- Backend imported data endpoints:
  - `GET /api/students`
  - `GET /api/projects`
  - `GET /api/tracker/columns`
  - `GET /api/tracker/rows`
  - `GET /api/tracker/writebacks`
- Backend tracker writeback endpoint:
  - `POST /api/tracker/writebacks`
- Flyway database migrations.
- Local H2 profile and PostgreSQL-ready profile.
- Public/published Google Sheet import.
- Team Formation roster import.
- Tracker import.
- Software Project Monitor import.
- Frontend Workspace import calls the backend Sheet import endpoints first.
- Frontend Register, Forms, and Tracker screens can read backend-loaded students/tracker data after import or refresh.
- Workspace backend refresh and starter-data restore controls.
- Public student submission form flow.
- Optional student registration UI.
- Teacher review, adviser view, student dashboard, tracker, and archive screens.
- Tracker page with sticky selected-student band, sticky toolbar, sticky table header, toolbar search, paged rows, load-all-rows mode, and hidden summary counts.
- Student Dashboard with compact deliverable rows, group progress, adviser feedback preview, full feedback modal, and `Reviewed` status when feedback exists.
- Published form editing/unpublishing flow that preserves responses in browser state.

Not fully connected yet:

- Real Google OAuth.
- Google Sheets API writeback to Sir's actual Sheet, unless service-account credentials are configured.
- Google Drive API file metadata/PDF verification.
- Google Docs API report creation.
- Real Gemini AI evaluation.
- Backend persistence for public submissions, reviews, feedback, archive records, and AI reports.
- Real account/session handling for students/advisers/admins.

The current "AI Review" is placeholder logic. It uses saved flags such as `Not PDF`, `Inaccessible`, `Too Short`, and `Template-like`. It does not call Gemini yet.

## API And Secret Rules

Do not put Google API keys, OAuth client secrets, Gemini keys, or service account credentials in the Vite frontend.

When we add real Google/Gemini integration, it should go through a backend or secure proxy. Frontend `.env` values are still visible to users after build, so they are not safe for secrets.

Safe frontend env:

```powershell
$env:VITE_API_BASE_URL='http://127.0.0.1:8080/api'
```

Backend env used now:

```powershell
$env:CAPVAULT_GOOGLE_SHEETS_ENABLED='true'
$env:CAPVAULT_GOOGLE_SERVICE_ACCOUNT_JSON='D:\path\to\service-account.json'
$env:CAPVAULT_GOOGLE_APPLICATION_NAME='CapVault V2'
```

Gemini is not wired yet. When added, the Gemini key should be read only by the backend, not by Vite.

## Backend Google Sheets Setup

Public Sheet import works without credentials when the Sheet is published or public. Real tracker writeback to Sir's actual Google Sheet needs Google Sheets API credentials.

For local testing with a service account:

1. Create or choose a Google Cloud project.
2. Enable the Google Sheets API.
3. Create a service account and download its JSON key.
4. Share Sir's target Google Sheet with the service account email.
5. Run the backend with:

```powershell
cd backend
$env:CAPVAULT_GOOGLE_SHEETS_ENABLED='true'
$env:CAPVAULT_GOOGLE_SERVICE_ACCOUNT_JSON='D:\path\to\service-account.json'
mvn spring-boot:run
```

Do not commit the service account JSON file.

If credentials are not configured, `POST /api/tracker/writebacks` still updates the backend tracker cell and records the writeback as `PENDING_GOOGLE_CREDENTIALS` when remote writing is requested.

## Development Notes

- Keep UI dense, table-first, and teacher-workflow focused.
- Avoid huge cards for high-volume screens like Review and Tracker.
- Keep Student public forms familiar to Google Forms, but cleaner.
- Do not reintroduce a required student-login workflow for submissions.
- Keep account registration optional for students.
- Student Number should come from Team Formation.
- Tracker values are days late: `0` means on time; positive numbers mean days late.
- Final archive should eventually preserve independent PDF copies, not rely only on student-owned Drive links.

## Troubleshooting

If `npm run dev` fails:

```powershell
cd frontend
npm install
npm run dev
```

If the page shows stale data:

- Use **Restore starter data** in Workspace, or
- Clear browser `localStorage` key `capvault.v2.workflow`.

If Student Numbers do not appear:

- Import the Team Formation Sheet in `/workspace`.
- Confirm the import summary reports official IDs found.
- Press **Refresh backend data** if the backend already imported the Sheet.
- Refresh `/register`, `/student`, or `/submit/...`.

If Tracker still shows starter rows:

- Go to `/workspace`.
- Press **Refresh backend data**.
- If you intentionally want local test data, press **Restore starter data**.

If Sheet import does not work:

- Confirm the Sheet is public or published.
- Paste the normal Google Sheets link or published link into the matching Workspace source.
- Import Team Formation, Tracker, and Software Project Monitor separately.
- Check that the backend is running if you want backend import persistence.

If `mvn spring-boot:run` fails:

- Confirm Java 21+ is installed: `java -version`.
- Confirm Maven is installed: `mvn -version`.
- Run tests first from `backend/`: `mvn test`.
- If port `8080` is busy, set another port: `$env:SERVER_PORT='8081'`.

## Legacy

The original CapVault implementation is preserved under `legacy/`. Use it only for reference when recovering useful UX patterns or old behavior.
