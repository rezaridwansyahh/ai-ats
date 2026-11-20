// Roles are company-scoped (see master_roles.company_id) except is_system
// rows (Super Admin), which are platform-wide and belong to no company.
// Each tenant gets its own independent Admin/Manager/Staff/Intern set — this
// mirrors what auth.service.js#register now creates for every real signup.
export default [
  // Myralix (company 1)
  { id: 1, name: "Admin",   additional: {}, company_id: 1 },
  { id: 2, name: "Manager", additional: {}, company_id: 1 },
  { id: 3, name: "Staff",   additional: {}, company_id: 1 },
  { id: 4, name: "Intern",  additional: { certificate: "UAA-XXXXXX" }, company_id: 1 },

  { id: 5, name: "Super Admin", additional: {}, is_system: true },

  // Acme Recruiting (company 2) — its own independent role set, never shared
  // with Myralix's roles above.
  { id: 6, name: "Admin",   additional: {}, company_id: 2 },
  { id: 7, name: "Manager", additional: {}, company_id: 2 },
  { id: 8, name: "Staff",   additional: {}, company_id: 2 },
  { id: 9, name: "Intern",  additional: {}, company_id: 2 },
];
