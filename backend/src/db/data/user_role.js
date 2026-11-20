export default [
  // Myralix (company 1)
  { id: 1, user_id: 1, role_id: 1 }, // User 1 -> Admin
  { id: 2, user_id: 2, role_id: 2 }, // User 2 -> Manager
  { id: 3, user_id: 3, role_id: 3 }, // User 3 -> Staff

  // Acme Recruiting (company 2) — its own roles, not Myralix's
  { id: 4, user_id: 4, role_id: 8 }, // User 4 -> Staff (company 2)
  { id: 5, user_id: 5, role_id: 9 }, // User 5 -> Intern (company 2)

  { id: 6, user_id: 6, role_id: 5 }, // User 6 -> Super Admin
];