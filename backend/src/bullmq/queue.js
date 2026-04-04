import { Queue } from ('bullmq');
import redisConfig from ('../config/redis.js');

const scrapingQueue = new Queue('scraping', {
  connection: redisConfig.connection,
  defaultJobOptions: redisConfig.defaultJobOptions,
});

scrapingQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

export default scrapingQueue;