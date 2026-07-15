# Onboarding Module

Backend implementation untuk **Onboarding** flow di Myralix ATS.

## Overview

Module ini handle 3 tahapan onboarding setelah candidate menerima offer & menandatangani contract:

1. **Pre-boarding** (sebelum hari pertama) — Checklist dokumen, schedule hari pertama, welcome message
2. **Day 1-30** — Milestones onboarding, buddy system, weekly check-ins
3. **Probation** (90 hari) — D30, D60, D90 check-ins, evaluasi manager

## Database Schema

✅ Schema sudah terintegrasi di **Migration 010** dalam `backend/src/db/setup.sql` (lines 855-991).

**Tables:**
- `candidate_onboarding` — Main record (1 per candidate per job)
- `onboarding_checklist_item` — Pre-boarding checklist (KTP, NPWP, equipment, dll)
- `onboarding_day_one_schedule` — Schedule hari pertama (09:00 HR welcome, dst)
- `onboarding_milestone` — Milestones Week 1-4 (workspace access, first PR, dll)
- `onboarding_probation_checkin` — D30, D60, D90 evaluasi
- `onboarding_welcome_message` — Welcome message dari manager
- `onboarding_hris_task` — Integration tasks (push to Talenta HRIS, dll)

**To apply schema:**
```bash
# Run full migration (akan create/reset semua tables)
cd backend && node src/db/run-script.js
```

Schema juga tersedia standalone di:
- `backend/src/db/onboarding-schema.sql` (standalone version)
- `backend/src/db/migrations/010_onboarding_module.sql` (migration file)

## API Endpoints

**Base path:** `/api/onboarding`

### Read Operations
- `GET /workboard` — Get all onboarding records (untuk workboard view)
- `GET /job/:job_id` — Get onboarding by job
- `GET /:onboarding_id` — Get full detail (with nested checklist, milestones, schedule, probation)

### Create
- `POST /create` — Create new onboarding record (auto-generates default checklist, milestones, schedule, probation check-ins)

### Update
- `PUT /:onboarding_id/checklist/:item_id` — Update checklist item status
- `PUT /:onboarding_id/milestone/:milestone_id` — Update milestone status
- `PUT /:onboarding_id/probation/:checkin_id` — Update probation check-in (manager notes, status)
- `POST /:onboarding_id/welcome` — Add/update welcome message
- `PUT /:onboarding_id/advance` — Advance to next stage (pre-boarding → day-1-30 → probation)
- `POST /:onboarding_id/confirm` — Confirm employee (complete probation)

## Module Structure

```
onboarding/
├── onboarding.route.js       # Express routes
├── onboarding.controller.js  # Request handlers
├── onboarding.service.js     # Business logic
├── onboarding.model.js       # Database queries
└── README.md                 # This file
```

## RBAC Permissions

Module: `Offer & Onboard`
Menu: `Onboarding`
Functions: `create`, `read`, `update`

Ensure permissions exist in `global_permissions` table:
```sql
INSERT INTO global_permissions (module_id, menu_id, functionality_name)
SELECT
  (SELECT id FROM master_modules WHERE module_name = 'Offer & Onboard'),
  (SELECT id FROM master_menus WHERE menu_name = 'Onboarding'),
  functionality
FROM (VALUES ('create'), ('read'), ('update')) AS t(functionality);
```

## Frontend Integration

**API client:** `frontend/src/api/onboarding.api.js`
**Page:** `frontend/src/pages/Onboarding.jsx`
**Components:** `frontend/src/components/onboarding/*.jsx`

Current state: Frontend uses mock data. To wire up real API:

```javascript
import { getOnboarding } from '@/api/onboarding.api';

// In Onboarding.jsx useEffect:
const response = await getOnboarding(onboarding_id);
setOnboardingData(response.data.data);
```

## Default Template

When creating a new onboarding record, the service auto-generates:

**Checklist (7 items):**
- KTP, NPWP, BPJS, Bank account, Equipment form, Emergency contact, Welcome kit

**Schedule (5 items):**
- 09:00 HR welcome, 10:00 Team intro, 12:00 Lunch, 14:00 1:1, 16:00 Setup

**Milestones (12 items):**
- Week 1: Workspace access, Codebase tour, First PR, 1:1 cadence
- Week 2: Buddy sync, On-call shadow, Team retro, Goal-setting
- Week 3-4: Lead ticket, First demo, HR check-in, Probation goals

**Probation (3 check-ins):**
- D30, D60, D90 scheduled based on start_date

Templates dapat di-customize per company via admin UI (future work).

## Testing

**Manual test via Postman/curl:**

1. **Create onboarding:**
```bash
POST /api/onboarding/create
Headers: Authorization: Bearer <token>
Body:
{
  "candidate_id": 1,
  "job_id": 123,
  "offer_id": 456,
  "candidate_name": "Bagas Pratama",
  "position_title": "Backend Engineer",
  "start_date": "2026-08-01",
  "buddy_user_id": 5,
  "manager_user_id": 3
}
```

2. **Get detail:**
```bash
GET /api/onboarding/:onboarding_id
Headers: Authorization: Bearer <token>
```

3. **Update checklist:**
```bash
PUT /api/onboarding/:onboarding_id/checklist/:item_id
Headers: Authorization: Bearer <token>
Body:
{
  "status": "done"
}
```

## Next Steps (Future Work)

- [ ] Add email notifications (candidate pre-boarding reminder, buddy assignment)
- [ ] HRIS integration (push to Talenta via webhook)
- [ ] Customizable templates per company
- [ ] Automated nudges (overdue checklist items, missed check-ins)
- [ ] Analytics dashboard (avg time-to-productivity, probation pass rate)
- [ ] Bulk onboarding (batch import new hires)

## Changelog

**v1.0 (14 Jul 2026)** — MVP scaffold
- ✅ Database schema
- ✅ Backend CRUD routes
- ✅ Default template generation
- ✅ Frontend API client
- ⏳ Frontend wiring (uses mock data for now)
