import { Queue } from 'bullmq';
import redisConfig from '../../config/redis.js';

const cvQueue = new Queue('cv', {
  connection: redisConfig.connection,
  defaultJobOptions: redisConfig.defaultJobOptions,
});

cvQueue.on('error', (error) => {
  console.error('[CV Queue] error:', error);
});

export default cvQueue;
