# Plan: AI Cost Cap & Alert System

**Task**: 6.12 dari audit — dijadwalkan **Thu, 4 Jun** (4 jam BE Eng)
**Risk yang dimitigasi**: R-5 (AI cost runaway — pilot bisa burn $200-500 tanpa sadar)

---

## **Phase 1: Database Schema** (30 min)

### 1.1 Create `company_budgets` table

**File**: `backend/src/db/migrations/006_company_budgets.sql`

```sql
-- Company AI budget tracking
CREATE TABLE company_budgets (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- format: '2026-06'
  monthly_cap_usd DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  current_usage_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  alert_80_sent BOOLEAN NOT NULL DEFAULT FALSE,
  alert_100_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(company_id, month_year)
);

CREATE INDEX idx_company_budgets_company_month ON company_budgets(company_id, month_year);

COMMENT ON TABLE company_budgets IS 'Monthly AI usage budget caps per company';
COMMENT ON COLUMN company_budgets.alert_80_sent IS 'Idempotent flag - only one 80% alert per month';
```

### 1.2 Seed initial budgets for existing companies

**File**: `backend/src/db/data/company-budgets.js`

```javascript
export const companyBudgets = [
  {
    company_id: 1, // Myralix
    month_year: '2026-06',
    monthly_cap_usd: 500.00,
    current_usage_usd: 0.00
  },
  {
    company_id: 2, // Innovate Solutions
    month_year: '2026-06',
    monthly_cap_usd: 200.00,
    current_usage_usd: 0.00
  }
];
```

---

## **Phase 2: Budget Service** (90 min)

### 2.1 Create `company-usage.service.js`

**File**: `backend/src/modules/company/company-usage.service.js`

```javascript
import { getDb } from '../../config/database.js';

/**
 * Get current month budget for company
 * Creates new budget row if not exists
 */
async function getCurrentBudget(company_id) {
  const db = getDb();
  const month_year = new Date().toISOString().slice(0, 7); // '2026-06'

  // Get or create
  let result = await db.query(
    `SELECT * FROM company_budgets WHERE company_id = $1 AND month_year = $2`,
    [company_id, month_year]
  );

  if (result.rows.length === 0) {
    // Create with default $100 cap
    result = await db.query(
      `INSERT INTO company_budgets (company_id, month_year, monthly_cap_usd, current_usage_usd)
       VALUES ($1, $2, 100.00, 0.00)
       RETURNING *`,
      [company_id, month_year]
    );
  }

  return result.rows[0];
}

/**
 * Check budget before AI call
 * Throws 402 Payment Required if over budget
 * Fires 80% alert if threshold crossed
 */
async function checkBudgetOrThrow(company_id) {
  const budget = await getCurrentBudget(company_id);

  // Hard cap check
  if (budget.current_usage_usd >= budget.monthly_cap_usd) {
    throw {
      status: 402,
      message: `AI budget exhausted for this month. Used $${budget.current_usage_usd.toFixed(2)} of $${budget.monthly_cap_usd.toFixed(2)} cap.`
    };
  }

  // Soft warning at 80%
  const usage_pct = (budget.current_usage_usd / budget.monthly_cap_usd) * 100;
  if (usage_pct >= 80 && !budget.alert_80_sent) {
    // Fire alert asynchronously (don't block the request)
    await fire80PercentAlert(company_id, budget);
  }

  return budget;
}

/**
 * Record AI usage after successful call
 */
async function recordUsage(company_id, cost_usd, metadata = {}) {
  const db = getDb();
  const month_year = new Date().toISOString().slice(0, 7);

  // Atomic increment
  await db.query(
    `UPDATE company_budgets
     SET current_usage_usd = current_usage_usd + $1,
         updated_at = NOW()
     WHERE company_id = $2 AND month_year = $3`,
    [cost_usd, company_id, month_year]
  );

  // Also log to company_usage table (existing AI tracking)
  await db.query(
    `INSERT INTO company_usage (company_id, feature, cost_usd, metadata, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [company_id, metadata.feature || 'ai_unknown', cost_usd, JSON.stringify(metadata)]
  );
}

/**
 * Fire 80% alert to Slack (idempotent)
 */
async function fire80PercentAlert(company_id, budget) {
  const db = getDb();

  // Mark alert as sent (idempotent)
  await db.query(
    `UPDATE company_budgets
     SET alert_80_sent = TRUE, updated_at = NOW()
     WHERE company_id = $1 AND month_year = $2 AND alert_80_sent = FALSE`,
    [company_id, budget.month_year]
  );

  // Queue Slack webhook (fire-and-forget via Bull)
  const { addAlertJob } = await import('../shared/queues/alert.queue.js');
  await addAlertJob({
    type: 'ai_budget_warning',
    company_id,
    month_year: budget.month_year,
    usage_usd: budget.current_usage_usd,
    cap_usd: budget.monthly_cap_usd,
    usage_pct: ((budget.current_usage_usd / budget.monthly_cap_usd) * 100).toFixed(1)
  });
}

