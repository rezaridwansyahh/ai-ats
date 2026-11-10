import { Queue } from 'bullmq';
import redisConfig from '../../queue/connection.js'

const cvQueue = new Queue('cv', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential' },
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 3600 },
  },
});

cvQueue.on('error', (error) => {
  console.error('[CV Queue] error:', error);
});

export default cvQueue;
