import bcrypt from 'bcrypt';
import User from './user.model.js';
import Role from '../role/role.model.js';

class UserService {
  async getAll() {
    return await User.getAll();
  }

  async getAllWithRoles() {
    return await User.getAllWithRoles();
  }

  async getById(id) {
    const user = await User.getById(id);
    if (!user) throw { status: 404, message: 'User not found' };
    return user;
  }

  async getByIdWithRoles(id) {
    const user = await User.getById(id);
    if (!user) throw { status: 404, message: 'User not found' };

    const roles = await Role.getByUserId(id);
    return { ...user, roles };
  }

  async create(email, password, username, role_ids) {
    if (!email || !password) {
      throw { status: 400, message: 'Email and password are required' };
    }

    const existingUser = await User.getByEmail(email);
    if (existingUser) throw { status: 400, message: 'Email already exists' };

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create(email, hashedPassword, username);

    if (Array.isArray(role_ids) && role_ids.length > 0) {
      await Role.replaceUserRoles(newUser.id, role_ids);
    }

    const roles = await Role.getByUserId(newUser.id);
    return { ...newUser, roles };
  }

  async update(id, { email, password, username, role_ids }) {
    const user = await User.getById(id);
    if (!user) throw { status: 404, message: 'User not found' };

    const fields = {};
    if (email) fields.email = email;
    if (password) fields.password = await bcrypt.hash(password, 12);
    if (username) fields.username = username;

    let updatedUser = user;
    if (Object.keys(fields).length > 0) {
      updatedUser = await User.update(id, fields);
    }

    if (Array.isArray(role_ids)) {
      await Role.replaceUserRoles(id, role_ids);
    }

    const roles = await Role.getByUserId(id);
    return { ...updatedUser, roles };
  }

  async delete(id) {
    const user = await User.getById(id);
    if (!user) throw { status: 404, message: 'User not found' };

    await User.delete(id);
    return user;
  }

  async getMasterRoles() {
    return await Role.getAllMasterRoles();
  }
}

export default new UserService();
