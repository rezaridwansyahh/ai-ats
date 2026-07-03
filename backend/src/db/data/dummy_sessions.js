// Dummy assessment session for Budi Santoso (candidate_id: 2, Battery A).
// token is fixed so the portal URL is predictable for testing.
//
// Portal URL:  http://localhost:5173/assessment-placement/a1b2c3d4-e5f6-7890-abcd-ef1234567890
// Email gate:  budi.santoso@example.com

export const dummySessions = [
  {
    token:        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    battery:      'A',
    candidate_id: 2,   // Budi Santoso
    job_id:       1,   // Senior Frontend Engineer
    created_by:   1,   // admin user
    status:       'completed',
    submitted_at: '2026-06-10 09:30:00',
    expired_at:   '2027-12-31 23:59:59',
  },
];
