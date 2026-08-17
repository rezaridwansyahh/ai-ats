// Kept in sync with each candidate's master_candidate.latest_stage:
//  - latest_stage still at Interview (8)      → row exists, status in progress, decision 'pending'
//  - latest_stage past Interview (9, 10, 11)   → row exists, status 'done', decision 'advanced'
//  - latest_stage before Interview (6, 7)      → no row at all (matches ensureInterviewForCandidate,
//                                                 which only creates a row once a candidate reaches Interview)
export default [
  // Job 1 — Senior Frontend Engineer
  { id: 1, candidate_id: 3, job_id: 1, company_id: 1, round_number: 1, status: 'scheduled', decision: 'pending',  scheduled_at: '2026-06-20T10:00:00Z' }, // Dewi Anggraini   latest_stage 8  (Interview, in progress)
  { id: 2, candidate_id: 7, job_id: 1, company_id: 1, round_number: 1, status: 'result',    decision: 'pending',  scheduled_at: '2026-06-18T14:00:00Z' }, // Julia Saputra    latest_stage 8  (Interview, result recorded)
  { id: 3, candidate_id: 5, job_id: 1, company_id: 1, round_number: 1, status: 'done',      decision: 'advanced', scheduled_at: '2026-06-05T09:00:00Z' }, // Fitri Handayani  latest_stage 10 (past Interview)
  { id: 4, candidate_id: 6, job_id: 1, company_id: 1, round_number: 1, status: 'done',      decision: 'advanced', scheduled_at: '2026-06-02T09:00:00Z' }, // Irfan Maulana    latest_stage 11 (past Interview)

  // Job 2 — Backend Engineer
  { id: 5, candidate_id: 8,  job_id: 2, company_id: 1, round_number: 1, status: 'ongoing', decision: 'pending',  scheduled_at: null },                    // Gilang Ramadhan  latest_stage 8  (Interview, in progress)
  { id: 6, candidate_id: 10, job_id: 2, company_id: 1, round_number: 1, status: 'done',    decision: 'advanced', scheduled_at: '2026-05-28T09:00:00Z' },  // Kevin Wijaya     latest_stage 11 (past Interview)

  // Job 3 — Product Designer
  { id: 7, candidate_id: 14, job_id: 3, company_id: 1, round_number: 1, status: 'done', decision: 'advanced', scheduled_at: '2026-06-10T09:00:00Z' },     // Citra Lestari    latest_stage 10 (past Interview)
];
