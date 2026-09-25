import Role from './role.model.js';
import User from '../user/user.model.js';
// import Permission from '../permission/permission.model.js'; // TODO: create permission module

class RoleService {
  async getAll(requesterIsSuperAdmin = false) {
    const roles = await Role.getAll();
    return requesterIsSuperAdmin ? roles : roles.filter(r => !r.is_system);
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
    const roles = await Role.getByPermissionId(permission_id);
    return { roles };
  }

  async create(name, additional) {
    if (!name) throw { status: 400, message: 'Role name is required' };
    return await Role.create(name, additional || null);
  }

  async setPermissions(id, permission_ids, requesterIsSuperAdmin = false) {
    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };

    if (role.is_system && !requesterIsSuperAdmin) {
      throw { status: 403, message: 'Cannot modify a system role' };
    }

    await Role.setRolePermissions(id, Array.isArray(permission_ids) ? permission_ids : []);
  }

  async update(id, fields, requesterIsSuperAdmin = false) {
    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: 'No fields provided for update' };
    }

    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };

    if (role.is_system && !requesterIsSuperAdmin) {
      throw { status: 403, message: 'Cannot modify a system role' };
    }

    return await Role.update(id, fields);
  }

  async delete(id, requesterIsSuperAdmin = false) {
    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };

    if (role.is_system && !requesterIsSuperAdmin) {
      throw { status: 403, message: 'Cannot delete a system role' };
    }

    await Role.delete(id);
    return role;
  }
}

export default new RoleService();