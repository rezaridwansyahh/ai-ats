import permissionService from './permission.service.js';

class PermissionController {
  async getAll(req, res) {
    try {
      const permissions = await permissionService.getAll();
      res.status(200).json({ message: 'List of Permissions', permissions });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getAllWithDetails(req, res) {
    try {
      const modules = await permissionService.getAllWithDetails();
      res.status(200).json({ message: 'All permissions with details', modules });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByIdDetails(req, res) {
    try {
      const permission = await permissionService.getByIdDetails(req.params.id);
      res.status(200).json({ message: 'Permission Details by Id', permission });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByRoleIdDetail(req, res) {
    try {
      const { role, modules } = await permissionService.getByRoleIdDetail(req.params.role_id);
      res.status(200).json({ message: 'List of Permission Details of this Role Id', role, modules });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { module_menu_id, functionality } = req.body;
      const newPermission = await permissionService.create(module_menu_id, functionality);
      res.status(201).json({ message: 'Permission created successfully', newPermission });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { module_menu_id, functionality } = req.body;
      const fields = {};
      if (module_menu_id) fields.module_menu_id = module_menu_id;
      if (functionality) fields.functionality = functionality;

      const updatedPermission = await permissionService.update(req.params.id, fields);
      res.status(200).json({ message: 'Permission updated successfully', updatedPermission });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const deletedPermission = await permissionService.delete(req.params.id);
      res.status(200).json({ message: 'Permission deleted successfully', deletedPermission });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new PermissionController();
