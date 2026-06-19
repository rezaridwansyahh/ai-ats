// Menu ids are unique — they back the primary key on master_menus and are
// referenced by mapping_modules_menus. The sidebar orders menus within a module
// by NAME (permission.model.js checkPermissionsRoleId → ORDER BY mo.name, me.name),
// so id order does not affect sidebar placement — grouping here is purely for readability.
export default [
  // Main module
  { id: 1,  name: 'Dashboard' },
  { id: 2,  name: 'Candidate Pipeline' },
  { id: 3,  name: 'Report Candidate' },

  // Sourcing module
  { id: 4,  name: 'Job Management' },
  { id: 5,  name: 'Source Management' },
  { id: 6,  name: 'Talent Pool' },
  { id: 7,  name: 'Search & Outreach' },
  { id: 8,  name: 'Assessment A' },
  { id: 9,  name: 'Assessment B' },
  { id: 10, name: 'Assessment C' },
  { id: 11, name: 'Assessment D' },
  { id: 12, name: 'Insights Discovery Assessment' },
  { id: 13, name: 'Thomas Kilmann Assessment' },

  // Selection module
  { id: 14, name: 'AI Screening' },
  { id: 15, name: 'Interview' },
  { id: 16, name: 'Psych Assessment' },
  { id: 17, name: 'Medical Assessment' },
  { id: 18, name: 'Background Check' },
  { id: 19, name: 'Report' },

  // Offer & Onboard module
  { id: 20, name: 'Offer & Contract' },
  { id: 21, name: 'Onboarding' },

  // Settings module
  { id: 22, name: 'User Management' },
  { id: 23, name: 'Role Management' },
  { id: 24, name: 'Integrations' },
  { id: 25, name: 'Account' },
  { id: 26, name: 'Recruiters' },
  { id: 27, name: 'Budget' }, // AI Budget Settings (Task 6.12b)
];