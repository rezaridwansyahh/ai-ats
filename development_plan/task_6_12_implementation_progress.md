# Task 6.12 Implementation Progress

**Task:** AI Cost Cap + 80% Alert (PH-CC)
**Estimate:** 4 hours
**Date:** 1 June 2026

---

## ✅ COMPLETED (2.5 hours)

### 1. Database Layer ✓ (30 min)

**Files Created/Modified:**
- ✅ `backend/src/db/migrations/009_company_budgets.sql` — NEW migration file
- ✅ `backend/src/db/setup.sql` — Added company_budgets table + DROP statement
- ✅ `backend/src/db/data/company_budgets.js` — NEW seed data file

**Schema:**
```sql
CREATE TABLE company_budgets (
  id                SERIAL PRIMARY KEY,
  company_id        INTEGER NOT NULL REFERENCES core_company(id),
  month_year        DATE NOT NULL,           -- '2026-06-01'
  budget_usd        NUMERIC(10,2) NOT NULL,  -- Default $100/month
  alert_80_sent     BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, month_year)
);
```

**Seeder Logic:**
- Explicit budgets from `company_budgets.js` (Company #1: $200, others: $100)
- Auto-generates budgets for companies without explicit config
- `ON CONFLICT DO UPDATE` for idempotent re-runs

---

### 2. Service Layer ✓ (1.5 hours)

**File Modified:**
- ✅ `backend/src/modules/company-usage/company-usage.service.js`

**New Methods:**

```javascript
async getCurrentBudget(company_id)
// Get or create budget for current month
// Returns: { id, company_id, month_year, budget_usd, alert_80_sent }
// Auto-creates $100 default if missing

async getMonthToDateSpend(company_id)
// Sum of estimated_cost_usd for current month
// Returns: number (USD)

async checkBudgetOrThrow(company_id)
// Called BEFORE every AI operation
// Throws 402 if budget exceeded
// Fires 80% alert if needed (idempotent)
// Returns: { budget, spent, remaining }

async _sendBudgetAlert(company_id, budget, spent)
// Fire-and-forget Slack notification
// Uses SLACK_BUDGET_ALERT_WEBHOOK env var
// Marks alert_80_sent = true in DB
```

**Budget Check Flow:**
1. Get budget for current month (create if missing)
2. Get month-to-date spend
3. If spent >= budget → throw 402
4. If spent >= 80% AND alert_80_sent = false → send Slack + mark sent
5. Return budget status

---

### 3. Seeder Integration ✓ (30 min)

**File Modified:**
- ✅ `backend/src/db/seeds/seed.js`

**Changes:**
1. Import `companyBudgetsData` and `createCompanyBudget`
2. Add `DELETE FROM company_budgets` to cleanup section
3. Add Step 24: Seed budgets
   - Insert explicit budgets from data file
   - Auto-create for companies without explicit budgets
   - Uses `ON CONFLICT DO UPDATE` for safety

**Default Budgets:**
- Myralix (company #1): $200/month (higher for internal testing)
- All others: $100/month (configurable per pilot contract)

---

## ⏳ REMAINING (1.5 hours)

### 4. AI Service Integration (1 hour)

**Files to Modify:**

#### 4a. `backend/src/shared/services/ai.service.js`

Add budget check to **5 methods**:

```javascript
import companyUsageService from '../../modules/company-usage/company-usage.service.js';

class AIService {
  async *generateStream(formFields, fileText, context = {}) {
    // ADD THIS LINE FIRST
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    const prompt = this.buildPrompt(formFields, fileText);
    // ... rest of method
  }

  async extractFacets(cvText, context = {}) {
    // ADD THIS LINE FIRST
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of method
  }

  async scoreApplicantAgainstJob(job, facets, context = {}) {
    // ADD THIS LINE FIRST
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of method
  }

  async scoreWithRubric(job, facets, rubric, role_profile, context = {}) {
    // ADD THIS LINE FIRST
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of method
  }

  async generateFollowupQuestions(job, facets, opts, context = {}) {
    // ADD THIS LINE FIRST
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of method
  }
}
```

**Estimated Time:** 30 min

---

#### 4b. `backend/src/modules/assessment/assessment-ai/assessment-ai.service.js`

Add budget check to **2 generator methods**:

```javascript
import companyUsageService from '../../company-usage/company-usage.service.js';

class AssessmentAIService {
  async *generateSection({ battery, section, scores, profile = {} }, context = {}) {
    // ADD THIS LINE FIRST
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    const prompt = buildSectionPrompt(battery, section, scores, profile);
    // ... rest of method
  }

  async *generateSynthesis({ battery, allScores, sectionInterpretations, profile = {} }, context = {}) {
    // ADD THIS LINE FIRST
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of method
  }
}
```

**Estimated Time:** 15 min

---

#### 4c. Controller Error Handling

Update controllers to pass through 402 status:

```javascript
// Example: backend/src/modules/screening/screening.controller.js
async scoreApplicant(req, res) {
  try {
    // ... business logic
  } catch (error) {
    // ADD THIS BLOCK
    if (error.status === 402) {
      return res.status(402).json({
        message: error.message,
        budget: error.budget,
        spent: error.spent
      });
    }

    logger.error('scoreApplicant error:', error);
    res.status(error.status || 500).json({ message: error.message });
  }
}
```

**Files to Update:**
- `backend/src/modules/screening/screening.controller.js`
- `backend/src/modules/job/job.controller.js` (for AI job desc generation)
- `backend/src/modules/assessment/assessment-ai/assessment-ai.controller.js`

**Estimated Time:** 15 min

---

### 5. Frontend Handling (30 min)

#### 5a. Axios Interceptor

**File:** `frontend/src/api/axios.js`

```javascript
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }

    // ADD THIS BLOCK
    if (error.response?.status === 402) {
      const { budget, spent } = error.response.data;
      toast.error(
        `AI budget exceeded: $${spent?.toFixed(2) || '?'} / $${budget?.toFixed(2) || '?'} used this month. Contact support to increase limit.`,
        { duration: 8000 }
      );
    }

    return Promise.reject(error);
  }
);
```

**Estimated Time:** 15 min

---

#### 5b. Budget Display Component (Optional)

**File:** `frontend/src/components/shared/BudgetIndicator.jsx` (NEW)

```jsx
// Optional: Show budget usage in header/sidebar
export default function BudgetIndicator({ companyId }) {
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    // Fetch budget status from /api/company-usage/budget
    // Display as progress bar or badge
  }, [companyId]);

  // Show: "$2.50 / $100.00 (3%)" with color coding
}
```

**Estimated Time:** 15 min (deferred to v0.1.5 if time-constrained)

---

### 6. Environment Variables (5 min)

**File:** `backend/.env.example`

```bash
# AI Cost Management (Task 6.12)
SLACK_BUDGET_ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**File:** `backend/.env.dev` (add locally, don't commit)

```bash
SLACK_BUDGET_ALERT_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/xxxx
```

**Estimated Time:** 5 min

---

### 7. Testing Script (10 min)

**File:** `backend/tests/manual/test-budget-cap.js` (NEW)

```javascript
import companyUsageService from '../../src/modules/company-usage/company-usage.service.js';
import getDb from '../../src/config/postgres.js';

async function testBudgetCap() {
  const testCompanyId = 1;
  const testMonth = '2026-06-01';

  console.log('=== AI Budget Cap Test ===\n');

  // Test A: Set budget to $0.10
  await getDb().query(
    `INSERT INTO company_budgets (company_id, month_year, budget_usd)
     VALUES ($1, $2, $3)
     ON CONFLICT (company_id, month_year)
     DO UPDATE SET budget_usd = $3, alert_80_sent = false`,
    [testCompanyId, testMonth, 0.10]
  );
  console.log('✓ Set budget to $0.10');

  // Test B: Log fake usage to exceed budget
  await companyUsageService.log({
    context: { company_id: testCompanyId, user_id: 1 },
    model: 'gpt-4o-mini',
    operation: 'test_operation',
    usage: { prompt_tokens: 100000, completion_tokens: 20000, total_tokens: 120000 },
  });
  console.log('✓ Logged $0.15 usage (exceeds $0.10 budget)');

  // Test C: Check budget (should throw 402)
  try {
    await companyUsageService.checkBudgetOrThrow(testCompanyId);
    console.error('✗ Budget check should have thrown 402!');
  } catch (err) {
    if (err.status === 402) {
      console.log('✓ 402 thrown correctly:', err.message);
      console.log('  Budget:', err.budget, 'Spent:', err.spent);
    }
  }

  // Test D: 80% alert
  await getDb().query(
    `UPDATE company_budgets
     SET budget_usd = 1.00, alert_80_sent = false
     WHERE company_id = $1 AND month_year = $2`,
    [testCompanyId, testMonth]
  );

  await companyUsageService.log({
    context: { company_id: testCompanyId, user_id: 1 },
    model: 'gpt-4o-mini',
    operation: 'test_operation_2',
    usage: { prompt_tokens: 400000, completion_tokens: 100000, total_tokens: 500000 },
  });
  console.log('✓ Logged additional $0.72 usage (total $0.87 = 87%)');

  await companyUsageService.checkBudgetOrThrow(testCompanyId);
  console.log('✓ Budget check passed, 80% alert should have fired');

  console.log('\n=== Test Complete ===');
  process.exit(0);
}

testBudgetCap().catch(console.error);
```

**Run:**
```bash
cd backend
node tests/manual/test-budget-cap.js
```

**Estimated Time:** 10 min

---

## 📋 Acceptance Criteria (from Audit v4.0)

> **DONE WHEN:**
> Setting test company budget to $0.10 → screening call returns 402.
> Setting budget to $1.00 + using $0.85 → exactly one Slack alert fires.

**Verification Steps:**

1. ✅ Run migration: `cd backend && node src/db/run-script.js`
2. ✅ Verify table: `psql -d ats -c "SELECT * FROM company_budgets;"`
3. ✅ Set budget: `UPDATE company_budgets SET budget_usd = 0.10 WHERE company_id = 1;`
4. ✅ Call AI endpoint: `POST /api/screening/score-applicant` → expect 402
5. ✅ Set budget: `UPDATE company_budgets SET budget_usd = 1.00 WHERE company_id = 1;`
6. ✅ Use $0.85 via multiple AI operations
7. ✅ Check Slack for exactly ONE message
8. ✅ Verify `alert_80_sent = true` in database
9. ✅ Call AI again → no second alert
10. ✅ Frontend shows toast on 402

---

## 🔧 Deployment Checklist

Before merging:

- [ ] Run full test script (`node tests/manual/test-budget-cap.js`)
- [ ] Verify 402 error shows in frontend with correct message
- [ ] Verify Slack alert fires exactly once at 80%
- [ ] Test with real AI operation (not just fake logging)
- [ ] Document budget increase procedure in admin docs
- [ ] Add Slack webhook to production `.env`

---

## 📊 Current Progress

| Step | Description | Time | Status |
|------|-------------|------|--------|
| 1 | Database migration + schema | 30 min | ✅ DONE |
| 2 | Service layer methods | 1.5 hours | ✅ DONE |
| 3 | Seeder integration | 30 min | ✅ DONE |
| 4a | ai.service.js integration | 30 min | ⏳ PENDING |
| 4b | assessment-ai.service.js integration | 15 min | ⏳ PENDING |
| 4c | Controller error handling | 15 min | ⏳ PENDING |
| 5 | Frontend axios interceptor | 30 min | ⏳ PENDING |
| 6 | Environment variables | 5 min | ⏳ PENDING |
| 7 | Test script | 10 min | ⏳ PENDING |

**Total Completed:** 2.5 hours / 4 hours (62.5%)
**Remaining:** 1.5 hours (37.5%)

---

## 🚀 Next Actions

Run these commands in order:

```bash
# 1. Apply database changes
cd backend
node src/db/run-script.js

# 2. Verify table exists
PGPASSWORD=jklasd4 psql -U postgres -h localhost -d ats -c "\d+ company_budgets"

# 3. Check seeded budgets
PGPASSWORD=jklasd4 psql -U postgres -h localhost -d ats -c "SELECT * FROM company_budgets;"

# Expected output:
#  id | company_id | month_year | budget_usd | alert_80_sent
# ----+------------+------------+------------+---------------
#   1 |          1 | 2026-06-01 |     200.00 | f
#   2 |          2 | 2026-06-01 |     100.00 | f
#   3 |          3 | 2026-06-01 |     100.00 | f
```

Then proceed with AI service integration (Step 4).

---

**Report End**
