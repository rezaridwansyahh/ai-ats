// Per-tenant recruiter rosters for multi-tenancy demos.
export default [
  // --- Company 1 (Myralix) ---
  { id: 1, company_id: 1, name: 'Sari Kurniawati',  email: 'sari@myralix.com',     jobs_assigned: 3, status: 'Active' },
  { id: 2, company_id: 1, name: 'Andi Wijaya',      email: 'andi@myralix.com',     jobs_assigned: 2, status: 'Active' },
  { id: 3, company_id: 1, name: 'Rina Mahendra',    email: 'rina@myralix.com',     jobs_assigned: 0, status: 'Onboarding' },

  // --- Company 2 (Acme Recruiting) ---
  { id: 4, company_id: 2, name: 'Diana Hartono',    email: 'diana@acme-recruiting.example', jobs_assigned: 2, status: 'Active' },
  { id: 5, company_id: 2, name: 'Marcus Tanudjaja', email: 'marcus@acme-recruiting.example', jobs_assigned: 1, status: 'Active' },
];
