import { Worker, UnrecoverableError } from 'bullmq';
import redisConfig from '../../config/redis.js';
import handlers from './cv.handler.js';

console.log('🚀 CV Worker started');

const cvWorker = new Worker(
  'cv',
  async (job) => {
    console.log(`[CV Worker] Processing ${job.name} - Job ID: ${job.id}`);

    const handler = handlers[job.name];
    if (!handler) throw new UnrecoverableError(`No handler for job: ${job.name}`);

    try {
      await handler(job.data);
    } catch (err) {
      if (err instanceof UnrecoverableError) throw err;
      throw new UnrecoverableError(err.message || String(err));
    }
  },
  {
    connection: redisConfig.connection,
    concurrency: 2,
  }
);

cvWorker.on('completed', (job) => {
  console.log(`[CV Worker] ${job.name} completed - Job ID: ${job.id}`);
});

cvWorker.on('failed', (job, err) => {
  console.error(`[CV Worker] ${job.name} failed - Job ID: ${job.id}`, err.message);
});

cvWorker.on('error', (error) => {
  console.error('[CV Worker] error:', error);
});

export default cvWorker;
