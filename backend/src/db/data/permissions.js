// 4 functionalities (read/create/update/delete) per module_menu row.
// Derived from module_menu.js's actual entries (not a contiguous id range) so
// removing/adding a menu there never requires renumbering anything here.
import moduleMenu from './module_menu.js';

const FUNCS = ['read', 'create', 'update', 'delete'];

export default moduleMenu.flatMap((mm, mmIndex) =>
  FUNCS.map((functionality, fnIndex) => ({
    id: mmIndex * FUNCS.length + fnIndex + 1,
    module_menu_id: mm.id,
    functionality,
  }))
);
