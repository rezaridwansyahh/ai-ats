// Kept in sync with master_candidate.latest_stage — a row only exists once
// the candidate has actually reached Background Check (9) or later, and is
// marked 'done'/'pass' once they've moved past it. Gilang (still at
// Interview, stage 8) intentionally has no row here yet.
export default [
  // ── Job 1 — Senior Frontend Engineer ────────────────────────────────────────
  {
    id: 5,
    candidate_id: 1, // Ayu Pratiwi — latest_stage 9 (currently AT Background Check)
    job_id: 1,
    company_id: 1,
    status: 'claims',
    verdict: null,
    verdict_note: null,
    archived_reason: null,
  },

  {
    id: 1,
    candidate_id: 5, // Fitri Handayani — latest_stage 10 (past Background Check)
    job_id: 1,
    company_id: 1,
    status: 'done',
    verdict: 'pass',
    verdict_note: null,
    archived_reason: null,
  },
   {
    id: 5,
    candidate_id: 1, // Ayu Pratiwi — latest_stage 9 (currently AT Background Check)
    job_id: 1,
    company_id: 1,
    status: 'claims',
    verdict: null,
    verdict_note: null,
    archived_reason: null,
  },
  {
    id: 2,
    candidate_id: 6, // Irfan Maulana — latest_stage 11 (past Background Check)
    job_id: 1,
    company_id: 1,
    status: 'done',
    verdict: 'pass',
    verdict_note: null,
    archived_reason: null,
  },

  // ── Job 2 — Backend Engineer ─────────────────────────────────────────────────
  {
    id: 3,
    candidate_id: 10, // Kevin Wijaya — latest_stage 11 (past Background Check)
    job_id: 2,
    company_id: 1,
    status: 'done',
    verdict: 'pass',
    verdict_note: null,
    archived_reason: null,
  },

  // ── Job 3 — Product Designer ─────────────────────────────────────────────────
  {
    id: 4,
    candidate_id: 14, // Citra Lestari — latest_stage 10 (past Background Check)
    job_id: 3,
    company_id: 1,
    status: 'done',
    verdict: 'pass',
    verdict_note: null,
    archived_reason: null,
  },
];
