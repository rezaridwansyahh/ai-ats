# ✅ INTERVIEW MODULE — FUNCTIONAL TODO LIST

**Target:** 60% → 100% by Friday 21 June 2026
**Effort:** ~6.5 dev-days (1 week with 2 engineers parallel)
**Current Status:** 18/31 tasks complete

---

## 📊 PROGRESS OVERVIEW

```
Overall Progress: ████████████░░░░░░░░ 60% (18/31 tasks)

By Category:
  Database:     ████████░░░░░░░░░░ 40%  (2/5 tables exist)
  Backend:      █████████████░░░░░ 65%  (15/23 endpoints)
  Frontend L1:  ████████████████████ 100% (Workboard complete)
  Frontend L2:  ████████████████████ 100% (Position complete)
  Frontend L3:  ████████████░░░░░░░ 60%  (2/5 stages complete)
  Frontend L4:  ░░░░░░░░░░░░░░░░░░░ 0%   (Not started)
  State Logic:  ░░░░░░░░░░░░░░░░░░░ 0%   (Not started)
```

---

## ✅ COMPLETED TASKS (18/31)

### **Database (2/5 tables)**
- [x] ✅ Create `interview_position_prep` table (stores AI questions + rubric)
- [x] ✅ Create `interview_schedule` table (stores datetime + location + confirmation)

### **Backend API (15/23 endpoints)**
- [x] ✅ GET `/workboard` — L1 triage view
- [x] ✅ GET `/job/:job_id` — L2 position interviews
- [x] ✅ GET `/:interview_id` — Single interview detail
- [x] ✅ GET `/by-candidate/:candidate_id` — Reverse lookup
- [x] ✅ PATCH `/:interview_id/status` — Status updates
- [x] ✅ GET `/:interview_id/schedules` — Schedule list
- [x] ✅ POST `/:interview_id/schedules` — Create schedule
- [x] ✅ PUT `/schedules/:schedule_id` — Update schedule
- [x] ✅ POST `/schedules/:schedule_id/confirm` — Confirm attendance
- [x] ✅ POST `/schedules/:schedule_id/unconfirm` — Unconfirm
- [x] ✅ DELETE `/schedules/:schedule_id` — Delete schedule
- [x] ✅ GET `/job/:job_id/prep` — Get prep questions
- [x] ✅ POST `/job/:job_id/prep/questions/generate` — AI generate questions
- [x] ✅ PUT `/job/:job_id/prep/questions` — Update questions
- [x] ✅ PUT `/job/:job_id/prep/rubric` — Update rubric

### **Frontend L1 Workboard (5/5 features)**
- [x] ✅ Show all interviews across positions (triage view)
- [x] ✅ Status filter chips (Ongoing / Scheduled / Done)
- [x] ✅ Search by candidate name
- [x] ✅ Pagination (25 per page)
- [x] ✅ Click row → navigate to L2 Position

### **Frontend L2 Position (3/3 features)**
- [x] ✅ Show all interviews for this job
- [x] ✅ Group by round (R1 / R2 / R3 implied)
- [x] ✅ Click candidate → navigate to L3 Candidate

### **Frontend L3 Candidate — Prep Tab (4/4 features)**
- [x] ✅ Display AI-generated interview questions
- [x] ✅ Show rubric with competency criteria
- [x] ✅ Edit questions functionality
- [x] ✅ Lock/unlock rubric

### **Frontend L3 Candidate — Schedule Tab (5/5 features)**
- [x] ✅ Datetime picker for interview date/time
- [x] ✅ Location input (Office / Zoom)
- [x] ✅ Panelist selection dropdown
- [x] ✅ Create schedule button
- [x] ✅ Confirm/unconfirm actions

---

## 🔴 CRITICAL PRIORITY — Must Complete by Wed 19 Jun

### **Mon 15 Jun — Database Foundation (1 day)**

#### **Task Group 1: Create Missing Tables**
- [ ] ❌ Create `interview_round` table
  - **Purpose:** State machine for each round (prep → scheduled → in_progress → done → decided)
  - **Columns:** id, interview_id, company_id, round_number (1/2/3), round_kind (hr_screen/hiring_manager/panel), status, verdict (pass/fail), notes, created_at, updated_at
  - **Constraint:** UNIQUE(interview_id, round_number)
  - **Why Critical:** Enables all state transitions, without this table nothing else works

