export default [

/* ============================================================================
   ADMIN (role_id: 1) → FULL ACCESS
============================================================================ */
...Array.from({ length: 55 }, (_, i) => ({
  id: i + 1,
  role_id: 1,
  permission_id: i + 1
})),

/* ============================================================================
   MANAGER (role_id: 2)
   read / create / update / export
============================================================================ */

  // Positions -> Add Positions (1–4)
  { id: 100, role_id: 2, permission_id: 1 }, // read
  { id: 101, role_id: 2, permission_id: 2 }, // create
  { id: 102, role_id: 2, permission_id: 3 }, // update

  // Positions -> Positions List (5–8)
  { id: 103, role_id: 2, permission_id: 5 },
  { id: 104, role_id: 2, permission_id: 6 },
  { id: 105, role_id: 2, permission_id: 7 },

  // Applicants -> Applicant List (9–12)
  { id: 106, role_id: 2, permission_id: 9 },
  { id: 107, role_id: 2, permission_id: 10 },
  { id: 108, role_id: 2, permission_id: 11 },

  // Applicants -> Crawl Applicants (13–16)
  { id: 109, role_id: 2, permission_id: 13 },
  { id: 110, role_id: 2, permission_id: 14 },
  { id: 111, role_id: 2, permission_id: 15 },

  // Reports -> Analytics (17–20)
  { id: 112, role_id: 2, permission_id: 17 },
  { id: 113, role_id: 2, permission_id: 18 },
  { id: 114, role_id: 2, permission_id: 19 },

  // Reports -> Exports (21–22)
  { id: 115, role_id: 2, permission_id: 21 }, // read
  { id: 116, role_id: 2, permission_id: 22 }, // export

  // Settings -> General (23–26)
  { id: 117, role_id: 2, permission_id: 23 },
  { id: 118, role_id: 2, permission_id: 24 },
  { id: 119, role_id: 2, permission_id: 25 },

  // Settings -> Company List (27–30)
  { id: 120, role_id: 2, permission_id: 27 },
  { id: 121, role_id: 2, permission_id: 28 },
  { id: 122, role_id: 2, permission_id: 29 },

  // Settings -> Help (31)
  { id: 123, role_id: 2, permission_id: 31 },

  // Settings -> Integrations (32–35)
  { id: 124, role_id: 2, permission_id: 32 },
  { id: 125, role_id: 2, permission_id: 33 },
  { id: 126, role_id: 2, permission_id: 34 },

  // Users -> User Management (36–39)
  { id: 127, role_id: 2, permission_id: 36 },
  { id: 128, role_id: 2, permission_id: 37 },
  { id: 129, role_id: 2, permission_id: 38 },

  // Users -> Role Management (40–43)
  { id: 130, role_id: 2, permission_id: 40 },
  { id: 131, role_id: 2, permission_id: 41 },
  { id: 132, role_id: 2, permission_id: 42 },

  // Job Postings -> Seek (44–47) read/create/update
  { id: 133, role_id: 2, permission_id: 44 },
  { id: 134, role_id: 2, permission_id: 45 },
  { id: 135, role_id: 2, permission_id: 46 },

  // Job Postings -> LinkedIn (48–51) read/create/update
  { id: 136, role_id: 2, permission_id: 48 },
  { id: 137, role_id: 2, permission_id: 49 },
  { id: 138, role_id: 2, permission_id: 50 },

  // Job Postings -> Account (52–55) read/create/update
  { id: 139, role_id: 2, permission_id: 52 },
  { id: 140, role_id: 2, permission_id: 53 },
  { id: 141, role_id: 2, permission_id: 54 },

/* ============================================================================
   STAFF (role_id: 3)
   read + create only
============================================================================ */

  // Positions
  { id: 200, role_id: 3, permission_id: 1 },
  { id: 201, role_id: 3, permission_id: 2 },
  { id: 202, role_id: 3, permission_id: 5 },
  { id: 203, role_id: 3, permission_id: 6 },

  // Applicants
  { id: 204, role_id: 3, permission_id: 9 },
  { id: 205, role_id: 3, permission_id: 10 },
  { id: 206, role_id: 3, permission_id: 13 },
  { id: 207, role_id: 3, permission_id: 14 },

  // Reports
  { id: 208, role_id: 3, permission_id: 17 },
  { id: 209, role_id: 3, permission_id: 18 },

  // Settings
  { id: 210, role_id: 3, permission_id: 23 },
  { id: 211, role_id: 3, permission_id: 24 },
  { id: 212, role_id: 3, permission_id: 27 },
  { id: 213, role_id: 3, permission_id: 28 },
  { id: 214, role_id: 3, permission_id: 31 },

  // Settings -> Integrations (read + create)
  { id: 215, role_id: 3, permission_id: 32 },
  { id: 216, role_id: 3, permission_id: 33 },

  // Users (read only)
  { id: 217, role_id: 3, permission_id: 36 },

  // Role Management (read only)
  { id: 218, role_id: 3, permission_id: 40 },

  // Job Postings -> Seek (read + create)
  { id: 219, role_id: 3, permission_id: 44 },
  { id: 220, role_id: 3, permission_id: 45 },

  // Job Postings -> LinkedIn (read + create)
  { id: 221, role_id: 3, permission_id: 48 },
  { id: 222, role_id: 3, permission_id: 49 },

  // Job Postings -> Account (read + create)
  { id: 223, role_id: 3, permission_id: 52 },
  { id: 224, role_id: 3, permission_id: 53 },

/* ============================================================================
   INTERN (role_id: 4)
   READ ONLY
============================================================================ */

  { id: 300, role_id: 4, permission_id: 1 },   // Add Positions
  { id: 301, role_id: 4, permission_id: 5 },   // Positions List
  { id: 302, role_id: 4, permission_id: 9 },   // Applicant List
  { id: 303, role_id: 4, permission_id: 13 },  // Crawl Applicants
  { id: 304, role_id: 4, permission_id: 17 },  // Analytics
  { id: 305, role_id: 4, permission_id: 21 },  // Exports (read)
  { id: 306, role_id: 4, permission_id: 23 },  // General
  { id: 307, role_id: 4, permission_id: 27 },  // Company List
  { id: 308, role_id: 4, permission_id: 31 },  // Help
  { id: 309, role_id: 4, permission_id: 32 },  // Integrations (read)
  { id: 310, role_id: 4, permission_id: 44 },  // Seek (read)
  { id: 311, role_id: 4, permission_id: 48 },  // LinkedIn (read)
  { id: 312, role_id: 4, permission_id: 52 },  // Account (read)

];
