import linkedinQueue from "./linkedin.queue.js";

class LinkedInProducer {
  async recruiteSearch(sourcing_id, account_id, dataForm) {
    const job = await linkedinQueue.add('linkedin-recruite-search', {
      sourcing_id,
      account_id,
      dataForm,
    });
    return job;
  }
}

export default new LinkedInProducer();
