import { Worker } from 'bullmq';
import redisConfig from '../../config/redis.js';

import handlers from "./seek.handler.js";

console.log("🚀 Worker started");

const scrapingWorker = new Worker(
  'seek',
  async (job) => {
    console.log(`[Worker] Processing ${job.name} - Job ID: ${job.id}`);

    try {
      const handler = handlers[job.name];

      if(!handler) {
        throw 'handler undefined';
      }

      await handler(job.data);
    } catch(err) {
      throw err;
    }
  },
  {
    connection: redisConfig.connection,
    concurrency: 1,
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