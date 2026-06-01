# AI Cost Cap & Alert System — Task 6.12 Analysis

**Generated:** 1 June 2026
**Task Reference:** Audit v4.0 § 6 Day 4 (Thursday) — Task 6.12
**Owner:** BE Engineer
**Estimate:** 4 hours
**Status:** ❌ NOT STARTED
**Risk:** R-5 (AI cost runaway)

---

## 📊 Executive Summary

**Current State:** AI usage is **logged but NOT capped**. A pilot company with 1000+ candidates could burn **$200-500 in minutes** with no automatic prevention.

**Required by:** Thursday 4 Jun EOD (per audit week 8 plan)

**Components Needed:**
1. ✅ Usage logging — **ALREADY IMPLEMENTED**
2. ❌ Budget table — **MISSING**
3. ❌ Budget check gate — **MISSING**
4. ❌ 80% alert — **MISSING**
5. ❌ 402 graceful degradation — **MISSING**

---

## ✅ What's Already Built (Current State)

### 1. Usage Logging Infrastructure ✓

**Table:** `company_usage` (already exists)

```sql
-- VERIFIED: Table exists with correct schema
CREATE TABLE company_usage (
  id                 SERIAL PRIMARY KEY,
  company_id         INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  user_id            INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  service            VARCHAR(50) NOT NULL DEFAULT 'openai',
  model              VARCHAR(100) NOT NULL,          -- 'gpt-4o-mini', 'gpt-4o'
  operation          VARCHAR(100) NOT NULL,          -- 'extract_facets', 'score_applicant', etc.
  prompt_tokens      INTEGER NOT NULL DEFAULT 0,
  completion_tokens  INTEGER NOT NULL DEFAULT 0,
  total_tokens       INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10,6),                  -- Calculated cost
  request_id         VARCHAR(255),                    -- OpenAI request ID
  metadata           JSONB,                           -- Extra context
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_company_usage_company_created ON company_usage(company_id, created_at DESC);
CREATE INDEX idx_company_usage_operation ON company_usage(operation);
```

**Service:** `company-usage.service.js` ✓

```javascript
// VERIFIED: Working implementation
class CompanyUsageService {
  async log({ context, model, operation, usage, request_id, metadata }) {
    // Fire-and-forget logging
    const estimated_cost_usd = estimateCostUsd(model, usage.prompt_tokens, usage.completion_tokens);
    await CompanyUsageModel.insert({
      company_id: context.company_id,
      user_id: context.user_id,
      service: 'openai',
      model,
      operation,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost_usd,
      request_id,
      metadata
    });
  }

  async summary(company_id, opts) {
    // Aggregates usage by operation and model
    return CompanyUsageModel.summaryByCompany(company_id, opts);
  }
}
```

**Pricing:** OpenAI gpt-4o-mini (accurate as of 2026)

```javascript
// VERIFIED: Current pricing in company-usage.service.js
const PRICING_USD_PER_M = {
  'gpt-4o-mini':  { input: 0.15,  output: 0.60 },   // Default model
  'gpt-4o':       { input: 2.50,  output: 10.00 },
  'gpt-4.1-mini': { input: 0.40,  output: 1.60 },
};

function estimateCostUsd(model, prompt_tokens = 0, completion_tokens = 0) {
  const p = PRICING_USD_PER_M[model];
  if (!p) return null;
  const cost = (prompt_tokens * p.input + completion_tokens * p.output) / 1_000_000;
  return Number(cost.toFixed(6));  // 6 decimal precision
}
```

### 2. AI Service Integration ✓

**All AI operations already log usage:**

| Service File | Operations Logged | Current Status |
|-------------|-------------------|----------------|
| `ai.service.js` | `generate_job_desc`<br>`extract_facets`<br>`score_applicant`<br>`score_with_rubric`<br>`generate_followup_qa` | ✅ Logged, ❌ Not gated |
| `assessment-ai.service.js` | `assessment_interp_A_tk`<br>`assessment_interp_A_bigfive`<br>`assessment_interp_A_disc`<br>`assessment_interp_A_holland`<br>`assessment_synthesis_A`<br>(+ similar for B/C/D batteries) | ✅ Logged, ❌ Not gated |

**Example call pattern:**
```javascript
// ai.service.js:81-88
await this._logUsage({
  context,                // { company_id, user_id }
  model: STREAM_MODEL,    // 'gpt-4o-mini'
  operation: 'generate_job_desc',
  usage,                  // { prompt_tokens, completion_tokens, total_tokens }
  request_id,
  metadata: { job_title: formFields?.job_title || null },
});
```

