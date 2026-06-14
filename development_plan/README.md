# 📁 Development Plan — Interview Module

**Created:** 14 June 2026
**Target:** Complete Interview Module (60% → 100%) by 21 June 2026
**Effort:** ~6.5 dev-days (1 week with 2 engineers parallel)

---

## 📄 Documents in This Folder

### **1. INTERVIEW_MODULE_FLOW.md** 📋
**Purpose:** Complete workflow documentation

**Contains:**
- 🔄 Full interview workflow (3 rounds × 5 stages)
- 📊 Stage-by-stage breakdown with business logic
- 🏗️ State machine diagram (prep → scheduled → in_progress → done → decided)
- 👥 Multi-panelist logic for R3 Panel Interview
- 🔐 Scorecard locking compliance rules
- 📈 Round transition rules (R1→R2→R3→Assessment)
- 🗄️ Database schema for 5 tables
- 🎨 UI navigation (4-level workspace)
- ✅ Acceptance criteria for 100% complete

**Who Should Read:**
- Product Manager (understand business flow)
- QA (understand test scenarios)
- Frontend Engineers (understand UI requirements)
- Backend Engineers (understand state machine)
- Leadership (understand scope)

---

### **2. INTERVIEW_MODULE_TODO.md** ✅
**Purpose:** Functional task list (no technical code, just what needs to be built)

**Contains:**
- 📊 Progress overview (18/31 tasks complete)
- ✅ List of completed tasks (what's already done)
- 🔴 Critical priority tasks (Mon-Wed)
- 🟡 High priority tasks (Thu-Fri)
- 🟢 Nice-to-have tasks (optional)
- 📋 Task dependencies (what blocks what)
- 🎯 Definition of Done per task
- 📅 Daily checklist (Mon→Fri)
- 🚨 Risk mitigation if behind schedule

**Who Should Read:**
- Engineering Team (daily work plan)
- Scrum Master / PM (track progress)
- CTO (understand what's left)

---

## 🎯 Quick Start

### **For Engineers Starting Work:**
1. Read `INTERVIEW_MODULE_FLOW.md` first (understand the big picture)
2. Then read `INTERVIEW_MODULE_TODO.md` (know what to build)
3. Check current status in TODO.md (18/31 tasks done)
4. Pick next task from Critical Priority section
5. Mark task as complete when done

### **For Product/QA:**
1. Read `INTERVIEW_MODULE_FLOW.md` (understand user journey)
2. Use State Machine section for test scenarios
3. Use Acceptance Criteria section for QA checklist

### **For Leadership:**
1. Check Progress Overview in TODO.md (60% complete)
2. Read Risk Mitigation section (Wed checkpoint, Fri fallback)
3. Review Daily Checklist to track daily progress

---

## 📊 Current Status (14 June 2026)

```
Overall: 60% Complete (18/31 tasks)

✅ Done:
  - L1 Workboard (100%)
  - L2 Position (100%)
  - Prep Tab (100%)
  - Schedule Tab (100%)
  - 2/5 database tables
  - 15/23 backend endpoints

⚠️ Partial:
  - Conduct Tab (exists but needs completion)

❌ Missing:
  - Evaluate Tab (entire scorecard form)
  - Decide Tab (entire verdict UI)
  - L4 Calibration (entire page)
  - 3 database tables (round, panelist, scorecard)
  - State machine validation
```

---

## 🗓️ Weekly Plan (15-21 June)

| Day | Focus | Deliverable |
|-----|-------|-------------|
| **Mon 15** | Database | 3 missing tables created + seeded |
| **Tue 16** | Conduct Tab | Notes capture + auto-save + mark complete |
| **Wed 17** | Evaluate Tab | Scorecard form + lock working **🚨 GO/NO-GO** |
| **Thu 18 AM** | Decide Tab | Summary + PASS/FAIL buttons |
| **Thu 18 PM** | L4 Calibration | Bulk advance working |
| **Fri 19** | Testing | State machine + end-to-end test passing |

---

## 🚨 Critical Checkpoints

### **Wednesday 19 June 17:00 — GO/NO-GO Decision**
**Check:** Is Evaluate tab (scorecard lock) working?
- ✅ **GO:** Continue with Decide + L4 Calibration
- ❌ **NO-GO:** Escalate to leadership for scope reduction

### **Friday 21 June 17:00 — Final Checkpoint**
**Check:** Can we complete R1→R2→R3→Assessment end-to-end?
- ✅ **YES:** Mark Interview module 100% complete
- ❌ **NO:** Ship partial (50% MVP: L1+L2+Prep+Schedule+Conduct only)

---

## 📞 Escalation Path

**If behind schedule:**
1. **Engineer** → raises in daily standup
2. **Scrum Master** → documents blocker
3. **Engineering Lead** → decides: add resource / reduce scope / slip date
4. **CTO** → approves scope reduction if needed
5. **PM** → communicates to stakeholders

**Scope reduction options:**
- **Option 1:** Skip L4 Calibration (saves 2 days)
- **Option 2:** Simplify Evaluate tab (saves 4 hours)
- **Option 3:** Ship 50% MVP (defer Evaluate+Decide+L4 to v0.1.5)

---

## 📈 Success Metrics

**Definition of 100% Complete:**
- [ ] All 31 tasks in TODO.md checked ✅
- [ ] Can complete R1→R2→R3→Assessment end-to-end
- [ ] State machine rejects invalid transitions
- [ ] Scorecard lock enforced (cannot edit after locked_at)
- [ ] Bulk advance works for 5 candidates
- [ ] No 500 errors in logs
- [ ] Tenant isolation working (Company A ≠ Company B)

**Friday 21 June EOD Target:** Interview module 100% ✅

---

## 🔗 Related Documents

- **Module Guide §8** — Original spec (PDF in audit_report/)
- **v4.0 Audit (31 May)** — Why Interview was 5% (now 60%)
- **v5.0 Audit (14 June)** — Current status snapshot
- **CLAUDE.md** — Project conventions and architecture

---

**Questions?** Ask in #engineering Slack channel or weekly standup.

**Updates:** This folder will be updated daily as tasks complete.

**Version:** 1.0 (14 June 2026)
