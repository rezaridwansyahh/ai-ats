import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import UserModel from '../user/user.model.js';
import RoleModel from '../role/role.model.js';
import logger from '../../shared/utils/logger.js';
import PermissionModel from '../permission/permission.model.js';
import CompanyService from '../company/company.service.js';

class AuthService {
  async login(email, password) {
    if (!email || !password) throw { status: 400, message: 'Email and Password are required' };

    logger.info(`Login attempt: ${email}`);

    const user = await UserModel.getByEmail(email);
    if (!user) throw { status: 401, message: 'Invalid email or password' };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw { status: 401, message: 'Invalid email or password' };

    const role = await RoleModel.getByUserId(user.id);

    if (!role || role.length === 0) throw { status: 401, message: 'Unauthorize! No role assigned' };

    const isSuperAdmin = role.some(r => r.is_system === true);

    const roleIds = role.map(r => r.id);
    const {permissions} = await PermissionModel.checkPermissionsRoleId(roleIds);

    // JWT payload
    const payload = {
      user_id: user.id,
      email: user.email,
      company_id: user.company_id ?? null,
      role,
      isSuperAdmin
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    logger.info(`Login success: ${email}`);

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        company_id: user.company_id ?? null
      },
      role,
      permissions,
      isSuperAdmin
    };
  }

  // Public self-registration always creates a brand-new company (workspace)
  // with this user as its first member, made Admin so they can invite
  // teammates afterward. Joining an existing company happens via that
  // Admin's own invite flow (Settings > Team), never through this endpoint.
  async register(email, password, username, company_name) {
    if (!email || !password) throw { status: 400, message: 'Email and Password are required' };

    const trimmedCompanyName = (company_name || '').trim();
    if (!trimmedCompanyName) throw { status: 400, message: 'Company name is required' };

    const existingUser = await UserModel.getByEmail(email);
    if (existingUser) throw { status: 400, message: 'Email already exist' };

    let company;
    try {
      company = await CompanyService.create({ name: trimmedCompanyName });
    } catch (err) {
      if (err.code === '23505') throw { status: 400, message: 'A company with that name already exists' };
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await UserModel.create(email, hashedPassword, username, company.id);

    const roles = await RoleModel.getAllMasterRoles();
    const adminRole = roles.find((r) => r.name === 'Admin');
    if (!adminRole) throw { status: 500, message: 'Admin role not found — check role seed data' };
    await RoleModel.replaceUserRoles(newUser.id, [adminRole.id]);

    logger.info(`User registered: ${email}, new company "${company.name}" (id ${company.id})`);

    return {
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        company_id: company.id
      },
      company
    };
  }
}

export default new AuthService();