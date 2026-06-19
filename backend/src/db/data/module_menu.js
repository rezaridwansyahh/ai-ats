// One row per (module, menu). id == menu_id keeps the join table 1:1 with menus.
export default [
  { id: 1,  module_id: 1, menu_id: 1  }, // Dashboard
  { id: 2,  module_id: 2, menu_id: 2  }, // Candidate Pipeline
  { id: 3,  module_id: 1, menu_id: 22 }, // Report Candidate

  // Sourcing (module 2)
  { id: 4,  module_id: 2, menu_id: 3  }, // Job Management
  { id: 5,  module_id: 2, menu_id: 4  }, // Source Management
  { id: 6,  module_id: 2, menu_id: 5  }, // Talent Pool
  { id: 7,  module_id: 2, menu_id: 6  }, // Search & Outreach
  { id: 8,  module_id: 3, menu_id: 7  }, // Assessment A
  { id: 9,  module_id: 3, menu_id: 8  }, // Assessment B
  { id: 10, module_id: 3, menu_id: 9  }, // Assessment C
  { id: 11, module_id: 3, menu_id: 10 }, // Assessment D
  { id: 12, module_id: 3, menu_id: 18 }, // Insights Discovery Assessment
  { id: 13, module_id: 3, menu_id: 19 }, // Thomas Kilmann Assessment

  // Selection (module 4)
  { id: 14, module_id: 4, menu_id: 11 }, // AI Screening
  { id: 15, module_id: 4, menu_id: 12 }, // Report
  { id: 16, module_id: 4, menu_id: 20 }, // Interview

  // Settings (module 5)
  { id: 17, module_id: 5, menu_id: 13 }, // User Management
  { id: 18, module_id: 5, menu_id: 14 }, // Role Management
  { id: 19, module_id: 5, menu_id: 15 }, // Integrations
  { id: 20, module_id: 5, menu_id: 16 }, // Account
  { id: 21, module_id: 5, menu_id: 17 }, // Recruiters
  { id: 22, module_id: 5, menu_id: 21 }, // Budget (Task 6.12b)

  { id: 23, module_id: 4, menu_id: 21 }, // Psych Assessment
  { id: 24, module_id: 4, menu_id: 22 }, // Medical Assessment

  { id: 25, module_id: 4, menu_id: 23 }, // Background Check
  { id: 26, module_id: 6, menu_id: 24 }, // Offer & Contract
  { id: 27, module_id: 6, menu_id: 25 }, // Onboarding
];