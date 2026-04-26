# AI Screening + Talent Pool — Implementation Notes

This document summarizes everything added or modified to introduce AI-based candidate scoring (facet extraction + per-job match score) and the new keyword-driven Talent Pool experience.

---

## 1. Concept

Scoring is **two-layered** and gated by the applicant lifecycle:

| Layer | When it runs | What it does | Where it lives |
|-------|--------------|--------------|----------------|
| **Layer 1 — Facet extraction** | Explicitly via `POST /api/screening/extract-facets/:applicant_id` (intended to fire on applicant ingest once CV upload is wired) | Parses a CV (PDF/DOCX/TXT) into structured JSON: `job_position`, `skills[]`, `education[]`, `experience` | `master_applicant.information` (existing JSONB column) |
| **Layer 2 — Per-job scoring** | Automatically when an applicant is promoted to a candidate (`POST /api/candidate-pipeline`), or via explicit re-score endpoints | LLM compares Layer 1 facets to a `core_job` and returns per-facet + overall scores | New `applicant_job_score` table (UNIQUE on `applicant_id, job_id`) |

Skill names are normalized through a database-backed alias map (`master_skill_alias`), so `reactjs`, `react.js`, `react js` all become `React`.

`pgvector` is **not** used in v1 — JSONB facets cover the search-by-category use case.

---

## 2. Database changes — `backend/src/db/setup.sql`

### New table: `applicant_job_score`
Stores Layer 2 results, separate from `master_candidate` so re-scoring is a clean upsert and pipeline state stays isolated.

```sql
CREATE TABLE applicant_job_score (
  id                SERIAL PRIMARY KEY,
  applicant_id      INTEGER NOT NULL REFERENCES master_applicant(id) ON DELETE CASCADE,
  job_id            INTEGER NOT NULL REFERENCES core_job(id) ON DELETE CASCADE,
  overall_score     INTEGER NOT NULL CHECK (overall_score    BETWEEN 0 AND 100),
  position_score    INTEGER          CHECK (position_score   BETWEEN 0 AND 100),
  skills_score      INTEGER          CHECK (skills_score     BETWEEN 0 AND 100),
  education_score   INTEGER          CHECK (education_score  BETWEEN 0 AND 100),
  experience_score  INTEGER          CHECK (experience_score BETWEEN 0 AND 100),
  matched_skills    JSONB,
  missing_skills    JSONB,
  summary           TEXT,
  scored_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (applicant_id, job_id)
);
CREATE INDEX idx_ajs_job_score ON applicant_job_score (job_id, overall_score DESC);
CREATE INDEX idx_ajs_applicant ON applicant_job_score (applicant_id);
```

### New table: `master_skill_alias`
Database-backed normalization, replaces a hard-coded JS map. Loaded into a TTL-cached in-memory `Map` at runtime.

```sql
CREATE TABLE master_skill_alias (
  alias        VARCHAR(100) PRIMARY KEY,   -- always stored lowercase
  canonical    VARCHAR(100) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_skill_alias_canonical ON master_skill_alias (canonical);
```

### New index on existing column
```sql
CREATE INDEX idx_applicant_information_gin
  ON master_applicant USING GIN (information jsonb_path_ops);
```

### Seed data
- New file: `backend/src/db/data/skill_aliases.js` — ~70 initial alias entries (reactjs/react.js → React, k8s → Kubernetes, etc.).
- Seed runner `backend/src/db/seeds/seed.js` — registers `master_skill_alias` cleanup + insert.
- Updated `backend/src/db/data/applicants.js` — the 12 dummy applicants now carry a fully-populated Layer 1 `information` payload (`job_position`, normalized `skills[]`, `education[]` with school/degree/year/tier, `experience` with `years_total` + `positions[]`) so the Talent Pool UI works without running the LLM extraction.

---

## 3. Backend changes

### New module: `backend/src/modules/screening/`