- [ ] ❌ Create `interview_panelist` table
  - **Purpose:** Track who is interviewing (supports multi-panelist R3)
  - **Columns:** id, interview_round_id, user_id, role (lead/technical/observer), created_at
  - **Constraint:** UNIQUE(interview_round_id, user_id)
  - **Why Critical:** Needed for R3 panel interviews (2-5 panelists)

- [ ] ❌ Create `interview_scorecard` table
  - **Purpose:** Store evaluation scores with immutability via locked_at
  - **Columns:** id, interview_round_id, panelist_id, rubric_snapshot (JSONB), scores (JSONB), overall_score, recommendation, notes, locked_at, created_at, updated_at
  - **Constraint:** UNIQUE(interview_round_id, panelist_id)
  - **Why Critical:** Evaluate tab cannot work without this table

- [ ] ❌ Add database indexes for performance
  - **Indexes Needed:**
    - `interview_round`: (company_id, created_at DESC), (status)
    - `interview_scorecard`: (locked_at) WHERE locked_at IS NOT NULL
  - **Why:** Workboard queries will be slow without indexes

- [ ] ❌ Seed test data for development
  - **What to Seed:**
    - 1 candidate in R1 prep (fresh start)
    - 1 candidate in R2 scheduled (mid-process)
    - 1 candidate in R3 decided (ready to advance)
  - **Why:** Developers need sample data to test each stage

---

### **Tue 16 Jun — Complete Conduct Tab (3h)**

#### **Task Group 2: Conduct Tab Enhancement**
- [ ] ⚠️ Add notes textarea with auto-save
  - **Current State:** Tab exists but notes capture incomplete
  - **Needed:** Large textarea for interview notes, auto-save every 30 seconds
  - **Why:** Prevent data loss if browser crashes during interview

- [ ] ❌ Add "Mark Interview Complete" button
  - **Function:** Saves notes + transitions status from `in_progress` to `done`
  - **UI:** Green button at bottom of Conduct tab
  - **Backend:** PATCH `/rounds/:round_id/status` with validation

- [ ] ❌ Show AI-generated questions as reference
  - **Display:** Load questions from `interview_position_prep.questions`
  - **Layout:** Show in collapsible sidebar or top section
  - **Why:** Panelist needs questions as guide during interview

- [ ] ❌ Add interview duration timer (optional)
  - **Function:** Track how long interview actually took
  - **Display:** Clock icon with elapsed time (e.g., "47 min")
  - **Storage:** Save duration to `interview_round` table

---

### **Wed 17 Jun — Build Evaluate Tab (4h) 🚨 GO/NO-GO CHECKPOINT**

#### **Task Group 3: Scorecard Form**
- [ ] ❌ Build Evaluate tab layout with rubric display
  - **Load:** Fetch rubric from `interview_position_prep.rubric_items`
  - **Show:** Each criterion as card with name, description, weight

- [ ] ❌ Add scoring slider for each criterion (1-10 scale)
  - **UI:** Shadcn Slider component
  - **Display:** Large score number (e.g., "7/10")
  - **Anchors:** Show low anchor text (1-3) and high anchor text (8-10)

- [ ] ❌ Calculate weighted overall score automatically
  - **Formula:** `(criterion1_score × weight1 + criterion2_score × weight2 + ...) / total_weight`
  - **Display:** Large number at top (e.g., "Overall: 7.8/10")
  - **Update:** Recalculate every time slider moves

- [ ] ❌ Add recommendation dropdown
  - **Options:** Strong Hire / Hire / No Hire / Strong No Hire
  - **Styling:** Color-coded (green for Hire, red for No Hire)
  - **Required:** Cannot submit without selecting recommendation

- [ ] ❌ Add summary notes textarea
  - **Purpose:** Panelist adds qualitative evaluation
  - **Placeholder:** "Summary of interview performance..."
  - **Min Height:** 150px

- [ ] ❌ Add "Submit & Lock" button with confirmation dialog
  - **Warning:** "Once submitted, this scorecard CANNOT be edited. Continue?"
  - **Action:** Sets `locked_at = NOW()` in database
  - **Post-Submit:** Disable all inputs, show lock icon

