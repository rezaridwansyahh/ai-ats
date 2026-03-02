import { Pool } from "pg"

console.log("DB URL:", process.env.DATABASEURL ? "exists" : "MISSING!");

const pool = new Pool({
  connectionString: process.env.DATABASEURL,  // much simpler
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

// Test the connection
pool.query('SELECT NOW()')
  .then(() => console.log("DB connected"))
  .catch(err => console.error("DB connection failed:", err.message));

export default pool;