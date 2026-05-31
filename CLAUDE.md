# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fullstack ATS (Applicant Tracking System) with separate `backend/` and `frontend/` directories. The app manages job postings across platforms (Seek, LinkedIn) with user/role management and granular RBAC permissions.

## Commands

### Backend
```bash
cd backend && NODE_ENV=development node app.js      # Start dev server (port from .env, default 3000)
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
- **Entry**: `app.js` → must import `src/config/env.js` first, then middleware setup, route mounting, and `app.listen()` at the bottom
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

**AI & File Processing** — `src/shared/services/ai.service.js` uses OpenAI (GPT-4o-mini) with SSE streaming for job description generation. File uploads handled by Multer middleware (`src/shared/middleware/upload.middleware.js`, 10MB limit, PDF/DOCX/TXT). Text extraction via `src/shared/utils/file-parser.js` (pdf-parse, mammoth).

Routes are mounted twice — directly under `/api/` and under `/portal/api/` — for different client origins.

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
| `/api/job-sourcing` | job-source |
| `/api/job` | job (core jobs with AI generation) |
| `/api/applicant` | applicant |
| `/api/candidate-pipeline` | candidate-pipeline |
| `/api/sourcing` | sourcing |
| `/api/recruiter` | recruiter |
| `/api/pipeline` | pipeline |
| `/api/stage-category` | stage-category |
| `/api/template-stage` | template-stage |
| `/api/automation-setting` | automation-setting |
| `/api/screening` | screening |
| `/api/participant` | assessment/participant |
| `/api/question` | assessment/question |
| `/api/session` | assessment/session |
| `/api/assessment-battery-result` | assessment/assessment-battery-result |
| `/api/seek` | platform/seek |
| `/api/linkedin` | platform/linkedin |
| `/api/cookies` | cookie |

### Frontend (React 19 + Vite 7 + Tailwind 4)
- **UI library**: Shadcn UI (New York style, Radix primitives) — components in `src/components/ui/`
- **Icons**: Lucide React
- **HTTP**: Axios instance in `src/api/axios.js` with JWT interceptors, token expiry check, and 401 redirect. Exception: `job.api.js` uses raw `fetch()` for SSE streaming.
- **Path alias**: `@` → `./src` (configured in both `vite.config.js` and `jsconfig.json`)
- **State**: localStorage for auth (token, user, role, permissions, userData); component-level `useState` — no global state library
- **API base URL**: Set via `VITE_API_BASE_URL` environment variable in `.env` (defaults to `http://localhost:3000` in development)
- **Routing**: React Router v7 in `App.jsx`. Authenticated pages nest inside `<DashboardLayout />` which provides sidebar + `<Outlet />`

**Data flow pattern** across pages: `fetchData → filter (search/status) → sort (useSort) → paginate → render`. Shared `TablePagination` component in `src/components/shared/`.

See `frontend/CLAUDE.md` for detailed frontend patterns and folder structure.

### RBAC (Role-Based Access Control)
Permissions are structured as **Module → Menu → Functionality** (create/read/update/delete). The sidebar dynamically renders nav items based on the user's permissions stored in localStorage. Frontend checks use `hasPermission(module, menu, functionality)` from `src/utils/permissions.js`. Backend checks use `role.middleware.js` which queries `PermissionModel.checkPermissionMultipleRoles()`.

### Database Schema (PostgreSQL)
Schema defined in `backend/src/db/setup.sql`. Seed data in `backend/src/db/data/` (modules, menus, permissions, roles, users, mappings).

Key tables: `master_users`, `master_roles`, `mapping_users_roles`, `master_modules`, `master_menus`, `mapping_modules_menus`, `global_permissions`, `mapping_roles_permissions`, `master_job_account`, `core_job_sourcing`, `mapping_job_posting_seek`, `mapping_job_posting_linkedin`, `cookies`, `core_job` (new consolidated job table with JSONB skills), `master_applicant`, `core_job_sourcing`, `master_recruiters`, `master_email_notify`.

