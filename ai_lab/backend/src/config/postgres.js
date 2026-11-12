import pg from 'pg';
import './env.js';

pg.types.setTypeParser(1082, (v) => v);

let pool;

export default function getDb() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: process.env.DATABASEURL });
    pool.on('error', (err) => console.error('Unexpected PG pool error:', err.message));
  }
  return pool;
}