| File | Responsibility |
|------|----------------|
| `screening.model.js` | SQL: upsert score, fetch result, fetch candidates by job, **faceted search** (`q`, `position_q`, `skill_q`, `education_q`, `location_q`, `position`, `skills[]+skills_mode`, `min_years`, `education_tier`, `min_score`, `mode=pool|pipeline`), update applicant `information` |
| `screening.service.js` | Orchestrates Layer 1 / Layer 2 / bulk re-score / automation decision resolver |
| `screening.controller.js` | HTTP handlers; coerces query params, handles file vs text upload |
| `screening.route.js` | Mounts auth middleware + Multer for CV upload |
| `skill-alias.model.js` | CRUD against `master_skill_alias` |
| `skill-normalizer.js` | TTL-cached `Map<alias, canonical>` and helpers `normalizeSkill` / `normalizeSkills` |

### Endpoints (mounted at `/api/screening` and `/portal/api/screening` in `backend/app.js`)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/screening/extract-facets/:applicant_id` | Layer 1. Multer `cv` file (PDF/DOCX/TXT) **or** JSON body `{ cv_text }` |
| `POST` | `/screening/score` | Layer 2 for one (applicant, job) pair. Body: `{ applicant_id, job_id }`. Idempotent upsert |
| `POST` | `/screening/score-bulk/:job_id` | Re-score every candidate currently in the pipeline for that job (used after a job description edit) |
| `GET`  | `/screening/result?applicant_id=&job_id=` | Fetch a stored score breakdown |
| `GET`  | `/screening/search` | Faceted search; see params below |

### `GET /screening/search` parameters

| Param | Type | Notes |
|-------|------|-------|
| `mode` | `pool` (default) \| `pipeline` | Pipeline requires `job_id` and only returns applicants who exist in `master_candidate` for that job |
| `job_id` | int | Used to JOIN scores; required when `mode=pipeline` |
| `q` | string | Global ILIKE substring across name, last_position, education, address, position fields, skills array, education array (school/degree) |
| `position_q` | string | ILIKE on `last_position`, `information.job_position.current/category` |
| `skill_q` | string | ILIKE on any element of `information.skills` |
| `education_q` | string | ILIKE on `education` text + `information.education[].school/degree` |
| `location_q` | string | ILIKE on `address` |
| `position` | string | Strict ILIKE on `information.job_position.category` |
| `skills` | comma-separated | Array containment (`@>` for `skills_mode=all`, `?|` for `skills_mode=any`) |
| `skills_mode` | `all` \| `any` | |
| `min_years` | int | Compares `information.experience.years_total` |
| `education_tier` | `top` \| `mid` \| `other` | Containment match against `information.education` |
| `min_score` | int | Minimum `applicant_job_score.overall_score` |
| `page`, `limit` | int | Pagination |

All filters are AND-joined across categories. Results include `total_count` via window function for pagination.

### AI service extensions — `backend/src/shared/services/ai.service.js`

| Method | Description |
|--------|-------------|
| `extractFacets(cvText)` | Layer 1. GPT-4o-mini, `response_format: json_object`, defensive parsing, normalizes skills via the alias cache |
| `scoreApplicantAgainstJob(job, facets)` | Layer 2. Returns `overall_score`, per-facet scores, `matched_skills`, `missing_skills`, `summary` |

### Candidate-pipeline hook — `backend/src/modules/candidate-pipeline/candidate-pipeline.service.js`

`create()` now fires `_triggerScoring()` **fire-and-forget** after the `master_candidate` row is committed. The score lands in `applicant_job_score`, and `screeningService.resolveAutomationDecision()` reads `job_automation_settings` to log auto-reject / auto-advance decisions. Actual stage transition is left as a follow-up (no canonical "Rejected" stage exists in the seeded job templates yet).

---

## 4. Frontend changes

### New file: `frontend/src/api/screening.api.js`
Axios wrappers for all five screening endpoints (including multipart upload for `extract-facets`).

### Rebuilt: `frontend/src/pages/TalentPool.jsx`

- Default behavior: **shows all applicants on initial render** (no search interaction required).
- Four typed input boxes in a responsive grid: **Position**, **Skill**, **Education**, **Location** — each does ILIKE substring match on its specific facet.
- All filters are AND-joined; **Search** button is disabled until at least one box has content.
- **Clear** resets both draft and active filter state, which triggers a re-fetch and shows everything again.
- Stats cards (Total, New This Week, Position Categories, Avg Experience) come from a one-shot `getAll()` so they always reflect the full pool, not the current search.
- Results table shows skill chips, position category, top education entry, applied-on date.
- Each row has an **Add** button that opens the existing `AddToJobDialog`, which calls `addApplicantToJob` → `POST /api/candidate-pipeline` → triggers Layer 2.

