// Shared config for the onboarding-flow seed chain (00-05). Edit these once,
// then run the scripts in order — each one looks up the previous step's
// records BY NAME (company name, job title, applicant name), never by
// hardcoded numeric id, so you never have to copy-paste an id between steps.
//
// See README.md in this folder for the full run order and what each step does.

export const COMPANY = {
  name: 'Onboarding Demo Co',
  description: 'Demo tenant for exercising the full pipeline through to onboarding.',
  email: 'hello@onboarding-demo.example',
  website: 'https://onboarding-demo.example',
};

export const ROLE = {
  name: 'Admin',
  // Mirrors the "Admin" tier in role_permissions.js (full CRUD on every menu).
  functionalities: ['read', 'create', 'update', 'delete'],
};

export const USER = {
  email: 'admin@onboarding-demo.example',
  username: 'onboarding_admin',
  password: 'ChangeMe123!', // hashed before insert — never stored plain
};

export const JOB = {
  job_title: 'Senior Frontend Engineer',
  job_desc: 'Own the core web app — React 19, design system, performance.',
  job_location: 'Jakarta, Indonesia',
  work_option: 'Hybrid',       // On-site | Hybrid | Remote
  work_type: 'Full-time',      // Full-time | Part-time | Contract | Casual
  seniority_level: 'Senior',
  status: 'Active',            // Draft | Active | Running | Expired | Failed | Blocked
};

export const APPLICANT = {
  name: 'Nadia Kusuma',
  email: 'nadia.kusuma@example.com',
  last_position: 'Frontend Engineer',
  address: 'Jakarta, Indonesia',
  education: "Bachelor's in Computer Science",
};

export const ONBOARDING = {
  start_date: '2026-10-01', // candidate's first day
};
