export default [

  /* =========================
     ADMIN (role_id: 1)
     Full access to everything
  ========================= */
  ...Array.from({ length: 39 }, (_, i) => ({
    id: i + 1,
    role_id: 1,
    permission_id: i + 1
  })),

  /* =========================
     MANAGER (role_id: 2)
     read/create/update/export
     No delete permissions
  ========================= */
  // Dashboard
  { id: 40, role_id: 2, permission_id: 1 },  // read
  { id: 41, role_id: 2, permission_id: 2 },  // create
  { id: 42, role_id: 2, permission_id: 3 },  // update

  // Positions -> Add Positions
  { id: 43, role_id: 2, permission_id: 5 },  // read
  { id: 44, role_id: 2, permission_id: 6 },  // create
  { id: 45, role_id: 2, permission_id: 7 },  // update

  // Positions -> Positions List
  { id: 46, role_id: 2, permission_id: 9 },  // read
  { id: 47, role_id: 2, permission_id: 10 }, // create
  { id: 48, role_id: 2, permission_id: 11 }, // update

  // Applicants -> Applicant List
  { id: 49, role_id: 2, permission_id: 13 }, // read
  { id: 50, role_id: 2, permission_id: 14 }, // create
  { id: 51, role_id: 2, permission_id: 15 }, // update

  // Applicants -> Crawl Applicants
  { id: 52, role_id: 2, permission_id: 17 }, // read
  { id: 53, role_id: 2, permission_id: 18 }, // create
  { id: 54, role_id: 2, permission_id: 19 }, // update

  // Reports -> Analytics
  { id: 55, role_id: 2, permission_id: 21 }, // read
  { id: 56, role_id: 2, permission_id: 22 }, // create
  { id: 57, role_id: 2, permission_id: 23 }, // update

  // Reports -> Exports
  { id: 58, role_id: 2, permission_id: 25 }, // read
  { id: 59, role_id: 2, permission_id: 26 }, // export

  // Settings -> General
  { id: 60, role_id: 2, permission_id: 27 }, // read
  { id: 61, role_id: 2, permission_id: 28 }, // create
  { id: 62, role_id: 2, permission_id: 29 }, // update

  // Settings -> Company List
  { id: 63, role_id: 2, permission_id: 31 }, // read
  { id: 64, role_id: 2, permission_id: 32 }, // create
  { id: 65, role_id: 2, permission_id: 33 }, // update

  // Settings -> Help
  { id: 66, role_id: 2, permission_id: 35 }, // read

  // Users -> User Management
  { id: 67, role_id: 2, permission_id: 36 }, // read
  { id: 68, role_id: 2, permission_id: 37 }, // create
  { id: 69, role_id: 2, permission_id: 38 }, // update

  /* =========================
     STAFF (role_id: 3)
     read + create only
     No update or delete
  ========================= */
  // Dashboard
  { id: 70, role_id: 3, permission_id: 1 },  // read
  { id: 71, role_id: 3, permission_id: 2 },  // create

  // Positions -> Add Positions
  { id: 72, role_id: 3, permission_id: 5 },  // read
  { id: 73, role_id: 3, permission_id: 6 },  // create

  // Positions -> Positions List
  { id: 74, role_id: 3, permission_id: 9 },  // read
  { id: 75, role_id: 3, permission_id: 10 }, // create

  // Applicants -> Applicant List
  { id: 76, role_id: 3, permission_id: 13 }, // read
  { id: 77, role_id: 3, permission_id: 14 }, // create

  // Applicants -> Crawl Applicants
  { id: 78, role_id: 3, permission_id: 17 }, // read
  { id: 79, role_id: 3, permission_id: 18 }, // create

  // Reports -> Analytics
  { id: 80, role_id: 3, permission_id: 21 }, // read
  { id: 81, role_id: 3, permission_id: 22 }, // create

  // Settings -> General
  { id: 82, role_id: 3, permission_id: 27 }, // read
  { id: 83, role_id: 3, permission_id: 28 }, // create

  // Settings -> Company List
  { id: 84, role_id: 3, permission_id: 31 }, // read
  { id: 85, role_id: 3, permission_id: 32 }, // create

  // Settings -> Help
  { id: 86, role_id: 3, permission_id: 35 }, // read

  // Users -> User Management (read only for staff)
  { id: 87, role_id: 3, permission_id: 36 }, // read

  /* =========================
     INTERN (role_id: 4)
     Read-only access
  ========================= */
  // Dashboard
  { id: 88, role_id: 4, permission_id: 1 },  // read

  // Positions -> Add Positions
  { id: 89, role_id: 4, permission_id: 5 },  // read

  // Positions -> Positions List
  { id: 90, role_id: 4, permission_id: 9 },  // read

  // Applicants -> Applicant List
  { id: 91, role_id: 4, permission_id: 13 }, // read

  // Applicants -> Crawl Applicants
  { id: 92, role_id: 4, permission_id: 17 }, // read

  // Reports -> Analytics
  { id: 93, role_id: 4, permission_id: 21 }, // read

  // Reports -> Exports (read only, no export permission)
  { id: 94, role_id: 4, permission_id: 25 }, // read

  // Settings -> General
  { id: 95, role_id: 4, permission_id: 27 }, // read

  // Settings -> Company List
  { id: 96, role_id: 4, permission_id: 31 }, // read

  // Settings -> Help
  { id: 97, role_id: 4, permission_id: 35 }, // read

  // NO access to User Management for interns
];