---

## ❌ What's Missing (Implementation Needed)

### 1. Budget Table ❌

**Required table:** `company_budgets`

```sql
-- NEW TABLE NEEDED
CREATE TABLE company_budgets (
  id                SERIAL PRIMARY KEY,
  company_id        INTEGER NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
  month_year        DATE NOT NULL,                -- '2026-06-01' for June 2026
  budget_usd        NUMERIC(10,2) NOT NULL,       -- Monthly cap (e.g., 100.00)
  alert_80_sent     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(company_id, month_year)
);

CREATE INDEX idx_company_budgets_company_month ON company_budgets(company_id, month_year DESC);

-- Seed default budgets (example: $100/month for all companies)
INSERT INTO company_budgets (company_id, month_year, budget_usd)
SELECT id, date_trunc('month', CURRENT_DATE), 100.00
FROM core_company
ON CONFLICT (company_id, month_year) DO NOTHING;
```

**Rationale:**
- Per-company, per-month granularity
- `month_year` uses first day of month for clean date_trunc matching
- `alert_80_sent` prevents duplicate Slack alerts
- Default $100/month budget is placeholder (should be configurable per pilot contract)

---

### 2. Budget Check Service ❌

**New methods in `company-usage.service.js`:**

```javascript
class CompanyUsageService {
  // NEW: Get or create budget for current month
  async getCurrentBudget(company_id) {
    const thisMonth = new Date();
    thisMonth.setDate(1);  // First day of month
    thisMonth.setHours(0, 0, 0, 0);

    const result = await getDb().query(
      `SELECT * FROM company_budgets
       WHERE company_id = $1 AND month_year = $2`,
      [company_id, thisMonth.toISOString().split('T')[0]]
    );

    if (result.rows.length === 0) {
      // Create default budget if none exists
      const insert = await getDb().query(
        `INSERT INTO company_budgets (company_id, month_year, budget_usd)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [company_id, thisMonth.toISOString().split('T')[0], 100.00]
      );
      return insert.rows[0];
    }

    return result.rows[0];
  }

  // NEW: Get month-to-date spend
  async getMonthToDateSpend(company_id) {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const result = await getDb().query(
      `SELECT COALESCE(SUM(estimated_cost_usd), 0) as total_usd
       FROM company_usage
       WHERE company_id = $1
         AND created_at >= $2`,
      [company_id, thisMonth.toISOString()]
    );

    return Number(result.rows[0].total_usd);
  }

  // NEW: Check budget before AI call
  async checkBudgetOrThrow(company_id) {
    if (!company_id) {
      throw new Error('company_id required for budget check');
    }

    const budget = await this.getCurrentBudget(company_id);
    const spent = await this.getMonthToDateSpend(company_id);
    const remaining = budget.budget_usd - spent;

    if (remaining <= 0) {
      const err = new Error('AI budget exceeded for this month');
      err.status = 402;  // Payment Required
      err.budget = budget.budget_usd;
      err.spent = spent;
      throw err;
    }

    // Check 80% threshold for alert
    const percentUsed = (spent / budget.budget_usd) * 100;
    if (percentUsed >= 80 && !budget.alert_80_sent) {
      // Fire async alert (non-blocking)
      this._sendBudgetAlert(company_id, budget, spent).catch(err => {
        logger.error('Budget alert failed:', err);
      });

      // Mark alert as sent
      await getDb().query(
        `UPDATE company_budgets
         SET alert_80_sent = true, updated_at = now()
         WHERE id = $1`,
        [budget.id]
      );
    }

    return { budget: budget.budget_usd, spent, remaining };
  }

  // NEW: Send Slack alert (fire-and-forget)
  async _sendBudgetAlert(company_id, budget, spent) {
    const percentUsed = Math.round((spent / budget.budget_usd) * 100);

    // Get company name
    const companyResult = await getDb().query(
      'SELECT name FROM core_company WHERE id = $1',
      [company_id]
    );
    const companyName = companyResult.rows[0]?.name || `Company #${company_id}`;

    const slackWebhook = process.env.SLACK_BUDGET_ALERT_WEBHOOK;
    if (!slackWebhook) {
      logger.warn('SLACK_BUDGET_ALERT_WEBHOOK not configured');
      return;
    }

    const message = {
      text: `🚨 AI Budget Alert: ${companyName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*AI Budget Alert*\n*Company:* ${companyName}\n*Used:* $${spent.toFixed(2)} / $${budget.budget_usd.toFixed(2)} (${percentUsed}%)\n*Month:* ${budget.month_year}`
          }
        }
      ]
    };

    // Use fetch (or axios) to send webhook
    const response = await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }

    logger.info(`Budget alert sent for company ${company_id}`);
  }
}
```

---

### 3. Gate Integration in AI Services ❌

**Update `ai.service.js`:**

```javascript
import companyUsageService from '../../modules/company-usage/company-usage.service.js';

