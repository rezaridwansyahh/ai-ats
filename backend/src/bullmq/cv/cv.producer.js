import cvQueue from './cv.queue.js';

class CvProducer {
  async processZip({ batchId, tempFilePath, companyId }) {
    const job = await cvQueue.add('cv-zip-process', {
      batchId,
      tempFilePath,
      companyId,
    });
    return job;
  }
}

export default new CvProducer();
