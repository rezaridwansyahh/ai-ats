// Bootstrap admin user for final-seed.js.
import bcrypt from 'bcrypt';

export default [
  {
    id: 1,
    email: 'bakhtiar@myralix.com',
    username: 'Bakhtiar',
    password: bcrypt.hashSync('pass1', 12),
    company_id: 1,
  },
];

// user → role mapping (Admin = role_id 1, from data/roles.js)
export const finalUserRoles = [
  { id: 1, user_id: 1, role_id: 1 },
];
