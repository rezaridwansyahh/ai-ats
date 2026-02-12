export default [
  // Users -> User List (module_menu_id: 1)
  { id: 1, module_menu_id: 1, functionality: 'read' },
  { id: 2, module_menu_id: 1, functionality: 'update' },
  { id: 3, module_menu_id: 1, functionality: 'delete' },

  // Users -> Add User (module_menu_id: 2)
  { id: 4, module_menu_id: 2, functionality: 'create' },

  // Products -> All Products (module_menu_id: 3)
  { id: 5, module_menu_id: 3, functionality: 'read' },
  { id: 6, module_menu_id: 3, functionality: 'update' },
  { id: 7, module_menu_id: 3, functionality: 'delete' },

  // Products -> Add New (module_menu_id: 4)
  { id: 8, module_menu_id: 4, functionality: 'create' },

  // Products -> Categories (module_menu_id: 5)
  { id: 9, module_menu_id: 5, functionality: 'read' },
  { id: 10, module_menu_id: 5, functionality: 'update' },

  // Documents -> Company List (module_menu_id: 6)
  { id: 11, module_menu_id: 6, functionality: 'read' },
  { id: 12, module_menu_id: 6, functionality: 'export' },

  // Reports -> Analytics (module_menu_id: 7)
  { id: 13, module_menu_id: 7, functionality: 'read' },

  // Reports -> Exports (module_menu_id: 8)
  { id: 14, module_menu_id: 8, functionality: 'export' },

  // Settings -> Schedule (module_menu_id: 9)
  { id: 15, module_menu_id: 9, functionality: 'read' },
  { id: 16, module_menu_id: 9, functionality: 'update' },
];
