// clear-account-lock.mjs — run on your server from backend/:
//   node clear-account-lock.mjs <account_id>
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.dev') });

const accountId = process.argv[2];
if (!accountId) {
  console.error('Usage: node clear-account-lock.mjs <account_id>');
  process.exit(1);
}

const { default: Redis } = await import('ioredis');
const { default: redisConfig } = await import('./src/config/redis.js');

const redis = new Redis(redisConfig.connection);
const key = `account-lock:${accountId}`;

const existed = await redis.del(key);
console.log(existed ? `Cleared ${key}` : `${key} didn't exist (already clear)`);

redis.disconnect();
process.exit(0);
