# Onboarding Module — Setup Guide

**Status:** ✅ MVP Scaffold Complete
**Date:** 14 Jul 2026
**Migration:** 010_onboarding_module

---

## Quick Start

### 1. **Apply Database Schema**

```bash
cd backend
node src/db/run-script.js
```

Ini akan:
- Reset semua tables (⚠️ destructive!)
- Apply Migration 010 (onboarding tables)
- Run seeds
- Sync sequences

### 2. **Start Backend**

```bash
cd backend
NODE_ENV=development node app.js
```

Verify onboarding route mounted:
```
Server is listening on port: 3000
```

Test endpoint:
```bash
curl http://localhost:3000/api/onboarding/workboard \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 3. **Start Frontend**

```bash
cd frontend
npm run dev
```

Navigate to: `http://localhost:5173/onboarding`

**Note:** Frontend currently uses mock data. Real API integration pending.

---

## What Was Built

### **Backend (7 files created)**

1. **Database Schema:**
   - ✅ `backend/src/db/migrations/010_onboarding_module.sql` — Standalone migration
   - ✅ `backend/src/db/onboarding-schema.sql` — Standalone schema
   - ✅ `backend/src/db/setup.sql` — Updated (lines 2-9: DROP, lines 855-991: CREATE)

2. **Backend Module:**
   - ✅ `backend/src/modules/onboarding/onboarding.model.js` — DB queries
   - ✅ `backend/src/modules/onboarding/onboarding.service.js` — Business logic + templates
   - ✅ `backend/src/modules/onboarding/onboarding.controller.js` — Request handlers
   - ✅ `backend/src/modules/onboarding/onboarding.route.js` — Express routes
   - ✅ `backend/src/modules/onboarding/README.md` — Documentation

3. **App Integration:**
   - ✅ `backend/app.js` — Import + mount `/api/onboarding` (lines 49, 92, 128)

### **Frontend (1 file created)**

- ✅ `frontend/src/api/onboarding.api.js` — API client functions
- ✅ `frontend/src/pages/Onboarding.jsx` — Updated comment (line 137)

---

## Database Tables (7 tables)

| Table | Purpose | Records on Create |
|-------|---------|-------------------|
| `candidate_onboarding` | Main record | 1 |
| `onboarding_checklist_item` | Pre-boarding checklist | 7 (KTP, NPWP, BPJS, etc.) |
| `onboarding_day_one_schedule` | First day schedule | 5 (09:00-16:00 activities) |
| `onboarding_milestone` | Day 1-30 milestones | 12 (Week 1-4 tasks) |
| `onboarding_probation_checkin` | D30, D60, D90 check-ins | 3 |
| `onboarding_welcome_message` | Manager welcome | 0 (optional) |
| `onboarding_hris_task` | HRIS integration queue | 0 (future) |

---

## API Endpoints

**Base:** `/api/onboarding`
**Auth:** JWT + RBAC (`Offer & Onboard` → `Onboarding` → `create`/`read`/`update`)

### **GET**
- `/workboard` — List all onboarding (with progress %)
- `/job/:job_id` — Filter by job
- `/:onboarding_id` — Full detail (nested: checklist, schedule, milestones, probation)

### **POST**
- `/create` — Create new onboarding (auto-generates template)
- `/:id/welcome` — Add welcome message
- `/:id/confirm` — Confirm employee (complete probation)

### **PUT**
- `/:id/checklist/:item_id` — Update checklist item
- `/:id/milestone/:milestone_id` — Update milestone
- `/:id/probation/:checkin_id` — Update probation check-in
- `/:id/advance` — Advance stage (pre-boarding → day-1-30 → probation)

---

## Testing

### **1. Create Onboarding**

```bash
curl -X POST http://localhost:3000/api/onboarding/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "job_id": 123,
    "offer_id": 456,
    "candidate_name": "Test User",
    "position_title": "Backend Engineer",
    "start_date": "2026-08-01",
    "buddy_user_id": 5,
    "manager_user_id": 3
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "candidate_name": "Test User",
    "current_stage": "pre-boarding",
    "onboarding_status": "pending",
    ...
  },
  "message": "Onboarding created successfully"
}
```

### **2. Get Detail**

```bash
curl http://localhost:3000/api/onboarding/1 \
  -H "Authorization: Bearer <token>"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "job": { "id": 123, "title": "Backend Engineer" },
    "candidateName": "Test User",
    "preBoarding": {
      "startDate": "1 Aug",
      "daysUntilStart": 18,
      "pctComplete": 0,
      "checklist": [
        { "label": "KTP", "status": "notStarted", "owner": "Candidate" },
        ...
      ]
    },
    "dayOneThirty": { ... },
    "probation": { ... }
  }
}
```

### **3. Update Checklist**

```bash
curl -X PUT http://localhost:3000/api/onboarding/1/checklist/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "done" }'
```

---

