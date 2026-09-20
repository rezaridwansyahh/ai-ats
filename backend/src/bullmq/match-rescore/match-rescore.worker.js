import { Worker, UnrecoverableError } from 'bullmq';
import redisConfig from '../../config/redis.js';
import handlers from './match-rescore.handler.js';

console.log('🚀 Match-Rescore Worker started');

const matchRescoreWorker = new Worker(
  'match-rescore',
  async (job) => {
    console.log(`[Match-Rescore Worker] Processing ${job.name} - Job ID: ${job.id}`);

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

matchRescoreWorker.on('completed', (job) => {
  console.log(`[Match-Rescore Worker] ${job.name} completed - Job ID: ${job.id}`);
});

matchRescoreWorker.on('failed', (job, err) => {
  console.error(`[Match-Rescore Worker] ${job.name} failed - Job ID: ${job.id}`, err.message);
});

matchRescoreWorker.on('error', (error) => {
  console.error('[Match-Rescore Worker] error:', error);
});

export default matchRescoreWorker;
