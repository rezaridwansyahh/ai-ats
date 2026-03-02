import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import UserModel from '../user/user.model.js';
import RoleModel from '../role/role.model.js';
import logger from '../../shared/utils/logger.js';
import PermissionModel from '../permission/permission.model.js';

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

    const roleIds = role.map(r => r.id);
    const {permissions} = await PermissionModel.checkPermissionsRoleId(roleIds);

    // JWT payload 
    const payload = {
      user_id: user.id,
      email: user.email,
      role
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
        email: user.email
      },
      role,
      permissions
    };
  }

  async register(email, password, username) {
    if (!email || !password ) throw { status: 400, message: 'Email and Password are required' };

    const existingUser = await UserModel.getByEmail(email);
    if (existingUser) throw { status: 400, message: 'Email already exist' };

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await UserModel.create(email, hashedPassword, username);

    logger.info(`User registered: ${email}`);

    return {
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email 
      }
    };
  }
}

export default new AuthService();