import JobPostingLinkedIn from '../model/JobPostingLinkedInModel.js';
import JobPosting from '../model/JobPostingModel.js';

class JobPostingLinkedInController {
  static async getAll(req, res) {
    try {
      const linkedinPostings = await JobPostingLinkedIn.getAll();

      res.status(200).json({
        message: 'List all LinkedIn Job Postings',
        linkedinPostings
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getById(req, res) {
    const { id } = req.params;

    try {
      const linkedinPosting = await JobPostingLinkedIn.getById(id);

      if (!linkedinPosting) {
        return res.status(404).json({ message: 'LinkedIn Job Posting not found' });
      }

      res.status(200).json({
        message: 'LinkedIn Job Posting found',
        linkedinPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getByJobPostingId(req, res) {
    const { job_posting_id } = req.params;

    try {
      const posting = await JobPosting.getById(job_posting_id);
      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      const linkedinPosting = await JobPostingLinkedIn.getByJobPostingId(job_posting_id);
      if (!linkedinPosting) {
        return res.status(404).json({ message: 'LinkedIn details not found for this Job Posting' });
      }

      res.status(200).json({
        message: 'LinkedIn Job Posting found',
        linkedinPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getDetailsByJobPostingId(req, res) {
    const { job_posting_id } = req.params;

    try {
      const posting = await JobPosting.getById(job_posting_id);
      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      const fullPosting = await JobPostingLinkedIn.getDetailsByJobPostingId(job_posting_id);
      if (!fullPosting) {
        return res.status(404).json({ message: 'LinkedIn details not found for this Job Posting' });
      }

      res.status(200).json({
        message: 'Full LinkedIn Job Posting details',
        fullPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async update(req, res) {
    const { job_posting_id } = req.params;
    const { ...body } = req.body;

    const fields = {};
    // placeholder for future linkedin-specific fields
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined && body[key] !== null) {
        fields[key] = body[key];
      }
    });

    try {
      if (Object.keys(fields).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update' });
      }

      const posting = await JobPosting.getById(job_posting_id);
      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      const linkedinPosting = await JobPostingLinkedIn.getByJobPostingId(job_posting_id);
      if (!linkedinPosting) {
        return res.status(404).json({ message: 'LinkedIn details not found for this Job Posting' });
      }

      const updatedLinkedInPosting = await JobPostingLinkedIn.update(job_posting_id, fields);

      res.status(200).json({
        message: 'LinkedIn Job Posting updated',
        updatedLinkedInPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async delete(req, res) {
    const { job_posting_id } = req.params;

    try {
      const posting = await JobPosting.getById(job_posting_id);
      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      const linkedinPosting = await JobPostingLinkedIn.getByJobPostingId(job_posting_id);
      if (!linkedinPosting) {
        return res.status(404).json({ message: 'LinkedIn details not found for this Job Posting' });
      }

      await JobPostingLinkedIn.delete(job_posting_id);

      res.status(200).json({
        message: 'LinkedIn Job Posting deleted',
        linkedinPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

export default JobPostingLinkedInController;