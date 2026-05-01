export default [

/* ============================================================================
   ADMIN (role_id: 1) → FULL ACCESS
============================================================================ */
// Candidates -> Search (1–4)
...Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  role_id: 1,
  permission_id: i + 1
})),
// Settings -> Integrations (32–35)
...Array.from({ length: 4 }, (_, i) => ({
  id: 14 + i,
  role_id: 1,
  permission_id: 32 + i
})),
// Settings -> User Management (36–39)
...Array.from({ length: 4 }, (_, i) => ({
  id: 18 + i,
  role_id: 1,
  permission_id: 36 + i
})),
// Settings -> Role Management (40–43)
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
// Settings -> Account (52–55)
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
// Sourcing -> Talent Pool (72–75)
...Array.from({ length: 4 }, (_, i) => ({
  id: 54 + i,
  role_id: 1,
  permission_id: 72 + i
})),
// Selection -> Assessment (76–79)
...Array.from({ length: 4 }, (_, i) => ({
  id: 58 + i,
  role_id: 1,
  permission_id: 76 + i
})),
// Selection -> Report (80–83)
...Array.from({ length: 4 }, (_, i) => ({
  id: 62 + i,
  role_id: 1,
  permission_id: 80 + i
})),
// Sourcing -> Source Candidate (84–87)
...Array.from({ length: 4 }, (_, i) => ({
  id: 66 + i,
  role_id: 1,
  permission_id: 84 + i
})),
// Settings -> Recruiters (88–91)
...Array.from({ length: 4 }, (_, i) => ({
  id: 70 + i,
  role_id: 1,
  permission_id: 88 + i
})),
// Sourcing -> Source Management (92–95)
...Array.from({ length: 4 }, (_, i) => ({
  id: 74 + i,
  role_id: 1,
  permission_id: 92 + i
})),
// Selection -> AI Matching (96–99)
...Array.from({ length: 4 }, (_, i) => ({
  id: 78 + i,
  role_id: 1,
  permission_id: 96 + i
})),

/* ============================================================================
   MANAGER (role_id: 2)
   read / create / update (no delete)
============================================================================ */

  // Candidates -> Search (1–3: read/create/update)
  { id: 100, role_id: 2, permission_id: 1 },
  { id: 101, role_id: 2, permission_id: 2 },
  { id: 102, role_id: 2, permission_id: 3 },

  // Settings -> Integrations (32–34)
  { id: 124, role_id: 2, permission_id: 32 },
  { id: 125, role_id: 2, permission_id: 33 },
  { id: 126, role_id: 2, permission_id: 34 },

  // Settings -> User Management (36–38)
  { id: 127, role_id: 2, permission_id: 36 },
  { id: 128, role_id: 2, permission_id: 37 },
  { id: 129, role_id: 2, permission_id: 38 },

  // Settings -> Role Management (40–42)
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

  // Settings -> Account (52–54)
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

  // Sourcing -> Talent Pool (72–74: read/create/update)
  { id: 160, role_id: 2, permission_id: 72 },
  { id: 161, role_id: 2, permission_id: 73 },
  { id: 162, role_id: 2, permission_id: 74 },

  // Selection -> Assessment (76–78: read/create/update)
  { id: 163, role_id: 2, permission_id: 76 },
  { id: 164, role_id: 2, permission_id: 77 },
  { id: 165, role_id: 2, permission_id: 78 },

  // Selection -> Report (80–82: read/create/update)
  { id: 166, role_id: 2, permission_id: 80 },
  { id: 167, role_id: 2, permission_id: 81 },
  { id: 168, role_id: 2, permission_id: 82 },

  // Sourcing -> Source Candidate (84–86: read/create/update)
  { id: 169, role_id: 2, permission_id: 84 },
  { id: 170, role_id: 2, permission_id: 85 },
  { id: 171, role_id: 2, permission_id: 86 },

  // Settings -> Recruiters (88–90: read/create/update)
  { id: 172, role_id: 2, permission_id: 88 },
  { id: 173, role_id: 2, permission_id: 89 },
  { id: 174, role_id: 2, permission_id: 90 },

  // Sourcing -> Source Management (92–94: read/create/update)
  { id: 175, role_id: 2, permission_id: 92 },
  { id: 176, role_id: 2, permission_id: 93 },
  { id: 177, role_id: 2, permission_id: 94 },

  // Selection -> AI Matching (96–98: read/create/update)
  { id: 178, role_id: 2, permission_id: 96 },
  { id: 179, role_id: 2, permission_id: 97 },
  { id: 180, role_id: 2, permission_id: 98 },

