import { Queue } from 'bullmq'
import connection from '../../../../queue/connection.js';

const seekQueue = new Queue('seek', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential' },
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 3600 }
  }
});

seekQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

export default seekQueue;