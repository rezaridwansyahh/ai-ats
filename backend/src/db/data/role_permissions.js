// Role tiers:
//   Admin   (1) — full CRUD on every menu
//   Manager (2) — read / create / update (no delete)
//   Staff   (3) — read / create
//   Intern  (4) — read only
//
// permissions.js generates ids as: (module_menu_id - 1) * 4 + offset
//   offset 1 = read, 2 = create, 3 = update, 4 = delete
const MENU_COUNT = 16;
const FUNC_OFFSET = { read: 1, create: 2, update: 3, delete: 4 };

let nextId = 1;
function rolePerms(role_id, allowed) {
  const out = [];
  for (let mm = 1; mm <= MENU_COUNT; mm++) {
    for (const fn of allowed) {
      const permission_id = (mm - 1) * 4 + FUNC_OFFSET[fn];
      out.push({ id: nextId++, role_id, permission_id });
    }
  }
  return out;
}

export default [
  ...rolePerms(1, ['read', 'create', 'update', 'delete']), // Admin
  ...rolePerms(2, ['read', 'create', 'update']),           // Manager
  ...rolePerms(3, ['read', 'create']),                     // Staff
  ...rolePerms(4, ['read']),                               // Intern
];
