import Redis from 'ioredis';
import redisConfig from '../../config/redis.js';

// Separate plain client from BullMQ's own Redis usage — this is just a
// distributed mutex, not a queue concern.
const redis = new Redis(redisConfig.connection);

// Dead-man's-switch TTL: if a job crashes without releasing (process killed,
// uncaught exception bypassing finally), the lock self-expires instead of
// permanently starving that account. Comfortably above a typical scrape.
const LOCK_TTL_SECONDS = 600;

const lockKey = (accountId) => `account-lock:${accountId}`;

// Returns true if acquired, false if another job already holds this
// account's lock.
export async function acquireAccountLock(accountId, jobId) {
  const result = await redis.set(lockKey(accountId), jobId, 'NX', 'EX', LOCK_TTL_SECONDS);
  return result === 'OK';
}

// Only releases if we're still the holder — avoids deleting a lock some
// other job has since acquired after our TTL expired.
export async function releaseAccountLock(accountId, jobId) {
  const current = await redis.get(lockKey(accountId));
  if (current === jobId) {
    await redis.del(lockKey(accountId));
  }
}