### Rebuilt: `frontend/src/components/job-management/ListCandidate.jsx`

Two-mode view inside the Job Management wizard step 4:

- **Pool mode** (default): facet-only search across all applicants for this job. Position/Skills/Education/Min-experience filters. Each row has "Add to Candidate".
- **Pipeline mode**: only applicants already promoted to candidates for the job. Adds the **Overall score** column + score-range slider + "Re-run AI Screening" button (calls `score-bulk/:job_id`).

---

## 5. How to run / verify

1. **Reset the database** to apply the new tables and seeded data:
   ```
   cd backend && node src/db/run-script.js
   ```
2. **Start backend** (port 3000) and **frontend** (port 5173):
   ```
   cd backend && node app.js
   cd frontend && npm run dev
   ```
3. **Talent Pool** at `/sourcing/talent-pool`:
   - All 12 seeded applicants render immediately.
   - Try `Skill = react` → narrows to ~6 React people.
   - Try `Position = frontend` → ~6 results.
   - Try `Location = singapore` → 2 results (Citra, Kevin).
   - Try `Education = gadjah` → 2 results (Dewi, Fitri).
   - Combine multiple boxes → AND across categories.
   - Click **Add** on a row → pick a job in the dialog → the candidate-pipeline endpoint fires → Layer 2 scoring runs server-side asynchronously.
4. **Verify Layer 2 ran**: hit `GET /api/screening/result?applicant_id=X&job_id=Y` for the pair you just added; you should see the overall + per-facet scores, matched/missing skills, and the LLM `summary`.
5. **Layer 1 against a real CV** (optional): `POST /api/screening/extract-facets/:applicant_id` with a `cv` multipart file or a JSON `{ cv_text }` body. The applicant's `information` JSONB will be replaced with the LLM-parsed facets.

---

## 6. Files touched (full list)

### Backend
- `backend/src/db/setup.sql` — new `applicant_job_score`, `master_skill_alias`, GIN index on `master_applicant.information`
- `backend/src/db/data/skill_aliases.js` — new
- `backend/src/db/data/applicants.js` — replaced `information` payload with full Layer 1 schema
- `backend/src/db/seeds/seed.js` — register skill-alias seeding
- `backend/src/shared/services/ai.service.js` — added `extractFacets`, `scoreApplicantAgainstJob`
- `backend/src/modules/screening/{route,controller,service,model,skill-alias.model,skill-normalizer}.js` — new module
- `backend/src/modules/candidate-pipeline/candidate-pipeline.service.js` — Layer 2 hook on create
- `backend/app.js` — mounted `/api/screening`

### Frontend
- `frontend/src/api/screening.api.js` — new
- `frontend/src/pages/TalentPool.jsx` — rebuilt
- `frontend/src/components/job-management/ListCandidate.jsx` — rebuilt

---

## 7. Known limitations / follow-ups

- **CV ingest plumbing**: facet extraction has its own endpoint, but applicant *creation* doesn't yet auto-extract. Wire this when the applicant-create UI/route exists, by calling `screeningService.extractFacetsFromFile()` after the row is inserted.
- **Auto-reject / auto-advance**: `resolveAutomationDecision()` returns the decision and logs it, but the candidate's pipeline stage is not actually moved. Wire `addStage()` once you've decided which `job_stage.name` represents "rejected" / "advanced" for each job.
- **Fuzzy / typo tolerance**: search is ILIKE substring only. If users want "frondend" → "Frontend" tolerance, install `pg_trgm` and switch the relevant clauses to `similarity()` / `%` operator.
- **Skill alias expansion in search**: if a user types "k8s", the literal substring won't match "Kubernetes" in the stored skills. Easy follow-up: at search time, look the term up in `master_skill_alias` and OR-search both forms.
- **`pgvector`**: still deferred. Revisit only if semantic skill matching becomes a real pain point.
