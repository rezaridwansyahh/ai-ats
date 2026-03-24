import PermissionModel from "../../modules/permission/permission.model.js";

function checkPermission(moduleName, menuName, functionality, options = {}) {
  return async (req, res, next) => {
    try {
      // Get user's roles from the authenticated user
      const { role } = req.user; // roles is an array: [{id: 1, name: 'Admin'}, {id: 2, name: 'Employee'}]
            
      if (!role || role.length === 0) {
        return res.status(401).json({
          message: "Unauthorized: No role assigned"
        });
      }

      // Extract role IDs
      const roleIds = role.map(r => r.id);
      
      const hasPermission = await PermissionModel.checkPermissionMultipleRoles(
        roleIds,
        moduleName,
        menuName,
        functionality
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: `Access denied: You don't have '${functionality}' permission for ${menuName}`,
          required: {
            module: moduleName,
            menu: menuName,
            permission: functionality
          }
        });
      }
      
      // Check additional role restrictions
      if (options.allowedRoles && options.allowedRoles.length > 0) {
        const userRoleNames = role.map(r => r.name); // using role 'name' field
        const hasRequiredRole = options.allowedRoles.some(
          allowedRole => userRoleNames.includes(allowedRole)
        );

        if (!hasRequiredRole) {
          return res.status(403).json({
            message: `Access denied: This action requires one of these roles: ${options.allowedRoles.join(', ')}`,
            required: {
              roles: options.allowedRoles,
              userRoles: userRoleNames
            }
          });
        }
      }

      // User has permission, proceed to next middleware/controller
      next();
    } catch (err) {
      console.error('Permission check error:', err);
      res.status(500).json({ message: "Error checking permissions" });
    }
  };
}

export default checkPermission;