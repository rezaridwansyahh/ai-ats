# Myralix ATS — AI-Powered Features

> Last updated: 2026-07-14  
> All AI features use **OpenAI GPT-4o-mini** via `backend/src/shared/services/ai.service.js`  
> All AI calls are gated by **monthly budget caps** (`CompanyUsageService`) — returns HTTP 402 when exceeded.

---

## 1. Job Description Generation

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/job/generate` |
| **Backend file** | `backend/src/modules/job/job.service.js` |
| **Model** | `gpt-4o-mini` |
| **Response mode** | SSE streaming (chunked text) |
| **Frontend** | `frontend/src/api/job.api.js` (raw `fetch()` for SSE), `frontend/src/pages/JobCreate.jsx` / `JobEdit.jsx` |

**What it does:**  
Accepts an uploaded file (PDF/DOCX/TXT) or pasted text and streams a structured job description back in real time. The generated output populates all job fields (title, responsibilities, requirements, salary range, etc.).

**Input:** Raw file upload or plain text  
**Output:** Streamed JSON-structured job description

---

## 2. CV Facet Extraction

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/screening/extract-facets` |
| **Backend file** | `backend/src/modules/screening/screening.service.js` |
| **Model** | `gpt-4o-mini` |
| **Response mode** | JSON (non-streaming) |
| **Frontend** | `frontend/src/pages/AIScreening.jsx`, `AIScreeningCandidate.jsx` |

**What it does:**  
Parses a candidate's CV/resume and extracts structured facets: education, work history, skills, certifications, languages, and inferred competency signals. Stored in `screening_candidates` for downstream scoring.

**Input:** CV text (extracted from PDF/DOCX via `file-parser.js`)  
**Output:** Structured JSON of candidate facets

---

## 3. AI Rubric Generation

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/screening/rubric/:job_id` |
| **Backend file** | `backend/src/modules/screening/screening.service.js` |
| **Model** | `gpt-4o-mini` |
| **Response mode** | JSON (non-streaming) |
| **Frontend** | `frontend/src/pages/AIScreening.jsx` |

**What it does:**  
Generates a scoring rubric tailored to the job description — defining weighted criteria across cognitive, personality, and work attitude dimensions. Managers can review and edit the rubric before scoring begins.

**Input:** Job description + role requirements  
**Output:** JSON rubric with weighted criteria per pillar

---

## 4. Candidate Scoring

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/screening/score` (single), `POST /api/screening/score-bulk/:job_id` (bulk) |
| **Backend file** | `backend/src/modules/screening/screening.service.js` |
| **Model** | `gpt-4o-mini` |
| **Response mode** | JSON (non-streaming) |
| **Frontend** | `frontend/src/pages/AIScreening.jsx`, `AIScreeningCandidate.jsx` |

**What it does:**  
Scores a candidate against the job rubric across three pillars: Cognitive (learning capacity, problem-solving), Personality (character fit for the role), and Work Attitude (orientation, preferences, style). Returns 0–100 scores per pillar plus overall.

**Input:** Candidate CV facets + job rubric  
**Output:** Pillar scores (cognitive/personality/workAttitude/overall), detailed rationale per criterion

---

## 5. AI Matching (Ranked List)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/screening/match/:job_id` |
| **Backend file** | `backend/src/modules/screening/screening.service.js` |
| **Model** | `gpt-4o-mini` |
| **Response mode** | JSON (non-streaming) |
| **Frontend** | `frontend/src/pages/AIScreening.jsx` |

**What it does:**  
Runs AI Matching across all scored candidates for a job and produces a ranked shortlist with recommendation labels (Recommended / Consider / Not Recommended). The calibration view (L4) uses these results for batch decisions.

**Input:** All candidate scores for a job  
**Output:** Ranked candidate list with match tier and recommendation

---

## 6. Follow-up Q&A Generation

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/screening/generate-qa/:screening_id` |
| **Backend file** | `backend/src/modules/screening/screening.service.js` |
| **Model** | `gpt-4o-mini`, temperature `0.4` |
| **Response mode** | JSON (non-streaming) |
| **Frontend** | `frontend/src/pages/AIScreeningCandidate.jsx` |

**What it does:**  
Generates personalized follow-up questions based on gaps or ambiguities found in the candidate's CV facets and scoring rationale. Questions are sent to the candidate via email with a secure portal link.

**Input:** Candidate CV facets + scoring result + job rubric  
**Output:** Ordered list of targeted questions (typically 3–5)

---

## 7. Interview Question Generation

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/interview/generate-questions/:job_id` |
| **Backend file** | `backend/src/modules/interview/interview.service.js` |
| **Model** | `gpt-4o-mini`, temperature `0.4` |
| **Response mode** | JSON (non-streaming) |
| **Frontend** | `frontend/src/pages/InterviewPrep.jsx` (or equivalent) |

**What it does:**  
Generates structured interview questions based on the job description and required competencies. Covers behavioral, situational, and technical question types. Interviewers can lock the rubric to standardize scoring across panelists.

**Input:** Job description + competency framework  
**Output:** Categorized question bank with suggested follow-ups

---

