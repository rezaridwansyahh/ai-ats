import { Pool } from "pg";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Compute __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Preserve NODE_ENV usage for other logic
const ENV = process.env.NODE_ENV || "development";
const envFile = ENV === "development" ? ".env.dev" : `.env.${ENV}`;
dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) });

// 2. Validate the environment
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the environment.");
}

// 3. Create the PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: ENV === "production" ? { rejectUnauthorized: false } : false
});

// 4. Export the pool
export default pool;
