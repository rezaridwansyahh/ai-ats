# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fullstack ATS (Applicant Tracking System) with separate `backend/` and `frontend/` directories. The app manages job postings across platforms (Seek, LinkedIn) with user/role management and granular RBAC permissions.

## Commands

### Backend
```bash
cd backend && NODE_ENV=development node listen.js   # Start dev server (port 5000)
cd backend && node src/db/run-script.js             # Reset/seed database (setup.sql → seed.js → sync-seq.sql)
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
- **Entry**: `listen.js` → loads `.env.dev`, starts server on port from env
- **App**: `app.js` → must import `src/config/env.js` first, then middleware setup, route mounting under `/api`
- **Pattern**: Routes → Controllers → Services → Models → PostgreSQL (raw SQL via `pg` Pool)
- **Auth**: JWT tokens (1hr expiry, signed with `JWT_SECRET`), bcrypt password hashing (12 rounds)
- **Encryption**: AES-256-CBC for sensitive data (job account passwords, cookies) via `src/shared/utils/encryption.js`
- **Middleware**: `auth.middleware.js` (JWT verify → attaches `req.user`), `role.middleware.js` (permission check with module/menu/functionality params)
- **Logging**: Winston → `~/logs/error.log` and `~/logs/combined.log`
- **Browser automation**: Puppeteer singleton in `src/shared/services/puppeteer/` for RPA workflows

**Module structure** — each feature under `src/modules/<name>/`:
```
<name>.route.js → <name>.controller.js → <name>.service.js → <name>.model.js
```

**Active code lives in `src/`**. Root-level `routes/`, `controllers/`, `middlewares/`, `model/` directories are legacy (unused).

API route prefixes:
| Prefix | Module |
|--------|--------|
| `/api/auth` | auth |
| `/api/user` | user |
| `/api/role` | role |
| `/api/permission` | permission |
| `/api/module` | module |
| `/api/menu` | menu |
| `/api/job-account` | job-account |
| `/api/job-posting` | job-post |
| `/api/seek` | platform/seek |
| `/api/linkedin` | platform/linkedin |
| `/api/cookies` | cookie |

### Frontend (React 19 + Vite 7 + Tailwind 4)
- **UI library**: Shadcn UI (New York style, Radix primitives) — components in `src/components/ui/`
- **Icons**: Lucide React
- **HTTP**: Axios instance in `src/api/axios.js` with JWT interceptors, token expiry check, and 401 redirect
- **Path alias**: `@` → `./src` (configured in both `vite.config.js` and `jsconfig.json`)
- **State**: localStorage for auth (token, user, role, permissions, userData); component-level `useState` — no global state library
- **API base URL**: Hardcoded ngrok URL in `src/api/axios.js` (changes per tunnel session)
- **Routing**: React Router v7 in `App.jsx`. Authenticated pages nest inside `<DashboardLayout />` which provides sidebar + `<Outlet />`

See `frontend/CLAUDE.md` for detailed frontend patterns and folder structure.

### RBAC (Role-Based Access Control)
Permissions are structured as **Module → Menu → Functionality** (create/read/update/delete). The sidebar dynamically renders nav items based on the user's permissions stored in localStorage. Frontend checks use `hasPermission(module, menu, functionality)` from `src/utils/permissions.js`. Backend checks use `role.middleware.js` which queries `PermissionModel.checkPermissionMultipleRoles()`.

### Database Schema (PostgreSQL)
Schema defined in `backend/src/db/setup.sql`. Seed data in `backend/src/db/data/` (modules, menus, permissions, roles, users, mappings).

Key tables: `master_users`, `master_roles`, `mapping_users_roles`, `master_modules`, `master_menus`, `mapping_modules_menus`, `global_permissions`, `mapping_roles_permissions`, `master_job_account`, `core_job_posting`, `mapping_job_posting_seek`, `mapping_job_posting_linkedin`, `cookies`.

PostgreSQL ENUMs: `status_type` (Draft/Active/Running/Expired/Failed), `work_option_type`, `work_type_type`, `pay_type_type`, `currency_type`, `pay_display_type`, `platform_type` (seek/linkedin).

### Job Posting RPA
Seek RPA scripts live in `backend/src/modules/platform/seek/rpa/`. They use Puppeteer to automate form filling on Seek's website. Cookie-based session reuse avoids re-authentication.

RPA endpoints: `/api/seek/job-post-draft/rpa/create`, `/update`, `/delete`.

Payload format:
```json
{ "user_id", "account_id", "service": "seek", "dataForm": { "job_title", "job_desc", "job_location", "work_option", "work_type", "pay_type", "currency", "pay_min", "pay_max", "pay_display" } }
```

## Conventions
- Backend fields use **snake_case** matching database columns
- Backend file naming: `feature.layer.js` (e.g., `user.model.js`, `auth.service.js`)
- Backend errors: custom objects `{ status, message }` caught by controller try-catch
- Backend queries: parameterized SQL (`db.query(sql, [params])`) — no ORM
- Frontend API files follow pattern: `src/api/<resource>.api.js`
- Layout components (sidebar shell + outlet) live in `src/components/layout/`
- Feature components (tables, form dialogs, delete dialogs) live in `src/components/<feature>/`
- Dialog components follow the pattern: props `open`, `onOpenChange`, entity-specific props, `onSubmit`/`onConfirm`, `loading`
- Pages (`src/pages/`) own state, data fetching, and CRUD logic; feature components are presentational
