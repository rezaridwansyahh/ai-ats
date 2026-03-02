# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fullstack ATS (Applicant Tracking System) with separate `backend/` and `frontend/` directories. The app manages job postings across platforms (Seek, LinkedIn) with user/role management and granular permissions.

## Commands

### Backend
```bash
cd backend && NODE_ENV=development node listen.js   # Start dev server (port 5000)
cd backend && node db/run-scripts.js                # Reset/seed database
```

### Frontend
```bash
cd frontend && npm run dev       # Start Vite dev server (port 5173)
cd frontend && npm run build     # Production build
cd frontend && npm run lint      # ESLint
cd frontend && npm run preview   # Preview production build
```

No test framework is currently configured.

## Architecture

### Backend (Express 5 + PostgreSQL)
- **ES modules** throughout (`"type": "module"`)
- **Entry**: `listen.js` → loads `.env.dev`, starts server
- **App**: `app.js` → middleware setup, route mounting under `/api`
- **Pattern**: Routes → Controllers → Models → PostgreSQL (raw SQL via `pg` Pool)
- **Auth**: JWT tokens (1hr expiry), bcrypt password hashing
- **Middleware**: `authMiddleware.js` (JWT verify), `roleMiddleware.js` (permission check)
- **Monitoring**: Prometheus metrics at `/metrics`

API route prefixes:
| Prefix | Route file |
|--------|-----------|
| `/api/auth` | `auths.js` |
| `/api/user` | `users.js` |
| `/api/role` | `roles.js` |
| `/api/job-account` | `job-accounts.js` |
| `/api/job-posting` | `job-posting.js` |
| `/api/seek` | `job-posting-seek.js` |
| `/api/linkedin` | `job-posting-linkedin.js` |

### Frontend (React 19 + Vite 7 + Tailwind 4)
- **UI library**: Shadcn UI (Radix primitives) — components in `src/components/ui/`
- **Icons**: Lucide React
- **HTTP**: Axios instance in `src/api/axios.js` with JWT interceptors and token expiration check
- **Path alias**: `@` → `./src`
- **State**: localStorage for auth (token, user, role, permissions); component-level `useState`
- **API base URL**: Hardcoded ngrok URL in `src/api/axios.js` (changes per tunnel session)

### RBAC (Role-Based Access Control)
Permissions are structured as **Module → Menu → Functionality** (create/read/update/delete). The sidebar dynamically renders nav items based on the user's permissions stored in localStorage. Frontend checks use `hasPermission(module, menu, functionality)` from `src/utils/permissions.js`.

### Database Schema (PostgreSQL)
Key tables: `master_users`, `master_roles`, `mapping_users_roles`, `master_job_account`, `core_job_posting`, `mapping_job_posting_seek`, `mapping_job_posting_linkedin`. Schema defined in `backend/db/setup.sql`. Uses PostgreSQL ENUMs for status, work_option, work_type, pay_type, currency, pay_display, and platform.

### Job Posting RPA Endpoints
Create/update/delete for Seek postings route through ngrok RPA endpoints (`/seek/job-post-draft/rpa/create`, `/update`, `/delete`). Payload format:
```json
{ "user_id", "account_id", "service": "seek", "dataForm": { "job_title", "job_desc", "job_location", "work_option", "work_type", "pay_type", "currency", "pay_min", "pay_max", "pay_display" } }
```
Delete uses: `{ "job_posting_id", "user_id", "account_id", "service" }`.

## Conventions
- Backend fields use **snake_case** matching database columns
- Frontend API files follow pattern: `src/api/<resource>.api.js`
- Layout components (page-level state + data fetching) live in `src/components/layout/`
- Feature components (tables, dialogs) live in `src/components/<feature>/`
- Dialog components follow the pattern: props `open`, `onOpenChange`, plus entity-specific props
