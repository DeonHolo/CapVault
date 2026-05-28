# CapVault

CapVault is a capstone project tracking and archival management system for class record sync, live project tracking, submission versioning, adviser review, archive integrity, calendar deadlines, notifications, announcements, and reporting.

## Local Development

### Backend

The backend is a Spring Boot Java 21 application. It is PostgreSQL-first, with a local profile available for quick startup.

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

For PostgreSQL:

```powershell
docker compose up -d postgres
cd backend
mvn spring-boot:run
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` calls to `http://localhost:8080`.

## Storage Choice

CapVault uses a `StorageService` abstraction:

- `local` profile stores files on disk for development.
- `r2` profile uses S3-compatible settings suitable for Cloudflare R2.

Cloudflare R2 is the preferred hosted archive storage target. MinIO is useful for local S3 emulation, but local filesystem storage is simpler for development and R2 is better for the deployed institutional archive.

## Published Tracker Template

The importer supports the published Google Sheet URL format:

```text
https://docs.google.com/spreadsheets/d/e/{published-id}/pubhtml?gid={gid}&single=true
```

It converts public `pubhtml` links to CSV when possible, preserves raw tracker values, and stores normalized statuses separately for reporting.
