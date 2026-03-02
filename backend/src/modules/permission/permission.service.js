import PermissionModel from './permission.model.js';
import RoleModel from '../role/role.model.js';

class PermissionService {
  async getAll() {
    return await permission.getAll();
  }

  async getAllWithDetails() {
    const rows = await PermissionModel.getAllWithDetails();
    return this.#groupByModuleMenu(rows);
  }

  async getByIdDetails(id) {
    const permission = await PermissionModel.getByIdDetails(id);
    if (!permission) throw { status: 404, message: 'Permission not found' };
    return permission;
  }

  async getByRoleIdDetail(role_id) {
    const role = await RoleModel.getById(role_id);
    if (!role) throw { status: 404, message: 'Role not found' };

    const rows = await PermissionModel.getByRoleIdDetails(role_id);
    const modules = this.#groupByModuleMenu(rows);
    return { role, modules };
  }

  async create(module_menu_id, functionality) {
    return await PermissionModel.create(module_menu_id, functionality);
  }

  async update(id, fields) {
    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: 'No fields provided for update' };
    }

    const updatedPermission = await PermissionModel.update(id, fields);
    if (!updatedPermission) throw { status: 404, message: 'Permission not found' };
    return updatedPermission;
  }

  async delete(id) {
    const permission = await PermissionModel.getById(id);
    if (!permission) throw { status: 404, message: 'Permission not found' };

    return await Permission.delete(id);
  }

  #groupByModuleMenu(rows) {
    const modules = [];
    const moduleMap = new Map();

    for (const p of rows) {
      if (!moduleMap.has(p.module_id)) {
        moduleMap.set(p.module_id, { id: p.module_id, name: p.module_name, menus: [] });
        modules.push(moduleMap.get(p.module_id));
      }

      const mod = moduleMap.get(p.module_id);

      let menu = mod.menus.find(m => m.id === p.menu_id);
      if (!menu) {
        menu = { id: p.menu_id, name: p.menu_name, permissions: [] };
        mod.menus.push(menu);
      }

      menu.permissions.push({ id: p.permission_id, functionality: p.functionality });
    }

    return modules;
  }
}

export default new PermissionService();
