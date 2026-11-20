// Role tiers (same tier shape per company — see roles.js):
//   Admin   — full CRUD on every menu
//   Manager — read / create / update (no delete)
//   Staff   — read / create
//   Intern  — read only
//
// Derived from permissions.js's actual generated rows (not a contiguous
// module_menu id range), so removing/adding a menu never requires renumbering.
import permissions from './permissions.js';

let nextId = 1;
function rolePerms(role_id, allowedFuncs) {
  return permissions
    .filter((p) => allowedFuncs.includes(p.functionality))
    .map((p) => ({ id: nextId++, role_id, permission_id: p.id }));
}

export default [
  // Myralix (company 1)
  ...rolePerms(1, ['read', 'create', 'update', 'delete']), // Admin
  ...rolePerms(2, ['read', 'create', 'update']),            // Manager
  ...rolePerms(3, ['read', 'create']),                      // Staff
  ...rolePerms(4, ['read']),                                // Intern

  // Acme Recruiting (company 2) — independent grant set, same tiers
  ...rolePerms(6, ['read', 'create', 'update', 'delete']), // Admin
  ...rolePerms(7, ['read', 'create', 'update']),            // Manager
  ...rolePerms(8, ['read', 'create']),                      // Staff
  ...rolePerms(9, ['read']),                                // Intern
];
