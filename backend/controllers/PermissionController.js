import Permission from '../model/PermissionModel.js';
import Role from '../model/RoleModel.js';

class PermissionController {
  static async getByIdDetails(req, res) {
    const { id } = req.params;

    try {
      const permission = await Permission.getByIdDetails(id);

      if (!permission) {
        return res.status(404).json({ message: "Permission not found" });
      }

      res.status(200).json({ 
        message: "Permission Details by Id",
        permission 
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getByRoleIdDetail(req, res) {
    const { role_id } = req.params;

    try {
      const role = await Role.getById(role_id);

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      const permissions = await Permission.getByRoleIdDetails(role_id);

      // Group by module → menu → permissions
      const modules = [];
      const moduleMap = new Map();

      for (const p of permissions) {
        // Check if module already exists
        if (!moduleMap.has(p.module_id)) {
          moduleMap.set(p.module_id, {
            id: p.module_id,
            name: p.module_name,
            menus: []
          });
          modules.push(moduleMap.get(p.module_id));
        }

        const module = moduleMap.get(p.module_id);

        // Check if menu already exists inside this module
        let menu = module.menus.find(m => m.id === p.menu_id);
        if (!menu) {
          menu = {
            id: p.menu_id,
            name: p.menu_name,
            permissions: []
          };
          module.menus.push(menu);
        }

        // Add permission functionality
        menu.permissions.push({
          id: p.permission_id,
          functionality: p.functionality
        });
      }

      res.status(200).json({
        message: "List of Permission Details of this Role Id",
        role,
        modules
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

}

export default PermissionController;