// 4 functionalities (read/create/update/delete) per module_menu, sequential ids.
// Layout: permission_id = (module_menu_id - 1) * 4 + offset, where offset is 1..4.
const FUNCS = ['read', 'create', 'update', 'delete'];
const MENU_COUNT = 14;

export default Array.from({ length: MENU_COUNT * FUNCS.length }, (_, i) => {
  const module_menu_id = Math.floor(i / FUNCS.length) + 1;
  const functionality  = FUNCS[i % FUNCS.length];
  return { id: i + 1, module_menu_id, functionality };
});
