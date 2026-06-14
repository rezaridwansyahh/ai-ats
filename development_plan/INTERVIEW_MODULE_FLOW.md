# 📋 INTERVIEW MODULE — COMPLETE FLOW DOCUMENTATION

**Created:** 14 June 2026
**Status:** 60% Complete (Target: 100% by 21 June)
**Module:** Interview (IV-01..05 × R1/R2/R3)

---

## 🎯 PURPOSE

This document describes the **complete interview workflow** for the Myralix ATS. Each candidate who passes AI Screening enters a **3-round interview process** (R1 HR Screen → R2 Hiring Manager → R3 Panel). Each round has **5 sequential sub-stages** that must be completed in order.

---

## 🔄 THE COMPLETE WORKFLOW

### Overview: 3 Rounds × 5 Stages

```
ROUND 1: HR SCREEN (1 panelist)
  ├─ ① Prep      → AI generates questions, recruiter assigns panelist
  ├─ ② Schedule  → Date/time/location set, panelist notified
  ├─ ③ Conduct   → Panelist captures notes during interview
  ├─ ④ Evaluate  → Panelist fills scorecard, locks it (immutable)
  └─ ⑤ Decide    → Hiring Manager reviews, decides PASS or FAIL
       │
       ├─ PASS → Auto-create Round 2
       └─ FAIL → Move to "Rejected" pipeline stage

ROUND 2: HIRING MANAGER (1 panelist)
  ├─ Same 5 stages
  └─ PASS → Auto-create Round 3 | FAIL → Rejected

ROUND 3: PANEL INTERVIEW (2-5 panelists)
  ├─ Same 5 stages
  ├─ Multiple panelists each submit scorecard
  ├─ Decide waits until ALL scorecards locked
  └─ PASS → Advance to Assessment (Psych module) | FAIL → Rejected
```

---

## 📊 STAGE-BY-STAGE BREAKDOWN

### **Stage ① PREP** (Status: `prep`)

#### **Purpose:**
Generate AI interview questions and create scoring rubric for this position.

#### **User Actions:**
1. Recruiter clicks "Generate Questions" button
2. System calls OpenAI with JD + required skills context
3. AI streams 10-15 interview questions (SSE)
4. Recruiter reviews/edits questions
5. System creates default rubric (6 criteria: Leadership, Problem Solving, etc.)
6. Recruiter assigns panelist(s) for this round
7. System saves to `interview_position_prep` table

#### **Data Stored:**
- `interview_position_prep.questions` (JSONB array)
- `interview_position_prep.rubric_items` (JSONB array with weights + anchors)

#### **Transition:**
- Status moves: `prep → scheduled` when schedule created

---

### **Stage ② SCHEDULE** (Status: `scheduled`)

#### **Purpose:**
Set interview date/time/location and notify panelist.

#### **User Actions:**
1. Recruiter picks date + time (datetime picker)
2. Selects location type: Office / Zoom
3. If Office: enter room name
4. If Zoom: enter meeting link
5. System creates `interview_schedule` row
6. System sends email to panelist (with calendar invite)

#### **Data Stored:**
- `interview_schedule.scheduled_at` (timestamp)
- `interview_schedule.location` (string)
- `interview_schedule.confirmed` (boolean)

#### **Transition:**
- Status moves: `scheduled → in_progress` when panelist clicks "Begin Interview"

---

### **Stage ③ CONDUCT** (Status: `in_progress`)

#### **Purpose:**
Panelist conducts interview and captures notes in real-time.

#### **User Actions:**
1. Panelist opens interview page (sees AI-generated questions as guide)
2. Panelist captures notes in textarea during interview
3. System auto-saves notes every 30 seconds
4. Panelist clicks "Mark Interview Complete"
5. System transitions status to `done`

#### **Data Stored:**
- `interview_round.notes` (text)
- `interview_round.status = 'done'`

#### **Transition:**
- Status moves: `in_progress → done` after "Mark Complete"

---

### **Stage ④ EVALUATE** (Status: `done` → waiting for scorecard)

#### **Purpose:**
Panelist evaluates candidate using rubric-based scorecard.

#### **User Actions:**
1. Panelist opens Evaluate tab
2. System loads rubric from `interview_position_prep.rubric_items`
3. For each criterion:
   - Panelist sees criterion name + description
   - Sees anchor text (1-3: Poor / 8-10: Excellent)
   - Moves slider to score (1-10)
