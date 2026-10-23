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
  const key = lockKey(accountId);

  // A job's own retry reuses the same job.id (deterministic jobIds like
  // seek-sync-job-post-${account_id}) — if a previous attempt crashed
  // before releasing, the lock is still sitting there holding THIS job's
  // own id. Without this check, SET...NX would block the retry on its own
  // abandoned lock until the 600s TTL happens to expire, repeating that
  // wait on every subsequent retry in between. Reclaim it instead.
  const current = await redis.get(key);
  if (current === jobId) {
    await redis.expire(key, LOCK_TTL_SECONDS);
    return true;
  }

  const result = await redis.set(key, jobId, 'NX', 'EX', LOCK_TTL_SECONDS);
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
