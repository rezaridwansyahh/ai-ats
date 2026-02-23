import Permission from '../model/PermissionModel.js';
import Role from '../model/RoleModel.js';

class PermissionController {

  static async getAll(req, res){
    try{
      const permissions = await Permission.getAll();

      res.status(200).json({
        message: 'List of Permissions',
        permissions
      });
    }catch(err){
      res.status(500).json({ message: err.message });
    }
  }

  static async getAllWithDetails(req, res) {
    try {
      const rows = await Permission.getAllWithDetails();

      const moduleMap = new Map();
      const modules   = [];

      for (const p of rows) {
        if (!moduleMap.has(p.module_id)) {
          moduleMap.set(p.module_id, { id: p.module_id, name: p.module_name, menus: [] });
          modules.push(moduleMap.get(p.module_id));
        }
        const mod = moduleMap.get(p.module_id);

        let menu = mod.menus.find(m => m.id === p.menu_id);
        if (!menu) {
          menu = { id: p.menu_id, name: p.menu_name, permissions: [] };
          mod.menus.push(menu);
        }

        menu.permissions.push({ id: p.permission_id, functionality: p.functionality });
      }

      res.status(200).json({ message: 'All permissions with details', modules });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

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

  static async create(req, res){
    const { module_menu_id, functionality } = req.body;

    try{
      const newPermission = await Permission.create(module_menu_id, functionality);

      res.status(201).json({
        message: "Permission created successfully",
        newPermission
      })
    }catch(err){
      res.status(500).json({ message: err.message });
    }
  }

  static async update(req, res){
    const { id } = req.params;
    
    const {module_menu_id, functionality} = req.body;

    const fields = {};

    if(module_menu_id) fields.module_menu_id = module_menu_id;
    if(functionality) fields.functionality = functionality;

    try{
      const updatedPermission = await Permission.update(id, fields);
      if(!updatedPermission){
        return res.status(404).json({ message: "Permission not found" });
      }

      res.status(200).json({
        message: "Permission updated successfully",
        updatedPermission
      })
    }catch(err){
      res.status(500).json({ message: err.message });
    }
  }

  static async delete(req, res){
    const { id } = req.params;

    try{
      const permission = await Permission.getById(id);

      if(!permission){
        return res.status(404).json({ message: "Permission not found" });
      }

      const deletedPermission = await Permission.delete(id);
      res.status(200).json({
        message: "Permission deleted successfully",
        deletedPermission
      })
    }catch(err){
      res.status(500).json({message: err.message });
    }
  }

}

export default PermissionController;