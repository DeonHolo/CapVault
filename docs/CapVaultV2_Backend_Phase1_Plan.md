# CapVault V2 Backend Phase 1 Plan

Date: 2026-06-19

## Decision

We are choosing **Approach A: real Spring Boot + PostgreSQL + Google API-ready structure immediately**.

The backend should not replace Sir Ralph's Google Sheets workflow. It should act as the secure automation layer that the frontend cannot safely provide.

## Why This Backend Exists

The current V2 frontend can demonstrate the workflow, but it cannot safely or reliably handle:

1. Google OAuth credentials.
2. Google Sheets API writeback.
3. Google Drive file metadata checks.
4. PDF download/extraction.
5. Gemini API calls.
6. Archive byte storage and hash verification.
7. Staff/adviser/student account security.
8. Background validation and review jobs.

The backend owns these responsibilities while Google Sheets remains the visible shared record.

## Backend Principles

1. Keep Google Sheets as the operating record, not PostgreSQL.
2. Use PostgreSQL for internal app state, configuration, job state, account links, cache rows, and archive metadata.
3. Keep public student submissions low-friction.
4. Do not require student login for basic submission.
5. Protect all Google/Gemini credentials on the server side.
6. Keep the backend modular: controller, service, repository, DTO, validation.
7. Make local development easy, but keep PostgreSQL as the production target.

## Phase 1 Scope

Phase 1 creates the backend foundation and proves that the frontend can move away from browser-only state.

Included:

1. Spring Boot Java 21 Maven project under `backend/`.
2. Layered package structure.
3. Local profile that can run without a manually installed database.
4. PostgreSQL-ready configuration.
5. Flyway migration for the first internal tables.
6. Health endpoint.
7. Workspace source endpoints for Team Formation, Tracker, and Software Project Monitor source links.
8. Deliverable endpoints for storing generated form settings.
9. DTO validation.
10. Tests for health, workspace sources, and deliverables.

Not included in Phase 1:

1. Real Google OAuth flow.
2. Real Google Sheets API import/writeback.
3. Real Google Drive API validation.
4. Real Gemini AI review.
5. Archive byte copying.
6. Frontend migration to call every backend endpoint.

Those belong to later phases once the foundation is stable.

## Initial Backend Modules

### Health

Purpose:

- Confirm the backend is running.
- Give frontend/devs a simple connectivity check.

Endpoint:

- `GET /api/health`

### Workspace Sources

Purpose:

- Store the three connected Google Sheet source links.
- Preserve which Sheet owns which part of Sir's workflow.

Source types:

- `TEAM_FORMATION`
- `TRACKER`
- `PROJECT_MONITOR`

Endpoints:

- `GET /api/workspace/sources`
- `PUT /api/workspace/sources/{sourceType}`

### Deliverables

Purpose:

- Store generated CapVault form settings before they are written to Sheets.
- Keep one stable deliverable definition per tracker column/form.

Endpoints:

- `GET /api/deliverables`
- `POST /api/deliverables`
- `PUT /api/deliverables/{id}`

## First Database Tables

### workspace_sources

Stores connected Google Sheet source links and import status.

Important fields:

- `id`
- `source_type`
- `sheet_url`
- `sheet_id`
- `display_name`
- `status`
- `connected_at`
- `last_imported_at`

### deliverables

Stores published form settings.

Important fields:

- `id`
- `tracker_column_key`
- `title`
- `slug`
- `instructions`
- `due_at`
- `pdf_required`
- `status`
- `created_at`
- `updated_at`

## Configuration Plan

Default local development:

- Uses an embedded local database so teammates can run the backend immediately.
- Runs on port `8080`.
- Enables CORS for `http://127.0.0.1:5173` and `http://localhost:5173`.

PostgreSQL profile:

- Uses environment variables for database URL, user, and password.
- Keeps the same Flyway migrations.

Future API credentials:

- Google and Gemini credentials must live in backend environment variables or secure secret storage.
- They must never be placed in Vite frontend `.env` files.

## Later Backend Phases

### Phase 2: Google Sheets API

- Read Team Formation, Tracker, and Software Project Monitor with Sheets API.
- Store row/column references.
- Write submission rows.
- Write tracker lateness values.

Phase 2 implementation status:

- Backend now imports Team Formation, Tracker, and Software Project Monitor data from public/published Google Sheet CSV links.
- Imported Team Formation rows populate `student_records`.
- Imported Tracker rows populate `tracker_columns`, `tracker_rows`, and `tracker_cells`.
- Imported Software Project Monitor rows populate `project_metadata`.
- Tracker imports preserve raw cell values and normalized status labels.
- Tracker imports detect skipped deadline rows and return suggested deliverable-form deadlines.
- Tracker writeback updates the backend tracker cell immediately.
- Google Sheets API writeback is wired through a service-account adapter, but actual remote writing requires credentials and Sheets access.
- If writeback is requested before credentials are configured, the backend records `PENDING_GOOGLE_CREDENTIALS` instead of pretending the Google Sheet was changed.

### Phase 3: Public Submission API

- Move public form submission from localStorage into backend.
- Record attempt history.
- Enforce required fields.
- Write accepted attempts to Sheets.

### Phase 4: Google Drive Validation

- Extract Drive file IDs.
- Verify accessibility.
- Check MIME type.
- Strictly block non-PDF links for PDF-required deliverables.
- Store file metadata.

### Phase 5: AI Review

- Extract PDF text.
- Compare against official templates.
- Call Gemini only when Sir/adviser triggers review.
- Save short summary, flags, missing/weak sections, confidence, and suggested action.

### Phase 6: Archive

- Download final accepted PDF bytes.
- Store independent archive copy.
- Generate SHA-256.
- Write archive metadata/index to Sheets.

## Immediate Implementation Plan

1. Create `backend/` Maven project.
2. Add Spring Boot web, validation, JPA, Flyway, H2 local runtime, PostgreSQL runtime, and test dependencies.
3. Add application config for local and PostgreSQL profiles.
4. Add first Flyway migration.
5. Add health controller.
6. Add workspace source entity/repository/service/controller.
7. Add deliverable entity/repository/service/controller.
8. Add validation DTOs.
9. Add tests.
10. Update README with backend commands.

## Success Criteria

1. `mvn test` passes inside `backend/`.
2. `GET /api/health` returns a successful response.
3. Workspace source links can be saved and listed.
4. Deliverables can be created, updated, and listed.
5. The backend is ready for Google Sheets API implementation without reshaping the project.
