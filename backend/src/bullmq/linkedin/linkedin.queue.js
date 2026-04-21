import { Queue } from 'bullmq'
import redisConfig from '../../config/redis.js';

const linkedinQueue = new Queue('linkedin', {
  connection: redisConfig.connection,
  defaultJobOptions: redisConfig.defaultJobOptions,
});

linkedinQueue.on('error', (error) => {
  console.error('LinkedIn Queue error:', error);
});

export default linkedinQueue;
