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
│   └── job-posting-seek.api.js  # Seek-specific posting operations
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
│   └── job-posting/        # Feature components: JobPostingTable, SeekFormDialog, etc.
│
├── pages/                  # Route entry points — own state, data fetching, CRUD logic
│   ├── Login.jsx           # Renders LoginCard
│   ├── Register.jsx        # Renders RegisterCard
│   ├── Dashboard.jsx       # Dashboard with stat cards (placeholder data)
│   ├── UserManagement.jsx  # User CRUD, filtering, sorting, pagination
│   ├── RoleManagement.jsx  # Role CRUD with permission assignment
│   ├── Account.jsx         # Job account CRUD
│   ├── Seek.jsx            # Seek posting CRUD with status tracking
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
/login, /register              → standalone pages
/dashboard                     → DashboardLayout > DashboardPage
/users/management              → DashboardLayout > UserManagementPage
/users/role-management         → DashboardLayout > RoleManagementPage
/settings/integrations         → DashboardLayout > IntegrationsPage
/job-postings/account          → DashboardLayout > AccountPage
/job-postings/seek             → DashboardLayout > SeekPage
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

## Configuration
- **Path alias**: `@` → `./src` (defined in `vite.config.js` + `jsconfig.json`)
- **UI components**: Added via Shadcn CLI, configured in `components.json`
- **Base URL**: Hardcoded ngrok URL in `src/api/axios.js` (changes per tunnel session)
- **Icons**: Lucide React
