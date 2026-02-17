// src/utils/permissions.js

/**
 * Check if user has a specific permission
 * @param {string} moduleName - e.g., "Users"
 * @param {string} menuName - e.g., "User List"
 * @param {string} functionality - e.g., "create", "read", "update", "delete"
 * @returns {boolean}
 */
export const hasPermission = (moduleName, menuName, functionality) => {
  try {
    const permissionsStr = localStorage.getItem('permissions');
    if (!permissionsStr) return false;
    
    const permissions = JSON.parse(permissionsStr);
    
    // Check if user has the specific permission
    return permissions.some(perm => 
      perm.module === moduleName &&
      perm.menu === menuName &&
      perm.functionality === functionality
    );
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Check if user has ANY of the specified permissions
 * @param {Array} permissionChecks - Array of {module, menu, functionality} objects
 * @returns {boolean}
 */
export const hasAnyPermission = (permissionChecks) => {
  return permissionChecks.some(check => 
    hasPermission(check.module, check.menu, check.functionality)
  );
};

/**
 * Check if user has ALL of the specified permissions
 * @param {Array} permissionChecks - Array of {module, menu, functionality} objects
 * @returns {boolean}
 */
export const hasAllPermissions = (permissionChecks) => {
  return permissionChecks.every(check => 
    hasPermission(check.module, check.menu, check.functionality)
  );
};

/**
 * Get all permissions for a specific module
 * @param {string} moduleName
 * @returns {Array}
 */
export const getModulePermissions = (moduleName) => {
  try {
    const permissionsStr = localStorage.getItem('permissions');
    if (!permissionsStr) return [];
    
    const permissions = JSON.parse(permissionsStr);
    return permissions.filter(perm => perm.module === moduleName);
  } catch (error) {
    console.error('Error getting module permissions:', error);
    return [];
  }
};

/**
 * Get all unique modules that user has access to
 * @returns {Array} Array of unique module names
 */
export const getUserModules = () => {
  try {
    const permissionsStr = localStorage.getItem('permissions');
    if (!permissionsStr) return [];
    
    const permissions = JSON.parse(permissionsStr);
    const modules = [...new Set(permissions.map(perm => perm.module))];
    return modules;
  } catch (error) {
    console.error('Error getting user modules:', error);
    return [];
  }
};

/**
 * Get all menus for a specific module that user has access to
 * @param {string} moduleName
 * @returns {Array} Array of unique menu names
 */
export const getModuleMenus = (moduleName) => {
  try {
    const permissionsStr = localStorage.getItem('permissions');
    if (!permissionsStr) return [];
    
    const permissions = JSON.parse(permissionsStr);
    const menus = [...new Set(
      permissions
        .filter(perm => perm.module === moduleName)
        .map(perm => perm.menu)
    )];
    return menus;
  } catch (error) {
    console.error('Error getting module menus:', error);
    return [];
  }
};

/**
 * Get structured permissions grouped by module
 * @returns {Array} Array of {module, menus: []} objects
 */
export const getStructuredPermissions = () => {
  try {
    const permissionsStr = localStorage.getItem('permissions');
    if (!permissionsStr) return [];
    
    const permissions = JSON.parse(permissionsStr);
    
    // Group by module
    const grouped = {};
    permissions.forEach(perm => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = {
          module: perm.module,
          menus: []
        };
      }
      
      // Find or create menu
      let menu = grouped[perm.module].menus.find(m => m.menu === perm.menu);
      if (!menu) {
        menu = { menu: perm.menu, permissions: [] };
        grouped[perm.module].menus.push(menu);
      }
      
      // Add functionality if not already there
      if (!menu.permissions.includes(perm.functionality)) {
        menu.permissions.push(perm.functionality);
      }
    });
    
    return Object.values(grouped);
  } catch (error) {
    console.error('Error getting structured permissions:', error);
    return [];
  }
};

/**
 * Clear all stored permissions (useful for logout)
 */
export const clearPermissions = () => {
  localStorage.removeItem('permissions');
};