4. System calculates weighted overall score automatically
5. Panelist selects recommendation: Strong Hire / Hire / No Hire / Strong No Hire
6. Panelist adds summary notes
7. Panelist clicks **"Submit & Lock"** (with confirmation dialog)
8. System sets `locked_at` timestamp → **scorecard becomes IMMUTABLE**

#### **Data Stored:**
- `interview_scorecard.rubric_snapshot` (copy of rubric at time of scoring)
- `interview_scorecard.scores` (JSONB: `{"leadership": 8, "problem_solving": 7, ...}`)
- `interview_scorecard.overall_score` (weighted average)
- `interview_scorecard.recommendation` (enum)
- `interview_scorecard.locked_at` (timestamp — makes it immutable)

#### **Business Rules:**
- ✅ Scorecard can be edited BEFORE `locked_at`
- ❌ Scorecard is **IMMUTABLE** after `locked_at` (compliance requirement)
- ❌ Even admin cannot unlock (audit trail integrity)
- ✅ Rubric snapshot stored (if job rubric changes later, old scores remain valid)

#### **Transition:**
- Status moves: `done → decided` (waiting for Hiring Manager decision)

---

### **Stage ⑤ DECIDE** (Status: `decided`)

#### **Purpose:**
Hiring Manager reviews scorecards and makes final decision for this round.

#### **User Actions:**
1. Hiring Manager opens Decide tab
2. System shows:
   - Average score across all panelists
   - Number of "Hire" vs "No Hire" votes
   - Table of individual panelist scorecards
3. **Multi-panelist blocking rule (R3 only):**
   - If ANY panelist hasn't locked scorecard → Decision blocked
   - Warning shown: "Waiting for all panelists to submit"
4. Hiring Manager clicks **PASS** or **FAIL**

#### **PASS Action:**
- System sets `interview_round.verdict = 'pass'`
- System auto-creates next round:
  - R1 PASS → Create R2 row (status=`prep`)
  - R2 PASS → Create R3 row (status=`prep`)
  - R3 PASS → Create `candidate_assessment` row (advance to Psych module)
- System updates pipeline stage in Dashboard
- Success message: "Candidate advanced to Round X"

#### **FAIL Action:**
- System sets `interview_round.verdict = 'fail'`
- System updates pipeline stage to "Rejected"
- Terminal state (candidate cannot be un-rejected)

#### **Data Stored:**
- `interview_round.verdict` (enum: `pass` / `fail`)
- `interview_round.status = 'decided'`

---

## 🏗️ STATE MACHINE

### **Valid Transitions:**

```
prep → scheduled → in_progress → done → decided
```

| From State | To State | Trigger | Who Can Do |
|------------|----------|---------|------------|
| `prep` | `scheduled` | Schedule created | Recruiter |
| `scheduled` | `in_progress` | Panelist clicks "Begin Interview" | Panelist |
| `in_progress` | `done` | Panelist clicks "Mark Complete" | Panelist |
| `done` | `decided` | All scorecards locked + HM decides | Hiring Manager |

### **Invalid Transitions (will return 400 error):**
- ❌ `prep → in_progress` (skipping schedule)
- ❌ `done → scheduled` (going backwards)
- ❌ `decided → prep` (cannot restart decided round)

### **Enforcement:**
- Backend validates every status update
- Invalid transition → HTTP 400 error
- All transitions logged to `audit_log` table

---

## 👥 MULTI-PANELIST LOGIC (R3 Panel Interview)

### **Difference from R1/R2:**

| Aspect | R1/R2 (Single Panelist) | R3 (Panel Interview) |
|--------|-------------------------|----------------------|
| Panelists | 1 (HR or HM) | 2-5 (e.g., CTO + Tech Lead + Senior Dev) |
| Scorecard | 1 scorecard | Each panelist submits separate scorecard |
| Decide blocking | No blocking | Decide blocked until ALL scorecards locked |
| Average score | Not applicable | Average across all panelists shown |

### **R3 Workflow:**
1. Recruiter assigns 3 panelists (e.g., CTO, Tech Lead, Senior Dev)
2. All 3 attend interview (same schedule)
3. After interview, each panelist fills **separate scorecard**
4. Decide tab is **blocked** until all 3 lock their scorecards
5. Hiring Manager sees:
   - Average score: (CTO: 8 + Lead: 7 + Senior: 9) / 3 = **8.0**
   - Hire votes: 3/3 recommended "Hire"
   - Individual breakdown table
