// // 4 functionalities (read/create/update/delete) per module_menu, sequential ids.
// // Layout: permission_id = (module_menu_id - 1) * 4 + offset, where offset is 1..4.
// const FUNCS = ['read', 'create', 'update', 'delete'];
// const MENU_COUNT = 19;

// export default Array.from({ length: MENU_COUNT * FUNCS.length }, (_, i) => {
//   const module_menu_id = Math.floor(i / FUNCS.length) + 1;
//   const functionality  = FUNCS[i % FUNCS.length];
//   return { id: i + 1, module_menu_id, functionality };
// });


// 4 functionalities (read/create/update/delete) per module_menu, sequential ids.
// Layout: permission_id = (module_menu_id - 1) * 4 + offset, where offset is 1..4.
// permissions.js
const FUNCS = ['read', 'create', 'update', 'delete'];
const MENU_COUNT = 24; // total rows in module_menu.js (25 menus minus Report, which has no module link)

export default Array.from({ length: MENU_COUNT * FUNCS.length }, (_, i) => {
  const module_menu_id = Math.floor(i / FUNCS.length) + 1;
  const functionality  = FUNCS[i % FUNCS.length];
  return { id: i + 1, module_menu_id, functionality };
});