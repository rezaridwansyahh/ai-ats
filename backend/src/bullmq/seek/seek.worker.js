import { Worker, UnrecoverableError } from 'bullmq';
import redisConfig from '../../config/redis.js';
import { acquireAccountLock, releaseAccountLock } from '../../shared/utils/account-lock.js';

import handlers from "./seek.handler.js";

console.log("🚀 Worker started");

// Ramps exponentially (2s, 4s, 8s, ...) up to a 10-minute ceiling, then holds
// steady — plain exponential backoff balloons to days-long waits past ~15
// attempts, which is useless for a queue meant to keep retrying indefinitely.
const BACKOFF_CEILING_MS = 10 * 60 * 1000;
function cappedBackoff(attemptsMade) {
  return Math.min(2000 * Math.pow(2, attemptsMade - 1), BACKOFF_CEILING_MS);
}

const scrapingWorker = new Worker(
  'seek',
  async (job) => {
    console.log(`[Worker] Processing ${job.name} - Job ID: ${job.id}`);

    const handler = handlers[job.name];

    if(!handler) {
      throw new UnrecoverableError('handler undefined');
    }

    // Scheduler sweep jobs (seek-night-scan / seek-day-scan) don't touch a
    // single account directly — they just enumerate + enqueue other jobs —
    // so there's no account to lock.
    const accountId = job.data?.account_id;

    if (!accountId) {
      await handler(job.data, job);
      return;
    }

    const acquired = await acquireAccountLock(accountId, job.id);

    if (!acquired) {
      // Same account already has a job in flight (Chrome's userDataDir is
      // per-account, so they can't run concurrently). Throw a plain error —
      // NOT UnrecoverableError — so BullMQ's backoff requeues this job and
      // the worker slot is freed immediately to pick up a different account.
      throw new Error(`Account ${accountId} is locked by another job — will retry`);
    }

    try {
      await handler(job.data, job);
    } catch (err) {
      if (err.unrecoverable) {
        throw new UnrecoverableError(err.message);
      }
      throw err;
    } finally {
      await releaseAccountLock(accountId, job.id);
    }
  },
  {
    connection: redisConfig.connection,
    concurrency: 3,
    settings: {
      backoffStrategy: cappedBackoff,
    },
  }
);

// Event Listeners
scrapingWorker.on('completed', (job) => {
  console.log(`[Worker] ${job.name} completed - Job ID: ${job.id}`);
});

scrapingWorker.on('failed', (job, err) => {
  console.error(`[Worker] ${job.name} failed - Job ID: ${job.id}`, err.message);
});

scrapingWorker.on('active', (job) => {
  console.log(`[Worker] ${job.name} started - Job ID: ${job.id}`);
});

scrapingWorker.on('error', (error) => {
  console.error('[Worker] Worker error:', error);
});

export default scrapingWorker;