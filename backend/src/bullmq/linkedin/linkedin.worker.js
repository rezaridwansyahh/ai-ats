import { Worker, UnrecoverableError } from 'bullmq';
import redisConfig from '../../config/redis.js';

import handlers from "./linkedin.handler.js";

console.log("🚀 LinkedIn Worker started");

const linkedinWorker = new Worker(
  'linkedin',
  async (job) => {
    console.log(`[LinkedIn Worker] Processing ${job.name} - Job ID: ${job.id}`);

    try {
      const handler = handlers[job.name];

      if (!handler) {
        throw new UnrecoverableError('handler undefined');
      }

      await handler(job.data);
    } catch (err) {
      if (err instanceof UnrecoverableError) throw err;
      throw new UnrecoverableError(err.message || String(err));
    }
  },
  {
    connection: redisConfig.connection,
    concurrency: 1,
  }
);

linkedinWorker.on('completed', (job) => {
  console.log(`[LinkedIn Worker] ${job.name} completed - Job ID: ${job.id}`);
});

linkedinWorker.on('failed', (job, err) => {
  console.error(`[LinkedIn Worker] ${job.name} failed - Job ID: ${job.id}`, err.message);
});

linkedinWorker.on('active', (job) => {
  console.log(`[LinkedIn Worker] ${job.name} started - Job ID: ${job.id}`);
});

linkedinWorker.on('error', (error) => {
  console.error('[LinkedIn Worker] Worker error:', error);
});

export default linkedinWorker;