class AIService {
  async *generateStream(formFields, fileText, context = {}) {
    // NEW: Check budget BEFORE calling OpenAI
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    const prompt = this.buildPrompt(formFields, fileText);
    const stream = await openai.chat.completions.create({
      model: STREAM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
    });

    // ... rest of implementation
  }

  async extractFacets(cvText, context = {}) {
    // NEW: Check budget BEFORE calling OpenAI
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of implementation
  }

  async scoreApplicantAgainstJob(job, facets, context = {}) {
    // NEW: Check budget BEFORE calling OpenAI
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of implementation
  }

  async scoreWithRubric(job, facets, rubric, role_profile, context = {}) {
    // NEW: Check budget BEFORE calling OpenAI
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of implementation
  }

  async generateFollowupQuestions(job, facets, opts, context = {}) {
    // NEW: Check budget BEFORE calling OpenAI
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of implementation
  }
}
```

**Update `assessment-ai.service.js`:**

```javascript
class AssessmentAIService {
  async *generateSection({ battery, section, scores, profile = {} }, context = {}) {
    // NEW: Check budget BEFORE calling OpenAI
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    const prompt = buildSectionPrompt(battery, section, scores, profile);
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0.6,
    });

    // ... rest of implementation
  }

  async *generateSynthesis({ battery, allScores, sectionInterpretations, profile = {} }, context = {}) {
    // NEW: Check budget BEFORE calling OpenAI
    await companyUsageService.checkBudgetOrThrow(context.company_id);

    // ... rest of implementation
  }
}
```

---

### 4. Frontend Error Handling ❌

**Update Axios interceptor in `frontend/src/api/axios.js`:**

```javascript
// NEW: Handle 402 Payment Required
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }

    // NEW: Handle budget exceeded
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

**Update controller error handling:**

```javascript
// Example: screening.controller.js
async scoreApplicant(req, res) {
  try {
    // ... business logic
  } catch (error) {
    // NEW: Pass through 402 status
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

---

## 📋 Implementation Checklist (4 hours)

### Step 1: Database (30 min)

- [ ] Create migration file `backend/src/db/migrations/009_company_budgets.sql`
- [ ] Add `company_budgets` table with indexes
- [ ] Seed default $100 budget for all existing companies
- [ ] Run migration: `cd backend && node src/db/run-script.js`
- [ ] Verify: `psql -d ats -c "SELECT * FROM company_budgets;"`

### Step 2: Service Layer (1.5 hours)

- [ ] Add `getCurrentBudget()` to `company-usage.service.js`
- [ ] Add `getMonthToDateSpend()` to `company-usage.service.js`
- [ ] Add `checkBudgetOrThrow()` to `company-usage.service.js`
- [ ] Add `_sendBudgetAlert()` to `company-usage.service.js`
- [ ] Add `SLACK_BUDGET_ALERT_WEBHOOK` to `.env.example`
- [ ] Test: Create company with $0.10 budget, verify 402 thrown

### Step 3: AI Service Integration (1 hour)

- [ ] Add budget check to `ai.service.js` (5 methods)
- [ ] Add budget check to `assessment-ai.service.js` (2 methods)
- [ ] Verify all checks receive `context.company_id` properly
- [ ] Test: Trigger AI scoring with budget exceeded

### Step 4: Frontend & Error Handling (45 min)

- [ ] Update axios 402 interceptor in `frontend/src/api/axios.js`
- [ ] Update controller error handling to pass 402 status
- [ ] Test: UI shows budget error toast with correct amounts
- [ ] Document admin workflow for increasing budgets

### Step 5: Testing & Verification (15 min)

- [ ] **Test A:** Set company budget to $0.10 → screening returns 402 ✓
- [ ] **Test B:** Set budget to $1.00, spend $0.85 → Slack alert fires exactly once ✓
- [ ] **Test C:** Spend $1.05 → 402 error, no AI call made ✓
- [ ] **Test D:** Next month (Jul 1) → `alert_80_sent` reset, budget resets ✓

---

## 🚨 Risk Analysis (R-5 from Audit)

### Current Risk Without Task 6.12

**Scenario:** Pilot company bulk re-scores 1000 candidates

```
Operation: score_applicant (AI Screening)
Model: gpt-4o-mini
Avg tokens per score: 2,500 input + 500 output = 3,000 total
Cost per score: (2500 × 0.15 + 500 × 0.60) / 1M = $0.000675