export default {
  getCurrentBudget,
  checkBudgetOrThrow,
  recordUsage,
  fire80PercentAlert
};
```

---

## **Phase 3: Integration dengan AI Services** (60 min)

### 3.1 Update `ai.service.js` (Job Description generation)

**File**: `backend/src/shared/services/ai.service.js`

```javascript
import companyUsageService from '../../modules/company/company-usage.service.js';

async function generateJobDescription(company_id, prompt, res) {
  // ✅ BUDGET CHECK FIRST
  await companyUsageService.checkBudgetOrThrow(company_id);

  const startTime = Date.now();

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      stream: true
    });

    let fullText = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullText += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    // ✅ RECORD USAGE AFTER SUCCESS
    const tokens = estimateTokens(fullText);
    const cost_usd = calculateCost(tokens, 'gpt-4o-mini');
    await companyUsageService.recordUsage(company_id, cost_usd, {
      feature: 'job_description_generation',
      model: 'gpt-4o-mini',
      tokens,
      duration_ms: Date.now() - startTime
    });

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    if (error.status === 402) {
      // Budget exhausted - return graceful error
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      throw error;
    }
  }
}

// Helper: estimate tokens (rough)
function estimateTokens(text) {
  return Math.ceil(text.length / 4); // GPT rule of thumb: 1 token ≈ 4 chars
}

// Helper: calculate cost
function calculateCost(tokens, model) {
  const pricing = {
    'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 } // per token
  };
  // Simplified: assume 50/50 input/output split
  return tokens * ((pricing[model].input + pricing[model].output) / 2);
}
```

### 3.2 Update `assessment-ai.service.js` (Psych AI)

**File**: `backend/src/modules/assessment/assessment-ai.service.js`

```javascript
import companyUsageService from '../company/company-usage.service.js';

async function generatePsychReport(company_id, session_id, res) {
  // ✅ BUDGET CHECK FIRST
  await companyUsageService.checkBudgetOrThrow(company_id);

  // ... existing OpenAI streaming logic ...

  // ✅ RECORD USAGE AFTER SUCCESS
  const tokens = estimateTokens(fullReport);
  const cost_usd = calculateCost(tokens, 'gpt-4o-mini');
  await companyUsageService.recordUsage(company_id, cost_usd, {
    feature: 'psych_assessment_report',
    model: 'gpt-4o-mini',
    session_id,
    tokens
  });
}
```

---

## **Phase 4: Bull Queue untuk Slack Alerts** (60 min)

### 4.1 Create alert queue

**File**: `backend/src/shared/queues/alert.queue.js`

```javascript
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

// Queue for fire-and-forget alerts
export const alertQueue = new Queue('alerts', { connection });

export async function addAlertJob(data) {
  await alertQueue.add('slack-notification', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
}

// Worker processes alerts in background
const worker = new Worker('alerts', async (job) => {
  const { type, company_id, usage_usd, cap_usd, usage_pct } = job.data;

  if (type === 'ai_budget_warning') {
    await sendSlackWebhook({
      text: `⚠️ *AI Budget Alert*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Company ID ${company_id} has reached *${usage_pct}%* of their AI budget.\n\n` +
                  `*Usage:* $${usage_usd.toFixed(2)} / $${cap_usd.toFixed(2)}\n` +
                  `*Month:* ${job.data.month_year}`
          }
        }
      ]
    });
  }
}, { connection });

async function sendSlackWebhook(payload) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping alert');
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status}`);
  }
}

worker.on('completed', (job) => {
  console.log(`Alert sent: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`Alert failed: ${job.id}`, err);
});
```

### 4.2 Add to `.env`

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## **Phase 5: Testing** (60 min)

### 5.1 Test: Budget cap returns 402

**File**: `backend/tests/integration/ai-budget.test.js`

```javascript
import request from 'supertest';
import app from '../../app.js';
import { getDb } from '../../config/database.js';

