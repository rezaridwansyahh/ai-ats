import seekService from "./seek.service.js";

class SeekController {
  async jobPostRpa(req, res) {
    const { user_id, account_id, service, dataForm } = req.body // data here not yet used, the data for job posting still hardcoded in the service (changed to req.body);

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
    const { account_id, service, dataForm } = req.body // data here not yet used, the data for job posting still hardcoded in the service (changed to req.body);

    try {
      const jobPost = await seekService.jobPostDraft(account_id, service, dataForm);
      return res.status(200).json({ message: "success", jobPost }) // not yet good
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
    const { account_id, application_id, candidate_type } = req.body;

    try {
      const result = await seekService.extractCandidates(account_id, application_id, candidate_type);
      return res.status(200).json({ message: "success", ...result });
    } catch (err) {
      return res.status(err.status || 500).json({
        message: err.message
      });
    }
  }

  async jobPostSyncRpa(req, res) {
    const { account_id } = req.body;

    try {
      const extractedJobPost = await seekService.syncJobPostAll(account_id);

      return res.status(200).json({ message: "success", extractedJobPost });
    } catch(err) {
      return res.status(500).json({
        message: err.message
      });
    }
  }
}

export default new SeekController();
