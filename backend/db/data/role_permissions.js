export default [

  /* =========================
     ADMIN (role_id: 1)
     Full access
  ========================= */
  { id: 1, role_id: 1, permission_id: 1 },
  { id: 2, role_id: 1, permission_id: 2 },
  { id: 3, role_id: 1, permission_id: 3 },
  { id: 4, role_id: 1, permission_id: 4 },
  { id: 5, role_id: 1, permission_id: 5 },
  { id: 6, role_id: 1, permission_id: 6 },
  { id: 7, role_id: 1, permission_id: 7 },
  { id: 8, role_id: 1, permission_id: 8 },
  { id: 9, role_id: 1, permission_id: 9 },
  { id: 10, role_id: 1, permission_id: 10 },
  { id: 11, role_id: 1, permission_id: 11 },
  { id: 12, role_id: 1, permission_id: 12 },
  { id: 13, role_id: 1, permission_id: 13 },
  { id: 14, role_id: 1, permission_id: 14 },
  { id: 15, role_id: 1, permission_id: 15 },
  { id: 16, role_id: 1, permission_id: 16 },

  /* =========================
     MANAGER (role_id: 2)
     Manage data, no deletes
  ========================= */
  { id: 17, role_id: 2, permission_id: 1 },  // read users
  { id: 18, role_id: 2, permission_id: 2 },  // update users
  { id: 19, role_id: 2, permission_id: 4 },  // create users
  { id: 20, role_id: 2, permission_id: 5 },  // read products
  { id: 21, role_id: 2, permission_id: 6 },  // update products
  { id: 22, role_id: 2, permission_id: 8 },  // create products
  { id: 23, role_id: 2, permission_id: 9 },  // read categories
  { id: 24, role_id: 2, permission_id: 10 }, // update categories
  { id: 25, role_id: 2, permission_id: 11 }, // read company list
  { id: 26, role_id: 2, permission_id: 12 }, // export company list
  { id: 27, role_id: 2, permission_id: 13 }, // read analytics
  { id: 28, role_id: 2, permission_id: 14 }, // export reports
  { id: 29, role_id: 2, permission_id: 15 }, // read schedule
  { id: 30, role_id: 2, permission_id: 16 }, // update schedule

  /* =========================
     STAFF (role_id: 3)
     Operational access
  ========================= */
  { id: 31, role_id: 3, permission_id: 1 },  // read users
  { id: 32, role_id: 3, permission_id: 5 },  // read products
  { id: 33, role_id: 3, permission_id: 8 },  // create products
  { id: 34, role_id: 3, permission_id: 9 },  // read categories
  { id: 35, role_id: 3, permission_id: 11 }, // read company list
  { id: 36, role_id: 3, permission_id: 13 }, // read analytics
  { id: 37, role_id: 3, permission_id: 15 }, // read schedule

  /* =========================
     INTERN (role_id: 4)
     Read-only
  ========================= */
  { id: 38, role_id: 4, permission_id: 5 },  // read products
  { id: 39, role_id: 4, permission_id: 9 },  // read categories
  { id: 40, role_id: 4, permission_id: 11 }, // read company list
  { id: 41, role_id: 4, permission_id: 13 }, // read analytics
  { id: 42, role_id: 4, permission_id: 15 }, // read schedule
];