6. Hiring Manager decides PASS or FAIL

---

## 🔐 SCORECARD LOCKING (Critical Compliance Rule)

### **Why Locking Matters:**
- **Audit requirement:** Scores must be tamper-proof after submission
- **Legal protection:** In case of discrimination claims, locked scorecards prove fair process
- **Data integrity:** Prevents retroactive score changes after candidate hired/rejected

### **Technical Implementation:**
```sql
CREATE TABLE interview_scorecard (
  ...
  locked_at TIMESTAMPTZ,  -- NULL = editable, NOT NULL = immutable
  ...
);
```

### **Business Rules:**
1. **Before Lock:**
   - ✅ Panelist can edit scores
   - ✅ Panelist can save draft
   - ✅ Panelist can change recommendation

2. **After Lock:**
   - ❌ Cannot edit any field
   - ❌ Cannot unlock (no "Undo" button)
   - ❌ Even admin/superuser cannot unlock
   - ✅ Can view locked scorecard (read-only)

3. **UI Behavior:**
   - Show confirmation dialog: "Once submitted, this scorecard CANNOT be edited. Continue?"
   - After lock: Show yellow warning banner + disable all inputs
   - Lock icon displayed next to scorecard

---

## 📈 ROUND TRANSITIONS

### **R1 → R2 Transition:**
```
User Action:  HM clicks "PASS" on R1 Decide tab
Backend:      1. Set interview_round.verdict = 'pass' WHERE round_number=1
              2. INSERT INTO interview_round (interview_id, round_number, status)
                 VALUES (123, 2, 'prep')
              3. UPDATE candidate_pipeline SET stage = 'Interview R2'
Frontend:     Show success: "Candidate advanced to Round 2"
              Redirect to Interview L2 Position page
```

### **R2 → R3 Transition:**
```
Same as R1→R2, but round_number=3
```

### **R3 → Assessment Transition:**
```
User Action:  HM clicks "PASS" on R3 Decide tab
Backend:      1. Set interview_round.verdict = 'pass' WHERE round_number=3
              2. INSERT INTO candidate_assessment (candidate_id, job_id, status)
                 VALUES (456, 789, 'setup')
              3. UPDATE candidate_pipeline SET stage = 'Assessment'
Frontend:     Show success: "Candidate advanced to Psychometric Assessment"
              Redirect to Assessment module
```

### **Any Round FAIL:**
```
User Action:  HM clicks "FAIL"
Backend:      1. Set interview_round.verdict = 'fail'
              2. UPDATE candidate_pipeline SET stage = 'Rejected'
Frontend:     Show message: "Candidate rejected. Moved to Rejected stage."
              Redirect to Pipeline Dashboard
Note:         This is a TERMINAL state (cannot be undone)
```

---

## 🗄️ DATABASE SCHEMA

### **Core Tables:**

#### **1. interview_round** (State machine)
```sql
CREATE TABLE interview_round (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES candidate_interview(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number IN (1, 2, 3)),
  round_kind VARCHAR(50) NOT NULL CHECK (round_kind IN ('hr_screen', 'hiring_manager', 'panel')),
  status VARCHAR(50) NOT NULL DEFAULT 'prep'
    CHECK (status IN ('prep', 'scheduled', 'in_progress', 'done', 'decided')),
  verdict VARCHAR(50) CHECK (verdict IN ('pass', 'fail', 'maybe')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(interview_id, round_number)
);
```

#### **2. interview_panelist** (Who's interviewing)
```sql
CREATE TABLE interview_panelist (
  id SERIAL PRIMARY KEY,
  interview_round_id INTEGER NOT NULL REFERENCES interview_round(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES master_users(id) ON DELETE CASCADE,
  role VARCHAR(100), -- 'lead', 'technical', 'observer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(interview_round_id, user_id)
);
```