## Frontend Integration (TODO)

### **Current State:**
- ✅ UI components ready ([Onboarding.jsx](frontend/src/pages/Onboarding.jsx))
- ✅ API client ready ([onboarding.api.js](frontend/src/api/onboarding.api.js))
- ⏳ Uses mock data (line 143)

### **To Wire Real API:**

1. **Add route with parameter:**
   ```javascript
   // frontend/src/App.jsx
   <Route path="/onboarding/:onboardingId" element={<Onboarding />} />
   ```

2. **Update Onboarding.jsx:**
   ```javascript
   import { useParams } from 'react-router-dom';
   import { getOnboarding } from '@/api/onboarding.api';

   const { onboardingId } = useParams();

   useEffect(() => {
     const response = await getOnboarding(onboardingId);
     setOnboardingData(response.data.data);
   }, [onboardingId]);
   ```

3. **Navigation from workboard:**
   ```javascript
   navigate(`/onboarding/${onboarding.id}`);
   ```

---

## RBAC Setup (Required)

Ensure permissions exist in database:

```sql
-- Check if "Onboarding" menu exists
SELECT * FROM master_menus WHERE menu_name = 'Onboarding';

-- If not exists, add permissions manually:
INSERT INTO global_permissions (module_menu_id, functionality_name)
SELECT
  mm.id,
  func
FROM mapping_modules_menus mm
JOIN master_modules mo ON mm.module_id = mo.id
JOIN master_menus me ON mm.menu_id = me.id,
LATERAL (VALUES ('create'), ('read'), ('update')) AS t(func)
WHERE mo.module_name = 'Offer & Onboard'
  AND me.menu_name = 'Onboarding';
```

**Note:** If seed data doesn't include "Onboarding" menu, add it to `backend/src/db/data/menus.js`.

---

## Default Template

Auto-generated on `POST /create`:

**Checklist (7 items):**
1. KTP (re-verified vs BG check)
2. NPWP
3. BPJS Kesehatan number
4. Bank account
5. Equipment form
6. Emergency contact
7. Welcome kit

**Schedule (5 items):**
- 09:00 HR welcome
- 10:00 Team introduction
- 12:00 Team lunch
- 14:00 1:1 with manager
- 16:00 Setup & access

**Milestones (12 items):**
- **Week 1:** Workspace access, Codebase tour, First PR, 1:1 cadence
- **Week 2:** Buddy sync, On-call shadow, Team retro, Goal-setting
- **Week 3-4:** Lead ticket, First demo, HR check-in, Probation goals

**Probation (3 check-ins):**
- D30, D60, D90 (auto-scheduled from `start_date`)

---

## Troubleshooting

### **Error: "relation 'candidate_onboarding' does not exist"**

**Cause:** Schema not applied.

**Fix:**
```bash
cd backend
node src/db/run-script.js
```

### **Error: "Permission denied for module Offer & Onboard"**

**Cause:** User role doesn't have permissions.

**Fix:** Assign permissions in `mapping_roles_permissions` table or via admin UI.

### **Error: "Cannot read properties of undefined (reading 'data')"**

**Cause:** Frontend trying to call API but backend not running.

**Fix:**
```bash
cd backend
NODE_ENV=development node app.js
```

### **Frontend shows mock data instead of real data**

**Cause:** Frontend wiring not completed yet.

**Status:** Expected behavior. See "Frontend Integration (TODO)" section above.

---

## Next Steps

**Immediate (for v0.1.5 Week 1):**
1. ✅ Run migration: `node src/db/run-script.js`
2. ⏳ Test API endpoints via Postman
3. ⏳ Add RBAC permissions to seeds
4. ⏳ Wire frontend (replace mock data)

**Future (post-v0.1.5):**
- Email notifications (pre-boarding reminder, buddy assignment)
- HRIS integration (push to Talenta)
- Customizable templates per company
- Analytics dashboard (time-to-productivity, probation pass rate)
- Automated nudges (overdue tasks, missed check-ins)

---

## Files Reference

**Backend:**
- Schema: [setup.sql:855-991](backend/src/db/setup.sql#L855), [onboarding-schema.sql](backend/src/db/onboarding-schema.sql)
- Module: [onboarding/](backend/src/modules/onboarding/)
- Routes: [app.js:49,92,128](backend/app.js#L49)

**Frontend:**
- API: [onboarding.api.js](frontend/src/api/onboarding.api.js)
- Page: [Onboarding.jsx](frontend/src/pages/Onboarding.jsx)
- Components: [onboarding/](frontend/src/components/onboarding/)

**Docs:**
- Module README: [backend/src/modules/onboarding/README.md](backend/src/modules/onboarding/README.md)
- This guide: [ONBOARDING_SETUP.md](ONBOARDING_SETUP.md)

---

**Questions?** Check [backend/src/modules/onboarding/README.md](backend/src/modules/onboarding/README.md) for detailed API docs.
