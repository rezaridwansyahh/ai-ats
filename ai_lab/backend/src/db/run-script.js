import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');

const url = new URL(process.env.DATABASEURL);
const dbName = decodeURIComponent(url.pathname.slice(1));
if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
  console.error(`Invalid database name in DATABASEURL: "${dbName}"`);
  process.exit(1);
}

async function ensureDatabase() {
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rowCount) console.log(`Database "${dbName}" already exists`);
    else { await admin.query(`CREATE DATABASE "${dbName}"`); console.log(`Database "${dbName}" created`); }
  } finally {
    await admin.end();
  }
}

async function runSql(sql) {
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  try { await client.query(sql); } finally { await client.end(); }
}

try {
  await ensureDatabase();

  console.log('Running setup.sql...');
  await runSql(read('setup.sql'));

  console.log('Running run-seed.js...');
  execFileSync(process.execPath, [path.join(__dirname, 'seeds', 'run-seed.js')], { stdio: 'inherit' });

  console.log('Running sync-seq.sql...');
  await runSql(read('sync-seq.sql'));

  console.log('Database setup, seeding, sync completed successfully.');
} catch (err) {
  console.error('db:setup failed:', err.message);
  process.exit(1);
}