import userService from './user.service.js';

class UserController {
  async getAll(req, res) {
    try {
      const users = await userService.getAll();
      res.status(200).json({ message: "List all Users", users });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getAllWithRoles(req, res) {
    try {
      const users = await userService.getAllWithRoles();
      res.status(200).json({ message: "List all Users with Roles", users });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const user = await userService.getById(req.params.id);
      res.status(200).json({ message: "User details", user });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByIdWithRoles(req, res) {
    try {
      const user = await userService.getByIdWithRoles(req.params.id);
      res.status(200).json({ message: "User details with roles", user });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { email, password, username, role_ids, company_id } = req.body;
      const user = await userService.create(email, password, username, role_ids, company_id);
      res.status(201).json({ message: "User created successfully", user });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const user = await userService.update(req.params.id, req.body);
      res.status(200).json({ message: 'User updated successfully', user });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const user = await userService.delete(req.params.id);
      res.status(200).json({ message: 'User deleted successfully', user });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getMasterRoles(req, res) {
    try {
      const roles = await userService.getMasterRoles();
      res.status(200).json({ message: "List all available roles", roles });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new UserController();
