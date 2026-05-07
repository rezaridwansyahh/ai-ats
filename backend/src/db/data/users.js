import bcrypt from 'bcrypt';

export default [
  { employee_id: 1, id: 1, email: "user1@example.com", username: "user1", password: bcrypt.hashSync("pass1", 12), company_id: 1 },
  { employee_id: 2, id: 2, email: "user2@example.com", username: "user2", password: bcrypt.hashSync("pass2", 12), company_id: 1 },
  { employee_id: 3, id: 3, email: "user3@example.com", username: "user3", password: bcrypt.hashSync("pass3", 12), company_id: 1 },
  { employee_id: 4, id: 4, email: "user4@example.com", username: "user4", password: bcrypt.hashSync("pass4", 12), company_id: 2 },
  { employee_id: 5, id: 5, email: "user5@example.com", username: "user5", password: bcrypt.hashSync("pass5", 12), company_id: 2 }
];