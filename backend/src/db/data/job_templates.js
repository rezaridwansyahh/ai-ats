// Links each seeded job to a master_template_stage so it has a working pipeline
// out of the box. Tech jobs use the IT Dev template (id 2); the rest use the
// generic Akuntan template (id 1).
//
// Active jobs (1-5) all get a template so AI Matching / Candidate Pipeline have
// data to work with on a fresh seed. Draft jobs (6-10) intentionally get NO
// template so the JobManagement "stages must be configured" gate can be tested.
export default [
  { id: 1, job_id: 1, template_stage_id: 2 }, // Senior Frontend Engineer  → IT Dev
  { id: 2, job_id: 2, template_stage_id: 2 }, // Backend Engineer (Node.js) → IT Dev
  { id: 3, job_id: 3, template_stage_id: 2 }, // Product Designer           → IT Dev
  { id: 4, job_id: 4, template_stage_id: 2 }, // DevOps Engineer            → IT Dev
  { id: 5, job_id: 5, template_stage_id: 2 }, // QA Automation Engineer     → IT Dev
];
