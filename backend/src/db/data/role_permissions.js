export default [

/* ============================================================================
   ADMIN (role_id: 1) → FULL ACCESS
   Permission IDs: 1–4, 23–63
============================================================================ */
// Candidates -> Search (1–4)
...Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  role_id: 1,
  permission_id: i + 1
})),
// Settings -> General (23–26)
...Array.from({ length: 4 }, (_, i) => ({
  id: 5 + i,
  role_id: 1,
  permission_id: 23 + i
})),
// Settings -> Company List (27–30)
...Array.from({ length: 4 }, (_, i) => ({
  id: 9 + i,
  role_id: 1,
  permission_id: 27 + i
})),
// Settings -> Help (31)
{ id: 13, role_id: 1, permission_id: 31 },
// Settings -> Integrations (32–35)
...Array.from({ length: 4 }, (_, i) => ({
  id: 14 + i,
  role_id: 1,
  permission_id: 32 + i
})),
// Users -> User Management (36–39)
...Array.from({ length: 4 }, (_, i) => ({
  id: 18 + i,
  role_id: 1,
  permission_id: 36 + i
})),
// Users -> Role Management (40–43)
...Array.from({ length: 4 }, (_, i) => ({
  id: 22 + i,
  role_id: 1,
  permission_id: 40 + i
})),
// Job Postings -> Seek (44–47)
...Array.from({ length: 4 }, (_, i) => ({
  id: 26 + i,
  role_id: 1,
  permission_id: 44 + i
})),
// Job Postings -> LinkedIn (48–51)
...Array.from({ length: 4 }, (_, i) => ({
  id: 30 + i,
  role_id: 1,
  permission_id: 48 + i
})),
// Job Postings -> Account (52–55)
...Array.from({ length: 4 }, (_, i) => ({
  id: 34 + i,
  role_id: 1,
  permission_id: 52 + i
})),
// Job Management -> Seek Sourcing (56–59)
...Array.from({ length: 4 }, (_, i) => ({
  id: 38 + i,
  role_id: 1,
  permission_id: 56 + i
})),
// Job Management -> LinkedIn Sourcing (60–63)
...Array.from({ length: 4 }, (_, i) => ({
  id: 42 + i,
  role_id: 1,
  permission_id: 60 + i
})),
// Sourcing -> Job Management (68–71)
...Array.from({ length: 4 }, (_, i) => ({
  id: 50 + i,
  role_id: 1,
  permission_id: 68 + i
})),
// Users -> Recruiters (72–75)
...Array.from({ length: 4 }, (_, i) => ({
  id: 54 + i,
  role_id: 1,
  permission_id: 72 + i
})),

