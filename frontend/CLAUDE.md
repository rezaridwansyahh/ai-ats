# Frontend CLAUDE.md

React 19 + Vite 7 + Tailwind 4 SPA for the ATS (Applicant Tracking System).

## Commands

```bash
npm run dev       # Vite dev server on port 5173
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test framework configured.

## Folder Structure

```
src/
├── api/                    # Axios API call functions (one file per resource)
│   ├── axios.js            # Shared Axios instance, interceptors, token helpers
│   ├── auth.api.js         # login, register
│   ├── users.api.js        # CRUD users + role listing
│   ├── roles.api.js        # CRUD roles
│   ├── modules.api.js      # CRUD modules (RBAC)
│   ├── menus.api.js        # CRUD menus (RBAC)
│   ├── job-accounts.api.js # CRUD job platform accounts
│   ├── job-postings.api.js # CRUD core job postings
│   ├── job-posting-seek.api.js  # Seek-specific posting operations
│   ├── job-sourcing.api.js # Job sourcing operations
│   ├── job.api.js          # Job CRUD + AI generation (uses fetch for SSE streaming)
│   ├── applicant.api.js    # Applicant CRUD
│   ├── candidate.api.js    # Candidate operations
│   ├── sourcing.api.js     # Sourcing operations
│   ├── pipeline.api.js     # Pipeline CRUD
│   ├── stage-category.api.js  # Stage category CRUD
│   ├── template-stage.api.js  # Template stage CRUD
│   ├── automation-setting.api.js # Automation settings
│   ├── screening.api.js    # Screening operations
│   ├── participant.api.js  # Assessment participants
│   ├── question.api.js     # Assessment questions
│   ├── assessment-battery-result.api.js  # Assessment results
│   ├── linkedin.api.js     # LinkedIn-specific operations
│   └── recruiter.api.js    # Recruiter CRUD
│
├── services/
│   └── auth.js             # loginUser, registerUser, logoutUser, getCurrentUser
│
├── components/
│   ├── ui/                 # Shadcn UI primitives (button, card, dialog, table, etc.)
│   ├── layout/             # True layout shells only
│   │   ├── Dashboard-Layout.jsx   # Shell: sidebar + header + <Outlet />
│   │   └── app-sidebar.jsx        # Dynamic sidebar built from permissions
│   ├── auth/               # Auth form components
│   │   ├── LoginCard.jsx          # Login form card
│   │   └── RegisterCard.jsx       # Registration form card
│   ├── cards/              # Reusable card components (StatCard)
│   ├── user-management/    # Feature components: UserTable, UserFormDialog, etc.
│   ├── role-management/    # Feature components: RoleTable, RoleFormDialog, etc.
│   ├── job-account/        # Feature components: AccountTable, AccountFormDialog, etc.
│   ├── job-posting/        # Feature components: JobPostingTable, SeekFormDialog, etc.
│   ├── recruiter/          # Feature components: RecruiterTable, RecruiterFormDialog, etc.
│   └── shared/             # Shared components: TablePagination
│
├── pages/                  # Route entry points — own state, data fetching, CRUD logic
│   ├── Login.jsx           # Renders LoginCard
│   ├── Register.jsx        # Renders RegisterCard
│   ├── Dashboard.jsx       # Dashboard with stat cards (placeholder data)
│   ├── UserManagement.jsx  # User CRUD, filtering, sorting, pagination
│   ├── RoleManagement.jsx  # Role CRUD with permission assignment
│   ├── Account.jsx         # Job account CRUD
│   ├── Seek.jsx            # Seek posting CRUD with status tracking
│   ├── SeekSourcing.jsx    # Seek sourcing management
│   ├── CandidateSearch.jsx # Candidate search
│   ├── DemoBooking.jsx     # Demo booking page
│   ├── JobManagement.jsx   # Multi-step job creation with AI generation
│   ├── SourceManagement.jsx # Source management
│   ├── TalentPool.jsx      # Talent pool management
│   ├── SourceCandidate.jsx # Source candidate page
│   ├── AIMatching.jsx      # AI-based candidate matching
│   ├── Assessment.jsx      # Assessment management
│   ├── Report.jsx          # Reports
│   ├── Recruiters.jsx      # Recruiter CRUD with status tracking
│   ├── ComingSoon.jsx      # Catch-all placeholder for unbuilt routes
│   └── Integrations.jsx    # Platform connection settings (placeholder)
│
├── hooks/                  # Custom React hooks
│   ├── use-mobile.js       # Responsive breakpoint detection
│   └── useSort.jsx         # Sortable table logic (toggle, apply, SortIcon)
│
├── utils/
│   └── permissions.js      # hasPermission, hasAnyPermission, hasAllPermissions, etc.
│
├── lib/
│   └── utils.js            # cn() helper (clsx + tailwind-merge)
│
├── App.jsx                 # Route definitions
├── main.jsx                # ReactDOM entry, wraps App in BrowserRouter
└── index.css               # Global styles / Tailwind directives
```

## Key Patterns

### Routing
All routes are defined in `App.jsx`. Authenticated pages are nested inside `<DashboardLayout />` which provides the sidebar shell + `<Outlet />`.

```
/                              → LandingPage (public)
/login, /register              → standalone pages
/dashboard                     → DashboardLayout > DashboardPage
/settings/user-management      → DashboardLayout > UserManagementPage
/settings/role-management      → DashboardLayout > RoleManagementPage
/settings/recruiters           → DashboardLayout > RecruitersPage
/settings/account              → DashboardLayout > AccountPage
/settings/integrations         → DashboardLayout > IntegrationsPage
/job-postings/seek             → DashboardLayout > SeekPage
/job-management/seek-sourcing  → DashboardLayout > SeekSourcingPage
/sourcing/job-management       → DashboardLayout > JobManagementPage
/candidates/search             → DashboardLayout > CandidateSearchPage
/sourcing/source-management    → DashboardLayout > SourceManagementPage
/sourcing/talent-pool          → DashboardLayout > TalentPoolPage
/sourcing/source-candidate     → DashboardLayout > SourceCandidatePage
/selection/assessment          → DashboardLayout > AssessmentPage
/selection/report              → DashboardLayout > ReportPage
/selection/ai-matching         → DashboardLayout > AIMatchingPage
* (catch-all)                  → DashboardLayout > ComingSoonPage
```

### Page → Feature Component Flow
1. **Page** (`pages/X.jsx`) — owns state, data fetching, CRUD handlers, permission checks.
2. **Feature components** (`components/<feature>/`) — presentational: tables, form dialogs, delete dialogs, filters, pagination.

### API Layer
- `api/<resource>.api.js` — raw Axios calls, returns Axios response.
- `services/auth.js` — wraps auth API calls with token management.
- All requests go through `api/axios.js` which handles JWT injection, token expiry, and 401 redirects.

### Auth & State
- Auth state lives in **localStorage**: `token`, `user`, `role`, `permissions`, `userData`.
- No global state library — component-level `useState` throughout.
- JWT token is attached via Axios request interceptor; expired tokens redirect to `/login`.

### RBAC / Permissions
- Permissions stored in localStorage as `[{ module, menus: [{ menu, functionalities: [] }] }]`.
- Check with `hasPermission(module, menu, functionality)` from `utils/permissions.js`.
- Sidebar in `app-sidebar.jsx` dynamically renders nav items from the permissions array.
- Pages gate CRUD buttons with `hasPermission()` (e.g., `canCreate`, `canEdit`, `canDelete`).

### Dialog Convention
Dialog components receive these standard props:
- `open` — boolean controlled state
- `onOpenChange` — setter to close/open
- Entity-specific props (e.g., `user`, `role`)
- `onSubmit` / `onConfirm` — async handler
- `loading` — disables buttons during submission

### Sorting
Use the `useSort()` hook which returns `{ toggle, apply, SortIcon }`. Call `toggle(field)` on header click, `apply(list)` to sort data, and `<SortIcon field="x" />` in column headers.

### Pagination / Search / Filter
Standard data flow across list pages: `fetchData → filter (search + status/role dropdown) → sort (useSort) → paginate → render`. Shared `TablePagination` component in `components/shared/` provides page size selector (10/25/50/100), row count display, and prev/next navigation.

### AI Generation (JobManagement)
`job.api.js` uses raw `fetch()` (not Axios) to stream SSE responses from `/api/job/generate`. The backend returns structured text with `[JOB_DESC]` and `[QUALIFICATIONS]` tags that get parsed client-side. Supports optional file upload (PDF/DOCX/TXT) for context.

## Configuration
- **Path alias**: `@` → `./src` (defined in `vite.config.js` + `jsconfig.json`)
- **UI components**: Added via Shadcn CLI, configured in `components.json`
- **Base URL**: Hardcoded ngrok URL in `src/api/axios.js` (changes per tunnel session)
- **Icons**: Lucide React
