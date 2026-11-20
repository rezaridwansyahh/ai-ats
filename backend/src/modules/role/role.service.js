import Role from './role.model.js';
import User from '../user/user.model.js';
// import Permission from '../permission/permission.model.js'; // TODO: create permission module

// Default role tiers every company gets at signup (and that the migration
// recreates per company for existing data) — Admin has full CRUD, each tier
// below drops one functionality. Kept here (not as DB template rows) so it's
// one place to read, not a second kind of special global row to reason about.
const DEFAULT_ROLE_TIERS = [
  { name: 'Admin',   functionalities: ['read', 'create', 'update', 'delete'] },
  { name: 'Manager', functionalities: ['read', 'create', 'update'] },
  { name: 'Staff',   functionalities: ['read', 'create'] },
  { name: 'Intern',  functionalities: ['read'] },
];

function assertOwnership(role, requesterCompanyId, requesterIsSuperAdmin) {
  if (requesterIsSuperAdmin) return;
  if (role.is_system) throw { status: 403, message: 'Cannot modify a system role' };
  if (role.company_id !== requesterCompanyId) {
    throw { status: 403, message: 'Cannot modify a role belonging to another company' };
  }
}

class RoleService {
  async getAll(company_id, requesterIsSuperAdmin = false) {
    const roles = await Role.getAll(company_id);
    return requesterIsSuperAdmin ? roles : roles.filter(r => !r.is_system);
  }

  async getAllAcrossCompanies() {
    return await Role.getAllAcrossCompanies();
  }

  async getById(id, requesterCompanyId, requesterIsSuperAdmin = false) {
    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };
    assertOwnership(role, requesterCompanyId, requesterIsSuperAdmin);
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

  async create(name, additional, company_id) {
    if (!name) throw { status: 400, message: 'Role name is required' };
    if (!company_id) throw { status: 400, message: 'company_id is required' };
    return await Role.create(name, additional || null, company_id);
  }

  async setPermissions(id, permission_ids, requesterCompanyId, requesterIsSuperAdmin = false) {
    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };
    assertOwnership(role, requesterCompanyId, requesterIsSuperAdmin);

    await Role.setRolePermissions(id, Array.isArray(permission_ids) ? permission_ids : []);
  }

  async update(id, fields, requesterCompanyId, requesterIsSuperAdmin = false) {
    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: 'No fields provided for update' };
    }

    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };
    assertOwnership(role, requesterCompanyId, requesterIsSuperAdmin);

    return await Role.update(id, fields);
  }

  async delete(id, requesterCompanyId, requesterIsSuperAdmin = false) {
    const role = await Role.getById(id);
    if (!role) throw { status: 404, message: 'Role not found' };
    assertOwnership(role, requesterCompanyId, requesterIsSuperAdmin);

    await Role.delete(id);
    return role;
  }

  // Creates this company's own Admin/Manager/Staff/Intern, reading the live
  // global_permissions catalog so a new tier automatically includes whatever
  // menus exist at signup time. Used by auth.service.js#register — every
  // company gets its own independent rows, never a shared one.
  async createDefaultRolesForCompany(company_id) {
    const allPermissions = await Role.getAllGlobalPermissions();
    const created = {};

    for (const tier of DEFAULT_ROLE_TIERS) {
      const role = await Role.create(tier.name, null, company_id);
      const permissionIds = allPermissions
        .filter((p) => tier.functionalities.includes(p.functionality))
        .map((p) => p.id);
      await Role.setRolePermissions(role.id, permissionIds);
      created[tier.name] = role;
    }

    return created;
  }
}

export default new RoleService();