/* ============================================================================
   STAFF (role_id: 3)
   read + create only
============================================================================ */

  // Candidates -> Search (read + create)
  { id: 200, role_id: 3, permission_id: 1 },
  { id: 201, role_id: 3, permission_id: 2 },

  // Settings -> Integrations (read + create)
  { id: 215, role_id: 3, permission_id: 32 },
  { id: 216, role_id: 3, permission_id: 33 },

  // Settings -> User Management (read only)
  { id: 217, role_id: 3, permission_id: 36 },

  // Settings -> Role Management (read only)
  { id: 218, role_id: 3, permission_id: 40 },

  // Job Postings -> Seek (read + create)
  { id: 219, role_id: 3, permission_id: 44 },
  { id: 220, role_id: 3, permission_id: 45 },

  // Job Postings -> LinkedIn (read + create)
  { id: 221, role_id: 3, permission_id: 48 },
  { id: 222, role_id: 3, permission_id: 49 },

  // Settings -> Account (read + create)
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

  // Sourcing -> Talent Pool (read + create)
  { id: 232, role_id: 3, permission_id: 72 },
  { id: 233, role_id: 3, permission_id: 73 },

  // Selection -> Assessment (read + create)
  { id: 234, role_id: 3, permission_id: 76 },
  { id: 235, role_id: 3, permission_id: 77 },

  // Selection -> Report (read + create)
  { id: 236, role_id: 3, permission_id: 80 },
  { id: 237, role_id: 3, permission_id: 81 },

  // Sourcing -> Source Candidate (read + create)
  { id: 238, role_id: 3, permission_id: 84 },
  { id: 239, role_id: 3, permission_id: 85 },

  // Settings -> Recruiters (read + create)
  { id: 240, role_id: 3, permission_id: 88 },
  { id: 241, role_id: 3, permission_id: 89 },

  // Sourcing -> Source Management (read + create)
  { id: 242, role_id: 3, permission_id: 92 },
  { id: 243, role_id: 3, permission_id: 93 },

  // Selection -> AI Matching (read + create)
  { id: 244, role_id: 3, permission_id: 96 },
  { id: 245, role_id: 3, permission_id: 97 },

/* ============================================================================
   INTERN (role_id: 4)
   READ ONLY
============================================================================ */

  { id: 300, role_id: 4, permission_id: 1 },   // Candidates -> Search
  { id: 309, role_id: 4, permission_id: 32 },  // Integrations (read)
  { id: 310, role_id: 4, permission_id: 44 },  // Seek (read)
  { id: 311, role_id: 4, permission_id: 48 },  // LinkedIn (read)
  { id: 312, role_id: 4, permission_id: 52 },  // Account (read)
  { id: 313, role_id: 4, permission_id: 56 },  // Seek Sourcing (read)
  { id: 314, role_id: 4, permission_id: 60 },  // LinkedIn Sourcing (read)
  { id: 316, role_id: 4, permission_id: 68 },  // Sourcing -> Job Management (read)
  { id: 317, role_id: 4, permission_id: 72 },  // Sourcing -> Talent Pool (read)
  { id: 318, role_id: 4, permission_id: 76 },  // Selection -> Assessment (read)
  { id: 319, role_id: 4, permission_id: 80 },  // Selection -> Report (read)
  { id: 320, role_id: 4, permission_id: 84 },  // Sourcing -> Source Candidate (read)
  { id: 321, role_id: 4, permission_id: 88 },  // Settings -> Recruiters (read)
  { id: 322, role_id: 4, permission_id: 92 },  // Sourcing -> Source Management (read)
  { id: 323, role_id: 4, permission_id: 96 },  // Selection -> AI Matching (read)

];
