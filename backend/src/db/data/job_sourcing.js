// Dummy seed data for core_job_sourcing + parents (master_job_account, core_job)
// job_post is NOT seeded — those are created through the SaaS publish flow
// Focus: platforms seek, linkedin, internal

// Default AI-Screening rubric — Myralix jobs use this. Weights sum to 100.
const DEFAULT_RUBRIC = {
  fixed_criteria: {
    skills:            { weight: 45 },
    experience:        { weight: 35 },
    career_trajectory: { weight: 15 },
    education:         { weight: 5 },
  },
  custom_criteria: [],
};

// Skills-heavy variant — Acme jobs use this. Weights sum to 100.
const SKILLS_HEAVY_RUBRIC = {
  fixed_criteria: {
    skills:            { weight: 60 },
    experience:        { weight: 25 },
    career_trajectory: { weight: 10 },
    education:         { weight: 5 },
  },
  custom_criteria: [],
};

// Multi-tenancy split:
//   user 1 + user 2 → company 1 (Myralix)
//   user 4          → company 2 (Acme Recruiting)
export const jobAccounts = [
  { id: 1, portal_name: 'seek',     email: 'recruiter.seek@example.com',     password: 'dummy_encrypted_seek_pw',     user_id: 1, company_id: 1, status_connection: 'Connected',     status_sync: 'Sync' },
  { id: 2, portal_name: 'linkedin', email: 'recruiter.linkedin@example.com', password: 'dummy_encrypted_linkedin_pw', user_id: 1, company_id: 1, status_connection: 'Connected',     status_sync: 'Sync' },
  { id: 3, portal_name: 'seek',     email: 'recruiter2.seek@example.com',    password: 'dummy_encrypted_seek2_pw',    user_id: 2, company_id: 1, status_connection: 'Not Connected', status_sync: 'Not Sync' },
  { id: 4, portal_name: 'linkedin', email: 'acme.linkedin@example.com',      password: 'dummy_encrypted_acme_pw',     user_id: 4, company_id: 2, status_connection: 'Connected',     status_sync: 'Sync' },
];

