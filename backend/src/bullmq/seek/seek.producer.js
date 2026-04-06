import seekQueue from "./seek.queue.js";

class SeekProducer {
  async createSeekJobPost(account_id, service, dataForm) {
    const job = await seekQueue.add('seek-create-job-post', {
      account_id,
      service,
      dataForm
    });

    return job;
  }

  async createSeekJobPostDraft(account_id, service, job_id, dataForm) {
    const job = await seekQueue.add('seek-create-job-post-draft', {
      account_id,
      service,
      job_id,
      dataForm
    });
  
    return job;
  }

  async deleteSeekJobPostDraft(job_posting_id, account_id) {
    const job = await seekQueue.add('seek-delete-job-post-draft', {
      job_posting_id,
      account_id
    });

    return job;
  }

  async updateSeekJobPostDraft(job_posting_id, account_id, dataForm) {
    const job = await seekQueue.add('seek-update-job-post-draft', {
      job_posting_id,
      account_id,
      dataForm
    });

    return job;
  }

  async extractSeekCandidate(account_id, job_posting_id) {
    const job = await seekQueue.add('seek-extract-candidate', {
      account_id,
      job_posting_id
    });

    return job;
  }

  async syncSeekJobPost(account_id) {
    const job = await seekQueue.add('seek-sync-job-post', {
      account_id
    });

    return job;
  } 
}

export default new SeekProducer();