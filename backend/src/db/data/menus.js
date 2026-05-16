// Menu ids are sequential (1-17) and grouped by module so that ORDER BY id
// matches the desired sidebar order. Ids must be unique — they back the
// primary key on master_menus and are referenced by mapping_modules_menus.
export default [
  // Main / Dashboard module
  { id: 1,  name: 'Dashboard' },
  { id: 2,  name: 'Candidate Pipeline' },

  // Sourcing module
  { id: 3,  name: 'Job Management' },
  { id: 4,  name: 'Source Management' },
  { id: 5,  name: 'Talent Pool' },
  { id: 6,  name: 'Source Candidate' },

  // Asesmen module
  { id: 7,  name: 'Assessment A' },
  { id: 8,  name: 'Assessment B' },
  { id: 9,  name: 'Assessment C' },
  { id: 10, name: 'Assessment D' },

  // Selection module
  { id: 11, name: 'AI Screening' },
  { id: 12, name: 'Report' },

  // Settings module
  { id: 13, name: 'User Management' },
  { id: 14, name: 'Role Management' },
  { id: 15, name: 'Integrations' },
  { id: 16, name: 'Account' },
  { id: 17, name: 'Recruiters' },
];