// Multi-tenancy split for testing:
//   company 1 (Myralix)         → ids 1, 2, 3, 6, 8     (3 active engineering + 2 drafts)
//   company 2 (Acme Recruiting) → ids 4, 5, 7, 9, 10    (2 active + 3 drafts)
// Both tenants get a mix of statuses so each can drive AI Matching + Pipeline.
export const coreJobs = [
  // --- Active jobs ---
  {
    id: 1, company_id: 1, job_title: 'Senior Frontend Engineer',
    job_desc: 'Build React applications for a modern ATS platform.',
    job_location: 'Jakarta, Indonesia', work_option: 'Hybrid', work_type: 'Full-time',
    pay_type: 'Annually', currency: 'IDR', pay_min: 180000000, pay_max: 240000000, pay_display: 'Show', status: 'Active',
    required_skills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Git'],
    preferred_skills: ['Next.js', 'Tailwind CSS', 'Redux', 'Vite', 'Jest'],
    rubric: DEFAULT_RUBRIC,
  },
  {
    id: 2, company_id: 1, job_title: 'Backend Engineer (Node.js)',
    job_desc: 'Design and maintain Node.js services, PostgreSQL, and RPA flows.',
    job_location: 'Bali, Indonesia', work_option: 'Remote', work_type: 'Full-time',
    pay_type: 'Annually', currency: 'IDR', pay_min: 160000000, pay_max: 220000000, pay_display: 'Show', status: 'Active',
    required_skills: ['Node.js', 'JavaScript', 'PostgreSQL', 'REST APIs', 'Git'],
    preferred_skills: ['Express', 'Docker', 'Redis', 'GraphQL', 'AWS'],
    rubric: DEFAULT_RUBRIC,
  },
  {
    id: 3, company_id: 1, job_title: 'Product Designer',
    job_desc: 'Own the product design system and user flows for the ATS.',
    job_location: 'Singapore', work_option: 'On-site', work_type: 'Full-time',
    pay_type: 'Annually', currency: 'SGD', pay_min: 70000, pay_max: 95000, pay_display: 'Hide', status: 'Active',
    required_skills: ['Figma', 'UI/UX Design', 'Prototyping', 'Design Systems'],
    preferred_skills: ['Adobe XD', 'Sketch', 'User Research', 'Accessibility'],
    rubric: DEFAULT_RUBRIC,
  },
  {
    id: 4, company_id: 2, job_title: 'DevOps Engineer',
    job_desc: 'Own CI/CD, observability, and infra for the ATS platform.',
    job_location: 'Jakarta, Indonesia', work_option: 'Remote', work_type: 'Full-time',
    pay_type: 'Annually', currency: 'IDR', pay_min: 200000000, pay_max: 270000000, pay_display: 'Show', status: 'Active',
    required_skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform'],
    preferred_skills: ['GitHub Actions', 'Prometheus', 'Grafana', 'Ansible'],
    rubric: SKILLS_HEAVY_RUBRIC,
  },
  {
    id: 5, company_id: 2, job_title: 'QA Automation Engineer',
    job_desc: 'Build and maintain automated test suites across frontend and backend.',
    job_location: 'Surabaya, Indonesia', work_option: 'Hybrid', work_type: 'Full-time',
    pay_type: 'Monthly', currency: 'IDR', pay_min: 15000000, pay_max: 22000000, pay_display: 'Show', status: 'Active',
    required_skills: ['Cypress', 'Selenium', 'JavaScript', 'Test Automation', 'Git'],
    preferred_skills: ['Playwright', 'Jest', 'Postman', 'CI/CD'],
    rubric: SKILLS_HEAVY_RUBRIC,
  },

  // --- Draft jobs ---
  {
    id: 6, company_id: 1, job_title: 'Talent Acquisition Specialist',
    job_desc: 'Source and screen candidates across multiple platforms.',
    job_location: 'Sydney, Australia', work_option: 'Hybrid', work_type: 'Full-time',
    pay_type: 'Annually', currency: 'AUD', pay_min: 80000, pay_max: 110000, pay_display: 'Show', status: 'Draft',
    required_skills: ['Recruiting', 'Sourcing', 'LinkedIn Recruiter', 'Interviewing'],
    preferred_skills: ['ATS Tools', 'Boolean Search', 'Employer Branding'],
  },
  {
    id: 7, company_id: 2, job_title: 'HR Business Partner',
    job_desc: 'Partner with leaders on people strategy and org health.',
    job_location: 'Kuala Lumpur, Malaysia', work_option: 'On-site', work_type: 'Full-time',
    pay_type: 'Annually', currency: 'MYR', pay_min: 120000, pay_max: 160000, pay_display: 'Hide', status: 'Draft',
    required_skills: ['HR Strategy', 'Employee Relations', 'Performance Management', 'Communication'],
    preferred_skills: ['Compensation', 'Workday', 'Change Management'],
  },
  {
    id: 8, company_id: 1, job_title: 'Marketing Content Writer',
    job_desc: 'Produce blog posts, case studies, and social copy.',
    job_location: 'Bangkok, Thailand', work_option: 'Remote', work_type: 'Contract',
    pay_type: 'Monthly', currency: 'THB', pay_min: 60000, pay_max: 85000, pay_display: 'Show', status: 'Draft',
    required_skills: ['Content Writing', 'SEO', 'Editing', 'Storytelling'],
    preferred_skills: ['WordPress', 'Google Analytics', 'HubSpot', 'B2B SaaS'],
  },
  {
    id: 9, company_id: 2, job_title: 'Junior Data Analyst',
    job_desc: 'Support reporting and analytics across recruiting funnels.',
    job_location: 'Manila, Philippines', work_option: 'Hybrid', work_type: 'Part-time',
    pay_type: 'Hourly', currency: 'PHP', pay_min: 450, pay_max: 650, pay_display: 'Show', status: 'Draft',
    required_skills: ['SQL', 'Excel', 'Data Visualization', 'Analytical Thinking'],
    preferred_skills: ['Python', 'Tableau', 'Power BI', 'Looker'],
  },
  {
    id: 10, company_id: 2, job_title: 'Mobile Engineer (React Native)',
    job_desc: 'Build the mobile companion app for recruiters on the go.',
    job_location: 'Ho Chi Minh, Vietnam', work_option: 'Remote', work_type: 'Full-time',
    pay_type: 'Annually', currency: 'USD', pay_min: 45000, pay_max: 65000, pay_display: 'Hide', status: 'Draft',
    required_skills: ['React Native', 'JavaScript', 'TypeScript', 'iOS', 'Android'],
    preferred_skills: ['Redux', 'Expo', 'Native Modules', 'Fastlane'],
  },
];

export const jobSourcing = [
  // --- Internal sourcing (no external account needed) ---
  { id: 1, account_id: null, job_post_id: null, job_title: 'Senior Frontend Engineer', platform: 'internal', platform_job_id: 'INT-0001', status: 'Active',  last_sync: null },
  { id: 2, account_id: null, job_post_id: null, job_title: 'Product Designer',          platform: 'internal', platform_job_id: 'INT-0002', status: 'Active',  last_sync: null },

  // --- Seek sourcing ---
  { id: 3, account_id: 1, job_post_id: null, job_title: 'Senior Frontend Engineer',     platform: 'seek', platform_job_id: 'SEEK-10001', status: 'Active',  last_sync: '2026-04-10 09:15:00' },
  { id: 4, account_id: 1, job_post_id: null, job_title: 'Backend Engineer (Node.js)',   platform: 'seek', platform_job_id: 'SEEK-10002', status: 'Running', last_sync: '2026-04-11 14:30:00' },
  { id: 5, account_id: 3, job_post_id: null, job_title: 'Talent Acquisition Specialist', platform: 'seek', platform_job_id: 'SEEK-10003', status: 'Draft',   last_sync: null },

  // --- LinkedIn sourcing ---
  { id: 6, account_id: 2, job_post_id: null, job_title: 'Senior Frontend Engineer',     platform: 'linkedin', platform_job_id: 'LI-20001', status: 'Active',  last_sync: '2026-04-10 10:00:00' },
  { id: 7, account_id: 2, job_post_id: null, job_title: 'Backend Engineer (Node.js)',   platform: 'linkedin', platform_job_id: 'LI-20002', status: 'Expired', last_sync: '2026-03-20 08:45:00' },
];

export default { jobAccounts, coreJobs, jobSourcing };
