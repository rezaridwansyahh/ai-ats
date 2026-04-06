import { Queue } from 'bullmq'
import redisConfig from '../../config/redis.js';

const seekQueue = new Queue('seek', {
  connection: redisConfig.connection,
  defaultJobOptions: redisConfig.defaultJobOptions,
});

seekQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

export default seekQueue;