1000 candidates × $0.000675 = $0.675
```

**Low risk operation.** But consider:

**High-risk scenario:** 100 candidates × 4 batteries (A/B/C/D) × 8 sections each

```
Operation: assessment_interp (Psych Assessment)
Model: gpt-4o-mini
Avg tokens per section: 5,000 input + 1,200 output = 6,200 total
Cost per section: (5000 × 0.15 + 1200 × 0.60) / 1M = $0.00147

100 candidates × 4 batteries × 8 sections × $0.00147 = $47.04
Plus synthesis: 100 × 4 × $0.003 = $1.20

Total: $48.24 for one batch
```

**If company re-generates reports multiple times (testing, errors, UI polish):**
- 5 regenerations = **$241.20**
- 10 regenerations = **$482.40**

**Without cap:** No automatic stop. Team discovers cost at month-end via AWS bill.

**With cap ($100/month):**
- First 2 full batches run normally ($96.48)
- 3rd batch hits 80% alert → Slack notification
- Partial 3rd batch hits $100 → 402 error, graceful degradation
- Prevents runaway to $482

### Risk Mitigation Timeline

| Status | Risk Level | Mitigation |
|--------|-----------|------------|
| **Current (1 Jun)** | 🔴 **HIGH** | Manual monitoring only (`SELECT SUM(estimated_cost_usd) FROM company_usage`) |
| **After Task 6.12 (4 Jun EOD)** | 🟢 **LOW** | Automatic cap + proactive 80% alert + graceful 402 |

---

## 💰 Cost Estimates (Real Pilot Usage)

### Typical Pilot Company (20 jobs, 500 candidates over 3 months)

| Operation | Volume | Unit Cost | Total |
|-----------|--------|-----------|-------|
| **Job desc generation** | 20 jobs | $0.008 | $0.16 |
| **CV parsing** | 500 CVs | $0.0005 | $0.25 |
| **AI scoring** | 500 scores | $0.00067 | $0.34 |
| **Follow-up Q&A** | 50 borderline | $0.0012 | $0.06 |
| **Psych assessments** | 30 candidates × 4 batteries × 9 sections | $0.00147 | $1.59 |
| **Interview prep briefs** | 20 interviews × 3 rounds | $0.0025 | $0.15 |

**Estimated monthly spend:** ~$2.55/month for normal usage

**Recommended budget:** $50/month (20× cushion) or $100/month for large pilots

---

## 🔧 Environment Variables

**Add to `backend/.env`:**

```bash
# AI Cost Management
SLACK_BUDGET_ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Add to `backend/.env.example`:**

```bash
# AI Cost Management (optional — only if you want Slack alerts at 80%)
SLACK_BUDGET_ALERT_WEBHOOK=
```

---

## 📊 Monitoring & Admin

### Check Company Usage (Manual Query)

```sql
-- Month-to-date spend for company #1
SELECT
  company_id,
  COUNT(*) as api_calls,
  SUM(prompt_tokens) as total_input_tokens,
  SUM(completion_tokens) as total_output_tokens,
  SUM(estimated_cost_usd) as total_usd
FROM company_usage
WHERE company_id = 1
  AND created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY company_id;
```

### Adjust Budget (Manual Operation)

```sql
-- Increase company #1 budget to $200 for June 2026
INSERT INTO company_budgets (company_id, month_year, budget_usd)
VALUES (1, '2026-06-01', 200.00)
ON CONFLICT (company_id, month_year)
DO UPDATE SET budget_usd = 200.00, updated_at = now();
```

### Reset 80% Alert Flag (if alert needs to re-fire)

```sql
UPDATE company_budgets
SET alert_80_sent = false, updated_at = now()
WHERE company_id = 1 AND month_year = '2026-06-01';
```

---

## 🧪 Testing Script

**File:** `backend/tests/manual/test-budget-cap.js`

