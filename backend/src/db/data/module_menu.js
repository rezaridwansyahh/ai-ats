// One row per (module, menu). id == menu_id keeps the join table 1:1 with menus.
export default [
  // Dashboard (module 1)
  { id: 1,  module_id: 1, menu_id: 1  }, // Dashboard

  // Sourcing (module 2)
  { id: 2,  module_id: 2, menu_id: 2  }, // Job Management
  { id: 3,  module_id: 2, menu_id: 3  }, // Source Management
  { id: 4,  module_id: 2, menu_id: 4  }, // Talent Pool
  { id: 5,  module_id: 2, menu_id: 5  }, // Source Candidate

  // Selection (module 3)
  { id: 6,  module_id: 3, menu_id: 6  }, // AI Matching
  { id: 7,  module_id: 3, menu_id: 7  }, // Assessment A
  { id: 8,  module_id: 3, menu_id: 8  }, // Assessment B
  { id: 9,  module_id: 3, menu_id: 9  }, // Report

  // Settings (module 4)
  { id: 10, module_id: 4, menu_id: 10 }, // User Management
  { id: 11, module_id: 4, menu_id: 11 }, // Role Management
  { id: 12, module_id: 4, menu_id: 12 }, // Integrations
  { id: 13, module_id: 4, menu_id: 13 }, // Account
  { id: 14, module_id: 4, menu_id: 14 }, // Recruiters
];
