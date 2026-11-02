// check-account-lock.mjs — run on your server from backend/:
//   node check-account-lock.mjs <account_id>
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.dev') });

const accountId = process.argv[2];
if (!accountId) {
  console.error('Usage: node check-account-lock.mjs <account_id>');
  process.exit(1);
}

const { default: Redis } = await import('ioredis');
const { default: redisConfig } = await import('./src/config/redis.js');

const redis = new Redis(redisConfig.connection);
const key = `account-lock:${accountId}`;
const value = await redis.get(key);
const ttl = await redis.ttl(key);

console.log({
  key,
  holder_job_id: value,
  ttl_seconds_remaining: ttl,
  // -2 means the key doesn't exist at all (not locked); -1 means it exists
  // with no expiry (shouldn't happen — the lock always sets EX 600).
});

redis.disconnect();
process.exit(0);