```javascript
import companyUsageService from '../../src/modules/company-usage/company-usage.service.js';
import getDb from '../../src/config/postgres.js';

async function testBudgetCap() {
  const testCompanyId = 1;
  const testMonth = '2026-06-01';

  console.log('=== AI Budget Cap Test ===\n');

  // Step 1: Set low budget
  await getDb().query(
    `INSERT INTO company_budgets (company_id, month_year, budget_usd)
     VALUES ($1, $2, $3)
     ON CONFLICT (company_id, month_year)
     DO UPDATE SET budget_usd = $3, alert_80_sent = false`,
    [testCompanyId, testMonth, 0.10]
  );
  console.log('✓ Set budget to $0.10');

  // Step 2: Check budget (should pass)
  try {
    const check1 = await companyUsageService.checkBudgetOrThrow(testCompanyId);
    console.log('✓ Budget check passed:', check1);
  } catch (err) {
    console.error('✗ Unexpected 402:', err.message);
  }

  // Step 3: Log fake usage to exceed budget
  await companyUsageService.log({
    context: { company_id: testCompanyId, user_id: 1 },
    model: 'gpt-4o-mini',
    operation: 'test_operation',
    usage: { prompt_tokens: 100000, completion_tokens: 20000, total_tokens: 120000 },
    request_id: 'test-req-001',
  });
  console.log('✓ Logged $0.15 usage (exceeds $0.10 budget)');

  // Step 4: Check budget again (should throw 402)
  try {
    await companyUsageService.checkBudgetOrThrow(testCompanyId);
    console.error('✗ Budget check should have thrown 402!');
  } catch (err) {
    if (err.status === 402) {
      console.log('✓ 402 thrown correctly:', err.message);
      console.log('  Budget:', err.budget, 'Spent:', err.spent);
    } else {
      console.error('✗ Wrong error:', err);
    }
  }

  // Step 5: Test 80% alert
  await getDb().query(
    `UPDATE company_budgets
     SET budget_usd = 1.00, alert_80_sent = false
     WHERE company_id = $1 AND month_year = $2`,
    [testCompanyId, testMonth]
  );
  console.log('\n✓ Set budget to $1.00 (current spend $0.15 = 15%)');

  await companyUsageService.log({
    context: { company_id: testCompanyId, user_id: 1 },
    model: 'gpt-4o-mini',
    operation: 'test_operation_2',
    usage: { prompt_tokens: 400000, completion_tokens: 100000, total_tokens: 500000 },
    request_id: 'test-req-002',
  });
  console.log('✓ Logged additional $0.72 usage (total $0.87 = 87%)');

  // This should trigger 80% alert
  try {
    await companyUsageService.checkBudgetOrThrow(testCompanyId);
    console.log('✓ Budget check passed, but 80% alert should have fired');
  } catch (err) {
    console.error('✗ Unexpected error:', err);
  }

  // Verify alert flag set
  const flagCheck = await getDb().query(
    'SELECT alert_80_sent FROM company_budgets WHERE company_id = $1 AND month_year = $2',
    [testCompanyId, testMonth]
  );
  if (flagCheck.rows[0]?.alert_80_sent) {
    console.log('✓ alert_80_sent flag is true');
  } else {
    console.error('✗ alert_80_sent flag should be true');
  }

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

---

## 📝 Audit Task Acceptance Criteria

From **Audit v4.0 § 6 Day 4 Task 6.12:**

> **DONE WHEN:**
> Setting test company budget to $0.10 → screening call returns 402.
> Setting budget to $1.00 + using $0.85 → exactly one Slack alert fires.

**Verification Steps:**

1. ✅ Create `company_budgets` table
2. ✅ Set company #1 budget to $0.10
3. ✅ Call `POST /api/screening/score-applicant` → expect 402 response
4. ✅ Check response body contains `{ budget: 0.10, spent: 0.XX }`
5. ✅ Set company #1 budget to $1.00
6. ✅ Use $0.85 via multiple AI operations
7. ✅ Verify exactly ONE Slack message received
8. ✅ Verify `alert_80_sent = true` in database
9. ✅ Call AI operation again → alert does NOT fire second time
10. ✅ Frontend shows graceful toast on 402 error

---

## 🎯 Bottom Line

| Component | Status | Effort | Blocking |
|-----------|--------|--------|----------|
| Database schema | ❌ Not started | 30 min | No |
| Service methods | ❌ Not started | 1.5 hours | Yes (core logic) |
| AI service integration | ❌ Not started | 1 hour | Yes (protection) |
| Frontend handling | ❌ Not started | 45 min | No (graceful degrade) |
| Testing | ❌ Not started | 15 min | Yes (acceptance) |

**Total:** 4 hours (matches audit estimate)

**Current Risk:** 🔴 **HIGH** — No protection against runaway costs
**After implementation:** 🟢 **LOW** — Automatic cap + proactive alerts

**Recommended Priority:** ⚡ **CRITICAL** — Should complete Thursday 4 Jun per audit plan, but even if Interview tasks slip, this should NOT slip (protects pilot companies from financial risk).

---

**Report End**
