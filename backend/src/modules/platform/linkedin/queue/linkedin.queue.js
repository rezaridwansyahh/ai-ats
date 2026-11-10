import { Queue } from 'bullmq';
import connection from '../../../../queue/connection.js';

const linkedinQueue = new Queue('linkedin-platform', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential' },
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 3600 },
  },
});

linkedinQueue.on('error', (error) => {
  console.error('LinkedIn Queue error:', error);
});

export default linkedinQueue;
