// Kept in sync with master_candidate.latest_stage — a row only exists once
// the candidate has actually reached Offering & Contract (10) or later.
// Gilang (candidate_id 8, still at Interview stage 8) intentionally has no
// row here anymore — his old row was premature.
//
// NOTE: the two "email-tester" rows (candidate_id 12, 13) are intentional
// fixtures for exercising the offer email flow, not meant to reflect real
// pipeline progression — left as-is on purpose.
export default [
  // ── Job 1 — Senior Frontend Engineer ──────────────────────────────────────
  {
    id: 1,
    company_id: 1,
    candidate_id: 5, // Fitri Handayani — latest_stage 10 (currently at Offering)
    job_id: 1,
    position_title: 'Senior Frontend Engineer',
    contract_type: 'PKWTT',
    offer_status: 'sent',
    contract_status: null,
    metadata: {},
    sent_at: '2026-06-06T10:00:00Z',
    accepted_at: null,
    rejected_at: null,
    expired_at: null,
    created_by: 1,
  },

  {
    id: 2,
    company_id: 1,
    candidate_id: 6, // Irfan Maulana — latest_stage 11 (past Offering, onboarding)
    job_id: 1,
    position_title: 'Senior Frontend Engineer',
    contract_type: 'PKWTT',
    offer_status: 'accepted',
    contract_status: null,
    metadata: {},
    sent_at: '2026-06-03T10:00:00Z',
    accepted_at: '2026-06-05T09:00:00Z',
    rejected_at: null,
    expired_at: null,
    created_by: 1,
  },

  // ── Job 2 — Backend Engineer ──────────────────────────────────────────────
  {
    id: 4,
    company_id: 1,
    candidate_id: 10, // Kevin Wijaya — latest_stage 11 (past Offering, onboarding)
    job_id: 2,
    position_title: 'Backend Engineer',
    contract_type: 'PKWTT',
    offer_status: 'accepted',
    contract_status: null,
    metadata: {},
    sent_at: '2026-05-29T10:00:00Z',
    accepted_at: '2026-05-31T09:00:00Z',
    rejected_at: null,
    expired_at: null,
    created_by: 1,
  },

  // ── Job 3 — Product Designer ────────────────────────────────────────────────
  {
    id: 5,
    company_id: 1,
    candidate_id: 14, // Citra Lestari — latest_stage 10 (currently at Offering)
    job_id: 3,
    position_title: 'Product Designer',
    contract_type: 'PKWT',
    offer_status: 'sent',
    contract_status: null,
    metadata: {},
    sent_at: '2026-06-11T10:00:00Z',
    accepted_at: null,
    rejected_at: null,
    expired_at: null,
    created_by: 1,
  },

  {
    id: 6,
    company_id: 1,
    candidate_id: 12, // email-tester (intentional test fixture, not pipeline-synced)
    job_id: 2,
    position_title: 'Backend Engineer',
    contract_type: 'PKWT',
    offer_status: 'draft',
    contract_status: null,
    metadata: {},
    sent_at: null,
    accepted_at: null,
    rejected_at: null,
    expired_at: null,
    created_by: 1,
  },

  {
    id: 7,
    company_id: 1,
    candidate_id: 13, // email-tester 2 (intentional test fixture, not pipeline-synced)
    job_id: 2,
    position_title: 'Backend Engineer',
    contract_type: 'PKWT',
    offer_status: 'draft',
    contract_status: null,
    metadata: {},
    sent_at: null,
    accepted_at: null,
    rejected_at: null,
    expired_at: null,
    created_by: 1,
  },
];
