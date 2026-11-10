import { Worker, UnrecoverableError } from 'bullmq';
import connection from '../../../../queue/connection.js';

import linkedinHandler from "./linkedin.handler.js";

console.log("🚀 LinkedIn Worker started");

const linkedinWorker = new Worker(
  'linkedin-platform',
  async (job) => {
    console.log(`[LinkedIn Worker] Processing ${job.id}`);

    const handler = linkedinHandler[job.name];

    if (!handler) {
      throw new UnrecoverableError(`Unknown job: ${job.name}`);
    }

    return handler(job.data);
  },
  {
    connection,
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