#### **3. interview_scorecard** (Evaluation)
```sql
CREATE TABLE interview_scorecard (
  id SERIAL PRIMARY KEY,
  interview_round_id INTEGER NOT NULL REFERENCES interview_round(id) ON DELETE CASCADE,
  panelist_id INTEGER NOT NULL REFERENCES interview_panelist(id) ON DELETE CASCADE,
  rubric_snapshot JSONB NOT NULL, -- copy of rubric at scoring time
  scores JSONB NOT NULL, -- {"leadership": 8, "problem_solving": 7, ...}
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 10),
  recommendation VARCHAR(50) CHECK (recommendation IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
  notes TEXT,
  locked_at TIMESTAMPTZ, -- immutable after this timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(interview_round_id, panelist_id)
);
```

#### **4. interview_position_prep** (Already exists ✅)
```sql
CREATE TABLE interview_position_prep (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,      -- AI-generated interview questions
  rubric_items JSONB NOT NULL,   -- competency framework with weights
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **5. interview_schedule** (Already exists ✅)
```sql
CREATE TABLE interview_schedule (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES candidate_interview(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 UI NAVIGATION

### **4-Level Workspace Pattern:**

```
L1: Workboard (InterviewWorkboard.jsx) ✅ DONE
  └─ Shows all interviews across positions
  └─ Filter by status: Ongoing / Scheduled / Done
  └─ Click row → L2 Position

L2: Position (Interview-Job.jsx) ✅ DONE
  └─ Shows all interviews for this job
  └─ Groups by round (R1 / R2 / R3)
  └─ Click candidate → L3 Candidate

L3: Candidate (Interview-Candidate.jsx) ⚠️ 60% PARTIAL
  └─ 5-section stepper: Prep / Schedule / Conduct / Evaluate / Decide
  ├─ ① Prep ✅ DONE
  ├─ ② Schedule ✅ DONE
  ├─ ③ Conduct ⚠️ PARTIAL (needs completion)
  ├─ ④ Evaluate ❌ MISSING (scorecard form)
  └─ ⑤ Decide ❌ MISSING (verdict + advance)

L4: Calibration ❌ NOT STARTED
  └─ Shows candidates ready to advance (status=decided, verdict=pass)
  └─ Multi-select + bulk advance button
  └─ Transactional bulk advance (R1→R2, R2→R3, R3→Assessment)
```

---

## ✅ ACCEPTANCE CRITERIA

### **Definition of "100% Complete":**

1. **Database:**
   - ✅ All 5 tables exist (3 missing: round, panelist, scorecard)
   - ✅ Indexes on (company_id, status, locked_at)

2. **Backend:**
   - ✅ State machine validation (reject invalid transitions)
   - ✅ Scorecard immutability enforcement (reject edits after locked_at)
   - ✅ Tenant scoping on all queries
   - ✅ Audit log for state changes
   - ✅ Auto-create next round on PASS

3. **Frontend L3 Candidate:**
   - ✅ Conduct tab: notes + auto-save + "Mark Complete"
   - ✅ Evaluate tab: scorecard form + lock + weighted score
   - ✅ Decide tab: summary + PASS/FAIL buttons + round creation

4. **Frontend L4 Calibration:**
   - ✅ Filter ready-to-advance candidates
   - ✅ Multi-select + bulk advance
   - ✅ Transactional advance

5. **End-to-End Test:**
   - ✅ Can complete R1: Prep → Schedule → Conduct → Evaluate → Decide → PASS
   - ✅ R2 auto-created with status=prep
   - ✅ Can complete R2 → R3 auto-created
   - ✅ Can complete R3 → candidate advances to Assessment

---

## 🚀 DEPLOYMENT CHECKLIST

Before marking Interview module as "Production Ready":

- [ ] Run database migration (3 new tables)
- [ ] Seed test data (1 candidate per round: R1/R2/R3)
- [ ] Test state machine validation (try invalid transition → should fail)
- [ ] Test scorecard locking (try editing locked scorecard → should fail)
- [ ] Test multi-panelist R3 (3 panelists, all lock, then decide)
- [ ] Test bulk advance (select 5 candidates → advance R1→R2)
- [ ] Test tenant isolation (Company A cannot see Company B interviews)
- [ ] Test end-to-end flow (Prep → Decide → R1→R2→R3→Assessment)

---

**Document Version:** 1.0
**Last Updated:** 14 June 2026
**Status:** Work in Progress (60% → 100% by 21 June)
**Owner:** Engineering Team
**Reference:** Module Guide §8 (Interview Module)
