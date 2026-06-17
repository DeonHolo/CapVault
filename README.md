# CapVault V2

CapVault V2 is being rebuilt as a Google-first capstone submission, tracking, AI triage, and final archive assistant for Sir Ralph Laviste's workflow.

## Current Source Of Truth

Read these before implementation:

- `docs/SRS (2526-sem2-it332-41) (CapVault V2 - Google-first Pivot).md`
- `docs/SDD (2526-sem2-it332-41) (CapVault V2 - Google-first Pivot).md`
- `docs/CapVaultV2_Workflow_Pivot_Notes.md`

## Repository Layout

- `legacy/v1-app/` contains the original CapVault V1 portal-style implementation.
- New V2 implementation should use fresh root-level app folders.
- Recommended V2 folders:
  - `frontend/` for the React + Vite public form and staff dashboard.
  - `backend/` for the Spring Boot Google API automation layer.

## V2 Product Direction

CapVault V2 should not be a login-first student portal. The core workflow is:

1. Sir connects a class record Google Sheet.
2. Sir publishes deliverable-specific form links.
3. Students submit through generated links without required account registration.
4. Student Number is used for class-record lookup and auto-fill when possible.
5. PDF-required deliverables strictly block editable or non-PDF links.
6. Accepted attempts write to Google Sheets and tracker lateness.
7. Validation and AI triage flags help Sir/advisers review submissions.
8. Only final accepted PDFs are archived as independent byte copies with SHA-256.