## 8. Assessment Section Interpretation

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/assessment-ai/generate-section` |
| **Backend file** | `backend/src/modules/assessment/assessment-ai/assessment-ai.service.js` |
| **Model** | `gpt-4o-mini` |
| **Response mode** | SSE streaming |
| **Frontend** | `frontend/src/components/assessment-*/report/ReportView.jsx` |

**What it does:**  
Generates a narrative interpretation for each section of a psychometric battery (e.g., cognitive subtest results, personality trait scores). The narrative is streamed in real time and displayed in the report view. Managers can regenerate or edit the narrative.

**Batteries supported:** A, B, C, D (each has its own `ReportView.jsx` and `report-utils.js`)

**Input:** Section scores + subtest raw data for a candidate  
**Output:** Streamed human-readable narrative (HTML) per section

---

## 9. Assessment Synthesis (Overall Narrative)

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/assessment-ai/generate-synthesis` |
| **Backend file** | `backend/src/modules/assessment/assessment-ai/assessment-ai.service.js` |
| **Model** | `gpt-4o-mini` |
| **Response mode** | SSE streaming |
| **Frontend** | `frontend/src/components/assessment-*/report/ReportView.jsx` |

**What it does:**  
Generates a holistic synthesis narrative that integrates all section interpretations into one cohesive assessment conclusion. This is the executive summary used by the hiring manager in the Score & Decide tab.

**Input:** All section narratives + pillar scores + profile data  
**Output:** Streamed synthesis narrative (HTML)

---

## 10. Pre-Generated Battery Narratives (Background)

| Field | Value |
|-------|-------|
| **Trigger** | On assessment session completion |
| **Backend file** | `backend/src/modules/assessment/assessment-battery-result/assessment-battery-result.service.js` |
| **Model** | `gpt-4o-mini` |
| **Response mode** | Async fire-and-forget |
| **Frontend** | `ScoreDecideTab.jsx` polls for completion |

**What it does:**  
When a candidate completes an assessment session, the system automatically kicks off AI narrative generation in the background (no user action required). The Score & Decide tab polls and displays a progress indicator until narratives are ready.

**Input:** Completed session answers + scoring data  
**Output:** Pre-computed section + synthesis narratives stored in `assessor_state` JSONB

---

## 11. Background Check Claim Extraction

| Field | Value |
|-------|-------|
| **Endpoint** | Internal / background check module |
| **Backend file** | `backend/src/modules/` (background check service) |
| **Model** | `gpt-4o-mini`, temperature `0.1` |
| **Response mode** | JSON (non-streaming) |

**What it does:**  
Extracts verifiable claims from candidate-submitted documents during background check processing (employment history dates, job titles, credentials). Low temperature ensures deterministic extraction.

**Input:** Candidate document text  
**Output:** Structured list of verifiable claims

---

## AI Cost Management

| Field | Value |
|-------|-------|
| **Service** | `backend/src/modules/company-usage/company-usage.service.js` |
| **Default monthly cap** | $100 USD |
| **On cap exceeded** | HTTP 402 (Payment Required) |
| **Tracking** | All AI calls logged with token usage, cost estimate, feature tag |

**How it works:**  
Every AI feature calls `CompanyUsageService.checkBudgetOrThrow(companyId, featureTag)` before making any OpenAI request. If the company's monthly AI spend has reached the cap, the call is rejected with a 402 error and a user-facing message. Usage is tracked per company and resets monthly.

---

## Architecture Overview

```
Frontend (React 19)
│
├── SSE features (raw fetch): Job Generation, Section Interpretation, Synthesis
└── JSON features (axios): All screening, scoring, Q&A, interview questions
        │
        ▼
Backend (Express 5)
│
├── CompanyUsageService ──→ Budget check (before every AI call)
│
├── ai.service.js ──────→ OpenAI client (gpt-4o-mini)
│       ├── streamCompletion()   — for SSE endpoints
│       └── jsonCompletion()     — for structured JSON endpoints
│
└── Feature modules
    ├── screening/        — CV extraction, scoring, matching, Q&A
    ├── job/              — Job description generation
    ├── interview/        — Question generation
    └── assessment/
        └── assessment-ai/ — Section interpretation + synthesis
```

---

## Quick Reference Table

| # | Feature | Endpoint | Mode | Temp |
|---|---------|----------|------|------|
| 1 | Job Description Generation | `POST /job/generate` | SSE | default |
| 2 | CV Facet Extraction | `POST /screening/extract-facets` | JSON | default |
| 3 | AI Rubric Generation | `POST /screening/rubric/:job_id` | JSON | default |
| 4 | Candidate Scoring (single) | `POST /screening/score` | JSON | default |
| 4b | Candidate Scoring (bulk) | `POST /screening/score-bulk/:job_id` | JSON | default |
| 5 | AI Matching / Ranking | `POST /screening/match/:job_id` | JSON | default |
| 6 | Follow-up Q&A Generation | `POST /screening/generate-qa/:id` | JSON | 0.4 |
| 7 | Interview Question Generation | `POST /interview/generate-questions/:job_id` | JSON | 0.4 |
| 8 | Assessment Section Interpretation | `POST /assessment-ai/generate-section` | SSE | default |
| 9 | Assessment Synthesis | `POST /assessment-ai/generate-synthesis` | SSE | default |
| 10 | Pre-Generated Narratives | (background, on session complete) | Async | default |
| 11 | Background Check Extraction | (internal) | JSON | 0.1 |