describe('AI Budget Cap', () => {
  let companyId, token;

  beforeAll(async () => {
    // Create test company with $0.10 budget
    const db = getDb();
    const company = await db.query(
      `INSERT INTO core_company (name) VALUES ('Test Co') RETURNING id`
    );
    companyId = company.rows[0].id;

    await db.query(
      `INSERT INTO company_budgets (company_id, month_year, monthly_cap_usd, current_usage_usd)
       VALUES ($1, '2026-06', 0.10, 0.00)`,
      [companyId]
    );

    // Get auth token
    token = await getAuthToken(companyId);
  });

  test('returns 402 when budget exhausted', async () => {
    // Set usage to $0.10 (at cap)
    await getDb().query(
      `UPDATE company_budgets SET current_usage_usd = 0.10 WHERE company_id = $1`,
      [companyId]
    );

    const res = await request(app)
      .post('/api/job/generate-description')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'Generate JD for SE' });

    expect(res.status).toBe(402);
    expect(res.body.message).toContain('budget exhausted');
  });
});
```

### 5.2 Test: 80% alert fires exactly once

```javascript
test('fires 80% alert exactly once', async () => {
  const db = getDb();

  // Reset budget to $1.00, usage to $0.70 (70%)
  await db.query(
    `UPDATE company_budgets
     SET monthly_cap_usd = 1.00, current_usage_usd = 0.70, alert_80_sent = FALSE
     WHERE company_id = $1`,
    [companyId]
  );

  // Make AI call that adds $0.15 (total 85%)
  await request(app)
    .post('/api/job/generate-description')
    .set('Authorization', `Bearer ${token}`)
    .send({ prompt: 'Short test' });

  // Check alert_80_sent flag
  const budget = await db.query(
    `SELECT alert_80_sent FROM company_budgets WHERE company_id = $1`,
    [companyId]
  );

  expect(budget.rows[0].alert_80_sent).toBe(true);

  // Make second AI call - alert should NOT fire again
  const alertCountBefore = await getSlackAlertCount();

  await request(app)
    .post('/api/job/generate-description')
    .set('Authorization', `Bearer ${token}`)
    .send({ prompt: 'Another test' });

  const alertCountAfter = await getSlackAlertCount();
  expect(alertCountAfter).toBe(alertCountBefore); // No new alert
});
```

---

## **Phase 6: Manual Verification** (30 min)

### 6.1 Smoke test checklist

```bash
# 1. Seed test company with $1.00 budget
psql -d ats -c "INSERT INTO company_budgets (company_id, month_year, monthly_cap_usd) VALUES (1, '2026-06', 1.00)"

# 2. Generate job description (should work)
curl -X POST http://localhost:3000/api/job/generate-description \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt": "SE with React"}'

# 3. Check current usage
psql -d ats -c "SELECT current_usage_usd, alert_80_sent FROM company_budgets WHERE company_id = 1"

# 4. Manually set usage to $0.85 (85%)
psql -d ats -c "UPDATE company_budgets SET current_usage_usd = 0.85 WHERE company_id = 1"

# 5. Generate again - should fire 80% alert
curl -X POST http://localhost:3000/api/job/generate-description \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt": "Short test"}'

# 6. Check Slack for alert

# 7. Set usage to $1.00 (100%)
psql -d ats -c "UPDATE company_budgets SET current_usage_usd = 1.00 WHERE company_id = 1"

# 8. Generate again - should return 402
curl -X POST http://localhost:3000/api/job/generate-description \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt": "Should fail"}'
# Expected: {"error": "AI budget exhausted for this month..."}
```

---

## **Done When (Success Criteria)**

✅ Setting test company budget to $0.10 → screening call returns 402
✅ Setting budget to $1.00 + using $0.85 → exactly one Slack alert fires
✅ `alert_80_sent` flag prevents duplicate alerts
✅ All AI services (`ai.service.js`, `assessment-ai.service.js`) check budget before OpenAI call
✅ Usage recorded atomically after successful AI call
✅ Bull queue processes alerts in background (non-blocking)

---

## **Time Breakdown** (Total: 4h)

- Phase 1 (DB): 30 min
- Phase 2 (Service): 90 min
- Phase 3 (AI Integration): 60 min
- Phase 4 (Bull Queue): 60 min
- Phase 5 (Tests): 60 min
- Phase 6 (Manual QA): 30 min

**Slack buffer**: 30 min untuk debugging

---

## **Dependencies**

### NPM packages to install:
```bash
cd backend
npm install bullmq ioredis
```

### System requirements:
- Redis server running (for Bull queue)
- Slack incoming webhook URL configured
- PostgreSQL with existing `company_usage` table

---

## **Migration Path**

1. **Run migration** to create `company_budgets` table
2. **Seed** initial budgets for existing companies (default $100/month)
3. **Deploy** new service + queue worker
4. **Configure** `SLACK_WEBHOOK_URL` in production `.env`
5. **Monitor** first week to validate cost calculations are accurate

---

## **Future Enhancements (v0.1.5)**

- Admin UI to view/edit company budgets
- Per-feature budget breakdown (JD generation vs Screening vs Psych)
- Historical usage charts
- Predictive alerts ("at current rate, budget exhausted by day 15")
- Multi-provider support (OpenAI, Anthropic, Azure) with unified cost tracking
