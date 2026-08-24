// Seed data for job_post + mapping_job_sourcing_job.
//
// job_post: one row per (job, platform) the job has actually been posted to.
// Every core_job gets at least one 'Internal' row (its internal pipeline).
// Jobs that are also externally sourced (ids 1, 2, 6 — see job_sourcing.js)
// get an extra 'Publish' row per platform.
export const jobPosts = [
  // Job 1 — Senior Frontend Engineer: internal pipeline + Seek + LinkedIn
  { id: 1, job_id: 1, type: 'Internal', platform: 'internal' },
  { id: 2, job_id: 1, type: 'Publish',  platform: 'seek' },
  { id: 3, job_id: 1, type: 'Publish',  platform: 'linkedin' },

  // Job 2 — Backend Engineer (Node.js): Seek + LinkedIn only
  { id: 4, job_id: 2, type: 'Publish', platform: 'seek' },
  { id: 5, job_id: 2, type: 'Publish', platform: 'linkedin' },

  // Job 3 — Product Designer: internal pipeline only
  { id: 6, job_id: 3, type: 'Internal', platform: 'internal' },

  // Job 4 — DevOps Engineer
  { id: 7, job_id: 4, type: 'Internal', platform: 'internal' },

  // Job 5 — QA Automation Engineer
  { id: 8, job_id: 5, type: 'Internal', platform: 'internal' },

  // Job 6 — Talent Acquisition Specialist: Seek (Draft)
  { id: 9, job_id: 6, type: 'Publish', platform: 'seek' },

  // Job 7 — HR Business Partner
  { id: 10, job_id: 7, type: 'Internal', platform: 'internal' },

  // Job 8 — Marketing Content Writer
  { id: 11, job_id: 8, type: 'Internal', platform: 'internal' },

  // Job 9 — Junior Data Analyst
  { id: 12, job_id: 9, type: 'Internal', platform: 'internal' },

  // Job 10 — Mobile Engineer (React Native)
  { id: 13, job_id: 10, type: 'Internal', platform: 'internal' },
];

// mapping_job_sourcing_job: which job(s) each core_job_sourcing row is
// associated with. is_origin: true rows mirror what JobSourceModel.create()
// auto-seeds at runtime from job_post_id — one per sourcing row below, since
// each sourcing in job_sourcing.js now has a real job_post_id.
//
// One extra non-origin row is seeded (sourcing 3 → job 2) to exercise the
// many-to-many: sourcing 3 is a Seek posting published from job 1, but also
// manually linked to job 2 for candidate matching.
export const jobSourcingJobMapping = [
  { job_sourcing_id: 1, job_id: 1, is_origin: true },  // internal → Senior Frontend Engineer
  { job_sourcing_id: 2, job_id: 3, is_origin: true },  // internal → Product Designer
  { job_sourcing_id: 3, job_id: 1, is_origin: true },  // seek     → Senior Frontend Engineer
  { job_sourcing_id: 3, job_id: 2, is_origin: false }, // seek     → also manually linked to Backend Engineer
  { job_sourcing_id: 4, job_id: 2, is_origin: true },  // seek     → Backend Engineer (Node.js)
  { job_sourcing_id: 5, job_id: 6, is_origin: true },  // seek     → Talent Acquisition Specialist
  { job_sourcing_id: 6, job_id: 1, is_origin: true },  // linkedin → Senior Frontend Engineer
  { job_sourcing_id: 7, job_id: 2, is_origin: true },  // linkedin → Backend Engineer (Node.js)
];

export default { jobPosts, jobSourcingJobMapping };
