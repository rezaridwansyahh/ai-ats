// // Menu ids are unique — they back the primary key on master_menus and are
// // referenced by mapping_modules_menus. Ids 1-17 are declared grouped by module;
// // ids 18-19 (Insights Discovery / Thomas Kilmann Assessment) are appended to the
// // Asesmen module without renumbering. The sidebar orders menus within a module by NAME
// // (permission.model.js checkPermissionsRoleId → ORDER BY mo.name, me.name),
// // so id order does not affect sidebar placement.
// export default [
//   // Main / Dashboard module
//   { id: 1,  name: 'Dashboard' },
//   { id: 2,  name: 'Candidate Pipeline' },

//   // Sourcing module
//   { id: 3,  name: 'Job Management' },
//   { id: 4,  name: 'Source Management' },
//   { id: 5,  name: 'Talent Pool' },
//   { id: 6,  name: 'Source Candidate' },

//   // Asesmen module
//   { id: 7,  name: 'Assessment A' },
//   { id: 8,  name: 'Assessment B' },
//   { id: 9,  name: 'Assessment C' },
//   { id: 10, name: 'Assessment D' },
//   { id: 18, name: 'Insights Discovery Assessment' }, // appended to Asesmen (see header note)
//   { id: 19, name: 'Thomas Kilmann Assessment' },     // appended to Asesmen (see header note)

//   // Selection module
//   { id: 11, name: 'AI Screening' },
//   { id: 12, name: 'Report' },

//   // Settings module
//   { id: 13, name: 'User Management' },
//   { id: 14, name: 'Role Management' },
//   { id: 15, name: 'Integrations' },
//   { id: 16, name: 'Account' },
//   { id: 17, name: 'Recruiters' },
// ];


export default [
  { id: 1,  name: 'Dashboard' },
  { id: 2,  name: 'Candidate Pipeline' },
  { id: 3,  name: 'Job Management' },
  { id: 4,  name: 'Source Management' },
  { id: 5,  name: 'Talent Pool' },
  { id: 6,  name: 'Search & Outreach' },
  { id: 7,  name: 'Assessment A' },
  { id: 8,  name: 'Assessment B' },
  { id: 9,  name: 'Assessment C' },
  { id: 10, name: 'Assessment D' },
  { id: 18, name: 'Insights Discovery Assessment' },
  { id: 19, name: 'Thomas Kilmann Assessment' },
  { id: 11, name: 'AI Screening' },
  { id: 20, name: 'Interview' },
  { id: 21, name: 'Psych Assessment' },
  { id: 22, name: 'Medical Assessment' },
  { id: 23, name: 'Background Check' },
  { id: 13, name: 'User Management' },
  { id: 14, name: 'Role Management' },
  { id: 15, name: 'Integrations' },
  { id: 16, name: 'Account' },
  { id: 17, name: 'Recruiters' },
  { id: 12, name: 'Report' },
  { id: 24, name: 'Offer & Contract' },
  { id: 25, name: 'Onboarding' },
];