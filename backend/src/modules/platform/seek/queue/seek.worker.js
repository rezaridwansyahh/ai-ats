import { Worker, UnrecoverableError, DelayedError } from 'bullmq';
import connection from '../../../../queue/connection.js';

import seekHandler from "./seek.handler.js";

console.log("🚀 Worker started");

const scrapingWorker = new Worker(
  'seek',
  async (job) => {
    console.log(`[Worker] Processing ${job.id}`);

    const handler = seekHandler[job.name];

    if(!handler) {
      throw new UnrecoverableError(`Unknown job: ${job.name}`);
    }

    return handler(job.data);
  },
  {
    connection,
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