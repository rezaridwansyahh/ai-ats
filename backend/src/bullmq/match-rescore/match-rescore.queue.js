import { Queue } from 'bullmq';
import redisConfig from '../../queue/connection.js'

const matchRescoreQueue = new Queue('match-rescore', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential' },
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 3600 },
  },
});

matchRescoreQueue.on('error', (error) => {
  console.error('[Match-Rescore Queue] error:', error);
});

export default matchRescoreQueue;