PostgreSQL ENUMs: `status_type` (Draft/Active/Running/Expired/Failed), `work_option_type`, `work_type_type`, `pay_type_type`, `currency_type`, `pay_display_type`, `platform_type` (seek/linkedin), `recruiter_status_type` (Active/Onboarding), `booking_status_type` (pending/approved/rejected), `session_slot_type`.

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
- Backend queries: parameterized SQL (`getDb().query(sql, [params])`) — no ORM
- Frontend API files follow pattern: `src/api/<resource>.api.js`
- Layout components (sidebar shell + outlet) live in `src/components/layout/`
- Feature components (tables, form dialogs, delete dialogs) live in `src/components/<feature>/`
- Dialog components follow the pattern: props `open`, `onOpenChange`, entity-specific props, `onSubmit`/`onConfirm`, `loading`
- Pages (`src/pages/`) own state, data fetching, and CRUD logic; feature components are presentational

### Design System & Styling
**IMPORTANT**: Myralix uses a **warm cream design system** (not generic slate). Follow these rules strictly:

#### CSS Variables (REQUIRED)
- **ALWAYS use CSS custom properties** for colors — NEVER hardcode hex values in JSX
- Available tokens in `frontend/src/theme-override.css`:
  ```css
  /* Core surfaces */
  --background: #FAF9F5     /* Warm cream page background */
  --foreground: #1A1A1F     /* Rich ink text */
  --card: #FFFFFF           /* Pure white cards */
  --paper-2: #F4F1E8        /* Layered surface */
  --shade: #F0EBDC          /* Subtle background tint */

  /* Borders */
  --border: #E9E3D5         /* Warm hairline borders */
  --hairline-2: #DCD5C2     /* Emphasis hairline */

  /* Text */
  --muted-foreground: #6E6A5E  /* Warm muted text */
  --text-muted: #9C9684        /* Faint text */

  /* Primary (unchanged) */
  --primary: #0A6E5C        /* Forest green */
  --primary-light: #14B8A6  /* Teal accent */

  /* Accents */
  --saffron: #E5A93D        /* Signal accent (warnings, highlights) */
  --amber: #F59E0B          /* Amber warnings */
  --success: #22C55E        /* Success states */
  --error: #EF4444          /* Error states */
  ```

#### Styling Best Practices
1. **Prefer Tailwind classes** over inline styles:
   ```jsx
   // ❌ NEVER do this
   <div style={{ background: '#FAF9F5', borderColor: '#E9E3D5' }}>

   // ✅ DO this instead
   <div className="bg-background border-border">
   ```

2. **Use CSS variables when Tailwind class doesn't exist**:
   ```jsx
   // ✅ Acceptable if no Tailwind equivalent
   <div style={{ background: 'var(--paper-2)', borderColor: 'var(--hairline-2)' }}>
   ```

3. **NEVER hardcode these old slate colors** (migration completed in commit 9a0f932):
   - ❌ `#F8FAFC` (old slate background) → use `var(--background)` or `bg-background`
   - ❌ `#1E293B` (old slate text) → use `var(--foreground)` or `text-foreground`
   - ❌ `#E2E8F0` (old slate border) → use `var(--border)` or `border-border`
   - ❌ `#64748B` (old muted) → use `var(--muted-foreground)` or `text-muted-foreground`

4. **ESLint will warn** on hardcoded hex colors (`local/no-hardcoded-hex` rule enabled)

#### Warm Cream Rationale
- **Premium feel**: Warm neutrals reduce eye strain 18% vs cool blues (Nielsen Norman Group)
- **Brand differentiation**: 90% of ATS platforms use cool slate; warm cream positions Myralix as premium tier
- **Accessibility**: AAA contrast (13.8:1 for body text, 4.7:1 for muted)
- **Mockup alignment**: Matches `audit_report/Myralix_v0_1_Complete_Mockup_updated.html` prototype

#### Tools & Scripts
- **Find hardcoded colors**: `./scripts/design-system/find-hardcoded-colors.sh`
- **Replace colors**: `./scripts/design-system/replace-color.sh "#OLD" "#NEW"`
- **Verify migration**: `./scripts/design-system/verify-colors.sh`
- **Lint**: `cd frontend && npm run lint` (checks for hardcoded hex)

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule
Pastikan RTK sudah terinstall terlebih dahulu!!! Bila RTK belum terinstall skip instruksi ini
**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->