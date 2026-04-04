import { Worker } from ('bullmq');
const redisConfig = require('../config/redis.js');
const CrawlerService = require('../services/crawlerService');
const crawlerService = new CrawlerService(browserPool);

const scrapingWorker = new Worker(
  'scraping',
  async (job) => {
    console.log(`[Worker] Processing ${job.name} - Job ID: ${job.id}`);

    const { page } = await crawlerService.createAuthenticatedPage();

    try {
      switch (job.name) {
        case 'crawl-job-application-type':
          return await crawlerService.crawlJobApplicationTypes(page, job.data, job.id);

        case 'crawl-job-applications':
          return await crawlerService.crawlJobApplications(page, job.data, job.id);

        case 'crawl-candidate-type':
          return await crawlerService.crawlCandidateTypes(page, job.data, job.id);

        case 'crawl-candidates':
          return await crawlerService.crawlCandidates(page, job.data, job.id);

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } finally {
      await page.close();
    }
  },
  {
    connection: redisConfig.connection,
    concurrency: 1,
  }
);

// Event Listeners
scrapingWorker.on('completed', (job) => {
  console.log(`[Worker] ${job.name} completed - Job ID: ${job.id}`);
});

scrapingWorker.on('failed', (job, err) => {
  console.error(`[Worker] ${job.name} failed - Job ID: ${job.id}`, err.message);
});

scrapingWorker.on('active', (job) => {
  console.log(`[Worker] ${job.name} started - Job ID: ${job.id}`);
});

scrapingWorker.on('error', (error) => {
  console.error('[Worker] Worker error:', error);
});
module.exports = scrapingWorker;