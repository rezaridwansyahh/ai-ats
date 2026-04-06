import pkg from 'pg';
const { Pool } = pkg;

let pool;

const getDb = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASEURL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
    });
  }
  return pool;
};

export default getDb;