- [ ] ❌ Store rubric snapshot with scorecard
  - **Why:** If job rubric changes later, locked scorecards remain valid
  - **Field:** `rubric_snapshot` (JSONB copy of rubric_items)

- [ ] ❌ Show lock warning banner if already locked
  - **Display:** Yellow banner at top: "This scorecard is locked and cannot be edited"
  - **Icon:** Lock icon
  - **Disable:** All inputs (sliders, dropdown, textarea, buttons)

**🚨 WED 19 JUN CHECKPOINT:** If scorecard lock not working by 17:00 → escalate for scope reduction (skip L4 Calibration)

---

## 🟡 HIGH PRIORITY — Must Complete by Fri 21 Jun

### **Thu 18 Jun AM — Build Decide Tab (3h)**

#### **Task Group 4: Decision Making**
- [ ] ❌ Show summary of all scorecards for this round
  - **Fetch:** GET `/rounds/:round_number/scorecards`
  - **Display:** Cards with panelist name, score, recommendation

- [ ] ❌ Calculate average score across all panelists
  - **Formula:** `SUM(overall_score) / COUNT(scorecards)`
  - **Display:** Large metric card at top (e.g., "Average: 7.8/10")
  - **Why:** Important for R3 with multiple panelists

- [ ] ❌ Show hire/no-hire vote breakdown
  - **Count:** How many recommended "Hire" vs "No Hire"
  - **Display:** Metric card (e.g., "Hire Votes: 3/3")
  - **Visual:** Green checkmarks vs red X marks

- [ ] ❌ Display individual panelist scorecards in table
  - **Columns:** Panelist Name, Overall Score, Recommendation, Notes
  - **Expand:** Click row to see detailed scores per criterion
  - **Why:** Hiring Manager needs to see all perspectives

- [ ] ❌ Block decision until all panelists lock scorecards (multi-panelist rule)
  - **Check:** `COUNT(locked_at IS NOT NULL) = COUNT(*)`
  - **If Blocked:** Show warning banner: "Waiting for all panelists to submit"
  - **Why:** Cannot decide with incomplete evaluations

- [ ] ❌ Add PASS button that auto-creates next round
  - **Text:** "Pass to Round 2" (or "Pass to Round 3" or "Pass to Assessment")
  - **Action:**
    1. Set `interview_round.verdict = 'pass'`
    2. Create next round row (or `candidate_assessment` if R3)
    3. Update pipeline stage
  - **Color:** Green button, large

- [ ] ❌ Add FAIL button that moves candidate to Rejected
  - **Text:** "Reject Candidate"
  - **Action:**
    1. Set `interview_round.verdict = 'fail'`
    2. Update pipeline stage to "Rejected"
  - **Warning:** Confirmation dialog: "This is a terminal decision. Continue?"
  - **Color:** Red button, large

- [ ] ❌ Show success message with next steps
  - **PASS:** "Candidate advanced to Round 2" + link to next round
  - **FAIL:** "Candidate rejected. Moved to Rejected stage."
  - **Redirect:** Back to L2 Position view

---

### **Thu 18 Jun PM — Build L4 Calibration Page (2h)**

#### **Task Group 5: Bulk Advance**
- [ ] ❌ Create Calibration page route
  - **URL:** `/interview/job/:jobId/calibration/:roundNumber`
  - **Access:** From L2 Position view (new "Calibration" tab)

- [ ] ❌ Filter candidates ready to advance
  - **Query:** `WHERE status='decided' AND verdict='pass'`
  - **Display:** Only candidates who passed this round
  - **Why:** Don't show failed/in-progress candidates

- [ ] ❌ Show table with candidate data
  - **Columns:** Checkbox, Candidate Name, Position, Avg Score, Hire Votes, Status
  - **Sorting:** Default sort by avg_score DESC (highest first)
  - **Styling:** Zebra striping for readability

- [ ] ❌ Add multi-select checkboxes
  - **Header Checkbox:** Select all / deselect all
  - **Row Checkboxes:** Individual selection
  - **Count:** Show "X selected" below table

- [ ] ❌ Add "Advance N to Round X" button
  - **Text:** Dynamic based on round (e.g., "Advance 5 to Round 2")
  - **Disabled:** If no candidates selected
  - **Color:** Primary blue, large

