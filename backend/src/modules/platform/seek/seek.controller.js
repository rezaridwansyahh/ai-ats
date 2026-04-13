import seekService from "./seek.service.js";
import SeekProducer from "../../../bullmq/seek/seek.producer.js";
import seekQueue from "../../../bullmq/seek/seek.queue.js";
import seekProducer from "../../../bullmq/seek/seek.producer.js";

class SeekController {
  async jobPostRpa(req, res) {
    const { account_id, service, dataForm } = req.body 

    try {
      const jobPost = await seekService.jobPost(user_id, account_id, service, dataForm);
      return res.status(200).json({ message: "success" }) // not yet good
    } catch(err) {
      return res.status(500).json({
        status: 'error',
        retry: true,
        message: err.message
      });
    }
  }

  async jobPostDraftRpa(req, res) {
    const { account_id, service, job_id, dataForm } = req.body;

    try {
      const jobPost = await SeekProducer.createSeekJobPostDraft(account_id, service, job_id, dataForm);
      return res.status(200).json({ message: "create seek job post draft queued succesfully", jobPost }) // not yet good
    } catch(err) {
      return res.status(500).json({
        status: 'error',
        retry: true,
        message: err.message
      });
    }
  }

  async deleteJobPostDraftRpa(req, res) {
    const { job_posting_id, user_id, account_id, service } = req.body;

    try {
      const deleteJobPost = await seekService.deleteJobPostDraft(job_posting_id, account_id, user_id, service);
      return res.status(200).json({ message: "success delete", deleteJobPost });
    } catch(err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }

  async updateJobPostDraftRpa(req, res) {
    const { job_posting_id, account_id, dataForm } = req.body;

    try {
      const updateJobPostDraft = await seekService.updateJobPostDraft(job_posting_id, account_id, dataForm);
      return res.status(200).json({ message: "success update", updateJobPostDraft });
    } catch(err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
  async extractCandidatesRpa(req, res) {
    const { account_id, job_posting_id } = req.body;

    try {
      const result = await seekService.extractCandidates(account_id, job_posting_id);
      return res.status(200).json({ message: "success", ...result });
    } catch (err) {
      return res.status(err.status || 500).json({
        message: err.message
      });
    }
  }

  async getJobStatus(req, res) {
    const { jobId } = req.params;
    try {
      const job = await seekQueue.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      const state = await job.getState();
      return res.status(200).json({
        id: job.id,
        state,
        failedReason: job.failedReason || null,
        finishedOn: job.finishedOn || null,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async jobPostSyncRpa(req, res) {
    const { account_id } = req.body;

    try {
      const extractedJobPost = await seekProducer.syncSeekJobPost(account_id);

      return res.status(200).json({ message: "success", extractedJobPost });
    } catch(err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }

  async syncAllRpa(req, res) {
    const { account_id } = req.body;

    try {
      const synced = await seekProducer.syncAll(account_id);

      return res.status(200).json({ message: "success", synced });
    } catch(err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }

  async checkConnectionRpa(req, res) {
    const { account_id } = req.body;

    try {
      const connection = await seekProducer.checkConnection(account_id);

      return res.status(200).json({ message: "check connection queued", connection });
    } catch(err) {
      return res.status(500).json({
        message: err.message
      })
    }
  }
}

export default new SeekController();
