import bcrypt from 'bcrypt';
import User from '../model/UserModel.js';
import Role from '../model/RoleModel.js';

class UserController {
  static async getAll(req, res) {
    try {
      const users = await User.getAll();

      res.status(200).json({ 
        message: "List all Users",
        users 
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getAllWithRoles(req, res) {
    try {
      // Get all users with their roles in one query
      const result = await User.getAllWithRoles();

      res.status(200).json({ 
        message: "List all Users with Roles",
        users: result
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getById(req, res) {
    const { id } = req.params;

    try {
      const user = await User.getById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json({
        message: "User details",
        user
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getByIdWithRoles(req, res) {
    const { id } = req.params;

    try {
      const user = await User.getById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const roles = await Role.getByUserId(id);

      res.status(200).json({
        message: "User details with roles",
        user: {
          ...user,
          roles
        }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async create(req, res) {
    const { email, password, username, role_ids } = req.body;

    try {
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const existingUser = await User.getByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await User.create(email, hashedPassword, username);

      if (Array.isArray(role_ids) && role_ids.length > 0) {
        await Role.replaceUserRoles(newUser.id, role_ids);
      }

      const roles = await Role.getByUserId(newUser.id);

      res.status(201).json({
        message: "User created successfully",
        user: { ...newUser, roles }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async delete(req, res) {
    const { id } = req.params;

    try {
      const user = await User.getById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await User.delete(id);

      res.status(200).json({ 
        message: 'User deleted successfully',
        user
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const { email, password, username, role_ids } = req.body;

    const fields = {};

    if (email) fields.email = email;
    if (password) fields.password = await bcrypt.hash(password, 12);
    if (username) fields.username = username;

    try {
      const user = await User.getById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let updatedUser = user;
      if (Object.keys(fields).length > 0) {
        updatedUser = await User.update(id, fields);
      }

      if (Array.isArray(role_ids)) {
        await Role.replaceUserRoles(id, role_ids);
      }

      const roles = await Role.getByUserId(id);

      res.status(200).json({
        message: 'User updated successfully',
        user: { ...updatedUser, roles }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getMasterRoles(req, res) {
    try {
      const roles = await Role.getAllMasterRoles();
      res.status(200).json({ message: "List all available roles", roles });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

export default UserController;