/* ============================================================================
   MANAGER (role_id: 2)
   read / create / update (no delete)
============================================================================ */

  // Candidates -> Search (1–3: read/create/update)
  { id: 100, role_id: 2, permission_id: 1 },
  { id: 101, role_id: 2, permission_id: 2 },
  { id: 102, role_id: 2, permission_id: 3 },

  // Settings -> General (23–25)
  { id: 117, role_id: 2, permission_id: 23 },
  { id: 118, role_id: 2, permission_id: 24 },
  { id: 119, role_id: 2, permission_id: 25 },

  // Settings -> Company List (27–29)
  { id: 120, role_id: 2, permission_id: 27 },
  { id: 121, role_id: 2, permission_id: 28 },
  { id: 122, role_id: 2, permission_id: 29 },

  // Settings -> Help (31)
  { id: 123, role_id: 2, permission_id: 31 },

  // Settings -> Integrations (32–34)
  { id: 124, role_id: 2, permission_id: 32 },
  { id: 125, role_id: 2, permission_id: 33 },
  { id: 126, role_id: 2, permission_id: 34 },

  // Users -> User Management (36–38)
  { id: 127, role_id: 2, permission_id: 36 },
  { id: 128, role_id: 2, permission_id: 37 },
  { id: 129, role_id: 2, permission_id: 38 },

  // Users -> Role Management (40–42)
  { id: 130, role_id: 2, permission_id: 40 },
  { id: 131, role_id: 2, permission_id: 41 },
  { id: 132, role_id: 2, permission_id: 42 },

  // Job Postings -> Seek (44–46)
  { id: 133, role_id: 2, permission_id: 44 },
  { id: 134, role_id: 2, permission_id: 45 },
  { id: 135, role_id: 2, permission_id: 46 },

  // Job Postings -> LinkedIn (48–50)
  { id: 136, role_id: 2, permission_id: 48 },
  { id: 137, role_id: 2, permission_id: 49 },
  { id: 138, role_id: 2, permission_id: 50 },

  // Job Postings -> Account (52–54)
  { id: 139, role_id: 2, permission_id: 52 },
  { id: 140, role_id: 2, permission_id: 53 },
  { id: 141, role_id: 2, permission_id: 54 },

  // Job Management -> Seek Sourcing (56–58)
  { id: 142, role_id: 2, permission_id: 56 },
  { id: 143, role_id: 2, permission_id: 57 },
  { id: 144, role_id: 2, permission_id: 58 },

  // Job Management -> LinkedIn Sourcing (60–62)
  { id: 145, role_id: 2, permission_id: 60 },
  { id: 146, role_id: 2, permission_id: 61 },
  { id: 147, role_id: 2, permission_id: 62 },

  // Sourcing -> Job Management (68–70: read/create/update)
  { id: 151, role_id: 2, permission_id: 68 },
  { id: 152, role_id: 2, permission_id: 69 },
  { id: 153, role_id: 2, permission_id: 70 },

  // Users -> Recruiters (72–74: read/create/update)
  { id: 160, role_id: 2, permission_id: 72 },
  { id: 161, role_id: 2, permission_id: 73 },
  { id: 162, role_id: 2, permission_id: 74 },

/* ============================================================================
   STAFF (role_id: 3)
   read + create only
============================================================================ */

  // Candidates -> Search (read + create)
  { id: 200, role_id: 3, permission_id: 1 },
  { id: 201, role_id: 3, permission_id: 2 },

  // Settings -> General (read + create)
  { id: 210, role_id: 3, permission_id: 23 },
  { id: 211, role_id: 3, permission_id: 24 },

  // Settings -> Company List (read + create)
  { id: 212, role_id: 3, permission_id: 27 },
  { id: 213, role_id: 3, permission_id: 28 },

  // Settings -> Help (read)
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

  // Job Management -> Seek Sourcing (read + create)
  { id: 225, role_id: 3, permission_id: 56 },
  { id: 226, role_id: 3, permission_id: 57 },

  // Job Management -> LinkedIn Sourcing (read + create)
  { id: 227, role_id: 3, permission_id: 60 },
  { id: 228, role_id: 3, permission_id: 61 },

  // Sourcing -> Job Management (read + create)
  { id: 230, role_id: 3, permission_id: 68 },
  { id: 231, role_id: 3, permission_id: 69 },

  // Users -> Recruiters (read + create)
  { id: 232, role_id: 3, permission_id: 72 },
  { id: 233, role_id: 3, permission_id: 73 },

/* ============================================================================
   INTERN (role_id: 4)
   READ ONLY
============================================================================ */

  { id: 300, role_id: 4, permission_id: 1 },   // Candidates -> Search
  { id: 306, role_id: 4, permission_id: 23 },  // General
  { id: 307, role_id: 4, permission_id: 27 },  // Company List
  { id: 308, role_id: 4, permission_id: 31 },  // Help
  { id: 309, role_id: 4, permission_id: 32 },  // Integrations (read)
  { id: 310, role_id: 4, permission_id: 44 },  // Seek (read)
  { id: 311, role_id: 4, permission_id: 48 },  // LinkedIn (read)
  { id: 312, role_id: 4, permission_id: 52 },  // Account (read)
  { id: 313, role_id: 4, permission_id: 56 },  // Seek Sourcing (read)
  { id: 314, role_id: 4, permission_id: 60 },  // LinkedIn Sourcing (read)
  { id: 316, role_id: 4, permission_id: 68 },  // Sourcing -> Job Management (read)
  { id: 317, role_id: 4, permission_id: 72 },  // Recruiters (read)

];
