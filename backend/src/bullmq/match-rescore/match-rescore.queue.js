import { Queue } from 'bullmq';
import redisConfig from '../../config/redis.js';

const matchRescoreQueue = new Queue('match-rescore', {
  connection: redisConfig.connection,
  defaultJobOptions: redisConfig.defaultJobOptions,
});

matchRescoreQueue.on('error', (error) => {
  console.error('[Match-Rescore Queue] error:', error);
});

export default matchRescoreQueue;