- [ ] ❌ Implement transactional bulk advance
  - **Backend:** Use database transaction (BEGIN...COMMIT)
  - **All-or-Nothing:** If any candidate fails to advance, rollback entire batch
  - **Create Rows:** For each selected candidate, create next round row
  - **Why:** Prevent partial failures (some advance, some don't)

- [ ] ❌ Show success toast notification
  - **Message:** "5 candidates advanced to Round 2"
  - **Duration:** 3 seconds
  - **Action:** Refresh table (remove advanced candidates from list)

---

### **Fri 19 Jun — State Machine + Testing (4h)**

#### **Task Group 6: Backend Enforcement**
- [ ] ❌ Validate state transitions in backend
  - **Valid Paths:** prep→scheduled, scheduled→in_progress, in_progress→done, done→decided
  - **Function:** `validateTransition(currentStatus, newStatus)` in service layer
  - **Where:** Called in `updateRoundStatus()` before UPDATE query

- [ ] ❌ Reject invalid transitions with clear error message
  - **Example:** If status=`prep`, trying to change to `done` → 400 error
  - **Message:** "Invalid transition: prep → done. Must go through scheduled and in_progress."
  - **Format:** JSON response with `status: 400, message: "..."`

- [ ] ❌ Log all state changes to audit_log table
  - **Fields:** entity_type='interview_round', entity_id, action='status_change', user_id, company_id, metadata (from→to)
  - **When:** After every successful status update
  - **Why:** Compliance requirement, track who changed what

- [ ] ❌ Enforce tenant scoping on all interview queries
  - **Pattern:** Every query must include `WHERE company_id = $1`
  - **Check:** In service layer before executing query
  - **Error:** If company_id mismatch → 403 Forbidden
  - **Why:** Prevent Company A from seeing Company B's interviews

- [ ] ❌ Prevent editing scorecard after locked_at timestamp
  - **Backend Validation:** Before UPDATE scorecard, check `locked_at IS NOT NULL`
  - **If Locked:** Return 400 error: "Cannot edit locked scorecard"
  - **Frontend:** Disable inputs if locked (defensive, backend is source of truth)

- [ ] ❌ Test end-to-end interview flow
  - **Steps:**
    1. Create candidate in R1 prep
    2. Generate questions (Prep tab)
    3. Create schedule (Schedule tab)
    4. Mark interview complete (Conduct tab)
    5. Submit & lock scorecard (Evaluate tab)
    6. Click PASS (Decide tab)
    7. Verify R2 row created with status=prep
    8. Repeat steps 2-7 for R2 → R3
    9. R3 PASS → verify `candidate_assessment` created
  - **Pass Criteria:** All steps complete without errors
  - **Evidence:** Screenshot of candidate in Assessment stage

---

## 🟢 MEDIUM PRIORITY — Nice to Have (Defer if Time Runs Out)

### **Optional Enhancements**
- [ ] ❌ Send email notification to panelist when assigned
  - **Trigger:** When schedule created + panelist assigned
  - **Content:** Interview date/time, candidate name, Zoom link
  - **Calendar:** Attach .ics file for calendar import

- [ ] ❌ Send email notification to candidate with interview schedule
  - **Trigger:** After schedule confirmed
  - **Content:** Interview date/time, location/Zoom link, interviewer name
  - **Tone:** Professional, welcoming

- [ ] ❌ Notify hiring manager when all scorecards submitted
  - **Trigger:** When last panelist locks scorecard
  - **Content:** "All scorecards submitted for [Candidate Name]. Ready for decision."
  - **Link:** Direct link to Decide tab

- [ ] ❌ iCal export for interview schedule
  - **Function:** Download .ics file
  - **Fields:** Title, datetime, location, description
  - **Why:** Panelist can add to their calendar

- [ ] ❌ Google Calendar sync (via API)
  - **Integration:** Google Calendar API
  - **Auto-Create:** When schedule created, add to panelist's Google Calendar
  - **Update:** Sync changes if schedule updated

- [ ] ❌ AI suggests rubric items based on role type
  - **Function:** When creating prep, AI recommends rubric criteria for this role
  - **Example:** Engineering role → suggest "Technical Problem Solving", "Code Quality"
  - **Editable:** Recruiter can accept/edit/remove suggestions

- [ ] ❌ Analytics dashboard for interview performance
  - **Metrics:**
    - Time-to-hire by round (avg days from R1→R2→R3)
    - Pass rate per round (what % pass R1, R2, R3)
    - Top-performing panelists (highest correlation with eventual hires)
  - **Display:** Charts + tables on Interview Dashboard

---

## 📋 TASK DEPENDENCIES

### **Cannot Start Until:**
- **Evaluate Tab** → depends on `interview_scorecard` table
- **Decide Tab** → depends on `interview_scorecard` table (to load scorecards)
- **L4 Calibration** → depends on Decide tab (to have decided candidates)
- **State Machine Logic** → depends on `interview_round` table
- **End-to-End Test** → depends on all above complete

### **Can Work in Parallel:**
- **Database tables** + **Conduct tab** (different engineers)
- **Evaluate tab** + **Backend endpoints** (FE + BE parallel)
- **Decide tab** + **L4 Calibration** (different features)

---

## 🎯 DEFINITION OF DONE

### **Per Task:**
- [ ] Code written and committed to repo
- [ ] No console errors in browser
- [ ] Works in both Chrome and Safari
- [ ] Tenant scoping enforced (cannot see other company's data)
- [ ] Mobile-responsive (optional but nice)

### **Per Module (100% Complete):**
- [ ] All 31 tasks checked ✅
- [ ] Can complete full R1→R2→R3→Assessment flow
- [ ] State machine validation working
- [ ] Scorecard immutability enforced
- [ ] Bulk advance working for 5 candidates
- [ ] No 500 errors in backend logs
- [ ] Database migration documented
- [ ] Seed data script working

---

## 📅 DAILY CHECKLIST

### **Monday 15 Jun:**
- [ ] Create 3 missing tables (round, panelist, scorecard)
- [ ] Add indexes
- [ ] Seed test data
- [ ] Verify tables exist: `\dt interview_*` shows 5 tables

### **Tuesday 16 Jun:**
- [ ] Complete Conduct tab (notes + auto-save + mark complete)
- [ ] Test: Can mark interview complete → status changes to `done`

### **Wednesday 17 Jun (GO/NO-GO):**
- [ ] Build Evaluate tab (scorecard form)
- [ ] Test: Can submit & lock scorecard → `locked_at` set
- [ ] Test: Cannot edit after lock → UI disabled + backend rejects
- [ ] **CHECKPOINT 17:00:** If not working → escalate

### **Thursday 18 Jun:**
- [ ] AM: Build Decide tab (summary + PASS/FAIL)
- [ ] Test: PASS creates R2 row
- [ ] PM: Build L4 Calibration (bulk advance)
- [ ] Test: Can advance 5 candidates R1→R2

### **Friday 19 Jun:**
- [ ] Implement state machine validation
- [ ] Add audit logging
- [ ] Run end-to-end test (R1→R2→R3→Assessment)
- [ ] Fix any bugs found
- [ ] **EOD:** Mark Interview module 100% if all tests pass

---

## 🚨 RISK MITIGATION

### **If Behind Schedule:**

**Wed 19 Jun — If Evaluate tab not working:**
- **Action:** Escalate to PM for scope reduction
- **Option 1:** Skip L4 Calibration (defer to v0.1.5)
  - Recruiters can still advance candidates one-by-one via Decide tab
  - Saves 2 dev-days
- **Option 2:** Simplify Evaluate tab (remove weighted scoring, use simple average)
  - Saves 4 hours
- **Decision:** PM + CTO + Engineering Lead

**Fri 21 Jun — If still < 90% complete:**
- **Action:** Mark module as "Partial" and ship what's done
- **Minimum Viable:**
  - L1 + L2 + L3 (Prep + Schedule + Conduct) = 50% value
  - Can still conduct interviews, just no scorecard/decision in system
  - Manual decision process via email/Slack
- **Defer to v0.1.5:**
  - Evaluate tab
  - Decide tab
  - L4 Calibration
  - State machine

---

**Document Version:** 1.0
**Created:** 14 June 2026
**Target Completion:** 21 June 2026 (Friday 17:00)
**Owner:** Engineering Team
**Status:** 18/31 tasks complete (58%)
