// One row per (module, menu). id == menu_id keeps the join table 1:1 with menus.
export default [
  // Main / Dashboard (module 1)
  { id: 1,  module_id: 1, menu_id: 1  }, // Dashboard
  { id: 2,  module_id: 1, menu_id: 2  }, // Candidate Pipeline
  { id: 2,  module_id: 1, menu_id: 2  }, // Candidate Pipeline

  // Sourcing (module 2)
  { id: 3,  module_id: 2, menu_id: 3  }, // Job Management
  { id: 4,  module_id: 2, menu_id: 4  }, // Source Management
  { id: 5,  module_id: 2, menu_id: 5  }, // Talent Pool
  { id: 6,  module_id: 2, menu_id: 6  }, // Source Candidate
  { id: 3,  module_id: 2, menu_id: 3  }, // Job Management
  { id: 4,  module_id: 2, menu_id: 4  }, // Source Management
  { id: 5,  module_id: 2, menu_id: 5  }, // Talent Pool
  { id: 6,  module_id: 2, menu_id: 6  }, // Source Candidate

  // Selection (module 3)
  { id: 7,  module_id: 3, menu_id: 7  }, // AI Matching
  { id: 8,  module_id: 3, menu_id: 8  }, // Assessment A
  { id: 9,  module_id: 3, menu_id: 9  }, // Assessment B
  { id: 10, module_id: 3, menu_id: 10 }, // Assessment C
  { id: 11, module_id: 3, menu_id: 11 }, // Assessment D
  { id: 12, module_id: 3, menu_id: 12 }, // Report

  // Settings (module 4)
  { id: 13, module_id: 4, menu_id: 13 }, // User Management
  { id: 14, module_id: 4, menu_id: 14 }, // Role Management
  { id: 15, module_id: 4, menu_id: 15 }, // Integrations
  { id: 16, module_id: 4, menu_id: 16 }, // Account
  { id: 17, module_id: 4, menu_id: 17 }, // Recruiters
];
