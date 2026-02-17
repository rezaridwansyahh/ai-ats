export default [

  /* =========================
     ADMIN (role_id: 1)
     Full access
  ========================= */
  ...Array.from({ length: 34 }, (_, i) => ({
    id: i + 1,
    role_id: 1,
    permission_id: i + 1
  })),

  /* =========================
     MANAGER (role_id: 2)
     read/create/update/export
  ========================= */
  { id: 35, role_id: 2, permission_id: 1 },  // Dashboard read
  { id: 36, role_id: 2, permission_id: 2 },  // create
  { id: 37, role_id: 2, permission_id: 3 },  // update

  { id: 38, role_id: 2, permission_id: 5 },
  { id: 39, role_id: 2, permission_id: 6 },
  { id: 40, role_id: 2, permission_id: 7 },

  { id: 41, role_id: 2, permission_id: 9 },
  { id: 42, role_id: 2, permission_id: 10 },
  { id: 43, role_id: 2, permission_id: 11 },

  { id: 44, role_id: 2, permission_id: 13 },
  { id: 45, role_id: 2, permission_id: 14 },
  { id: 46, role_id: 2, permission_id: 15 },

  { id: 47, role_id: 2, permission_id: 17 },
  { id: 48, role_id: 2, permission_id: 18 },
  { id: 49, role_id: 2, permission_id: 19 },

  { id: 50, role_id: 2, permission_id: 21 },
  { id: 51, role_id: 2, permission_id: 22 },
  { id: 52, role_id: 2, permission_id: 23 },

  { id: 53, role_id: 2, permission_id: 25 }, // export
  { id: 54, role_id: 2, permission_id: 26 }, // export

  { id: 55, role_id: 2, permission_id: 27 },
  { id: 56, role_id: 2, permission_id: 28 },
  { id: 57, role_id: 2, permission_id: 29 },

  { id: 58, role_id: 2, permission_id: 31 },
  { id: 59, role_id: 2, permission_id: 32 },
  { id: 60, role_id: 2, permission_id: 33 },
  
  { id: 86, role_id: 2, permission_id: 35 },

  /* =========================
     STAFF (role_id: 3)
     read + create
  ========================= */
  { id: 61, role_id: 3, permission_id: 1 },
  { id: 62, role_id: 3, permission_id: 2 },

  { id: 63, role_id: 3, permission_id: 5 },
  { id: 64, role_id: 3, permission_id: 6 },

  { id: 65, role_id: 3, permission_id: 9 },
  { id: 66, role_id: 3, permission_id: 10 },

  { id: 67, role_id: 3, permission_id: 13 },
  { id: 68, role_id: 3, permission_id: 14 },

  { id: 69, role_id: 3, permission_id: 17 },
  { id: 70, role_id: 3, permission_id: 18 },

  { id: 71, role_id: 3, permission_id: 21 },
  { id: 72, role_id: 3, permission_id: 22 },

  { id: 73, role_id: 3, permission_id: 27 },
  { id: 74, role_id: 3, permission_id: 28 },

  { id: 75, role_id: 3, permission_id: 31 },
  { id: 76, role_id: 3, permission_id: 32 },

  { id: 87, role_id: 3, permission_id: 35 },  

  /* =========================
     INTERN (role_id: 4)
     read-only
  ========================= */
  { id: 77, role_id: 4, permission_id: 1 },
  { id: 78, role_id: 4, permission_id: 5 },
  { id: 79, role_id: 4, permission_id: 9 },
  { id: 80, role_id: 4, permission_id: 13 },
  { id: 81, role_id: 4, permission_id: 17 },
  { id: 82, role_id: 4, permission_id: 21 },
  { id: 83, role_id: 4, permission_id: 25 }, // read exports
  { id: 84, role_id: 4, permission_id: 27 },
  { id: 85, role_id: 4, permission_id: 31 },
];
