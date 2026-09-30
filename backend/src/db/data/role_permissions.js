// Role tiers:
//   Admin   (1) — full CRUD on every menu
//   Manager (2) — read / create / update (no delete)
//   Staff   (3) — read / create
//   Intern  (4) — read only
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
  ...rolePerms(1, ['read', 'create', 'update', 'delete']),
  ...rolePerms(2, ['read', 'create', 'update']),
  ...rolePerms(3, ['read', 'create']),
  ...rolePerms(4, ['read']),
];
