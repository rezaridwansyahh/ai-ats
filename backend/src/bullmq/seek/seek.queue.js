import { Queue } from 'bullmq'
import redisConfig from '../../config/redis.js';

const seekQueue = new Queue('seek', {
  connection: redisConfig.connection,
  defaultJobOptions: {
    ...redisConfig.defaultJobOptions,
    // Seek-specific override — capped at 2 attempts instead of the shared
    // 1000. Other queues (linkedin, cv, match-rescore) keep the shared
    // default untouched.
    attempts: 2,
  },
});

seekQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

export default seekQueue;