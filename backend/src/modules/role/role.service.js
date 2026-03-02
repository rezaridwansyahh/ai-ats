import Role from './role.model.js';
import User from '../user/user.model.js';
// import Permission from '../permission/permission.model.js'; // TODO: create permission module

class RoleService {
  async getAll() {
    return await Role.getAll();
  }

  async getById(id) {
    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };
    return role;
  }

  async getByUserId(user_id) {
    const user = await User.getById(user_id);
    if (!user) throw { status: 404, message: 'No User Found' };

    const roles = await Role.getByUserId(user_id);
    return { user, roles };
  }

  async getByPermissionId(permission_id) {
    // TODO: uncomment when permission module exists
    // const permission = await Permission.getById(permission_id);
    // if (!permission) throw { status: 404, message: 'No Permission found' };

    const roles = await Role.getByPermissionId(permission_id);
    return { roles };
  }

  async create(name, additional) {
    if (!name) throw { status: 400, message: 'Role name is required' };
    return await Role.create(name, additional || null);
  }

  async setPermissions(id, permission_ids) {
    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };

    await Role.setRolePermissions(id, Array.isArray(permission_ids) ? permission_ids : []);
  }

  async update(id, fields) {
    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: 'No fields provided for update' };
    }

    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };

    return await Role.update(id, fields);
  }

  async delete(id) {
    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };

    await Role.delete(id);
    return role;
  }
}

export default new RoleService();
