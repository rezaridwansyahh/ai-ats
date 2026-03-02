import JobPostingSeek from '../model/JobPostingSeekModel.js';
import JobPosting from '../model/JobPostingModel.js';

class JobPostingSeekController {
  static async getAll(req, res) {
    try {
      const seekPostings = await JobPostingSeek.getAll();

      res.status(200).json({
        message: 'List all Seek Job Postings',
        seekPostings
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getById(req, res) {
    const { id } = req.params;

    try {
      const seekPosting = await JobPostingSeek.getById(id);

      if (!seekPosting) {
        return res.status(404).json({ message: 'Seek Job Posting not found' });
      }

      res.status(200).json({
        message: 'Seek Job Posting found',
        seekPosting
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

      const seekPosting = await JobPostingSeek.getByJobPostingId(job_posting_id);
      if (!seekPosting) {
        return res.status(404).json({ message: 'Seek details not found for this Job Posting' });
      }

      res.status(200).json({
        message: 'Seek Job Posting found',
        seekPosting
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

      const fullPosting = await JobPostingSeek.getDetailsByJobPostingId(job_posting_id);
      if (!fullPosting) {
        return res.status(404).json({ message: 'Seek details not found for this Job Posting' });
      }

      res.status(200).json({
        message: 'Full Seek Job Posting details',
        fullPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async update(req, res) {
    const { job_posting_id } = req.params;
    const { currency, pay_type, pay_min, pay_max, pay_display } = req.body;

    const fields = {};
    if (currency)    fields.currency    = currency;
    if (pay_type)    fields.pay_type    = pay_type;
    if (pay_min)     fields.pay_min     = pay_min;
    if (pay_max)     fields.pay_max     = pay_max;
    if (pay_display) fields.pay_display = pay_display;

    try {
      if (Object.keys(fields).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update' });
      }

      const posting = await JobPosting.getById(job_posting_id);
      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      const seekPosting = await JobPostingSeek.getByJobPostingId(job_posting_id);
      if (!seekPosting) {
        return res.status(404).json({ message: 'Seek details not found for this Job Posting' });
      }

      const updatedSeekPosting = await JobPostingSeek.update(job_posting_id, fields);

      res.status(200).json({
        message: 'Seek Job Posting updated',
        updatedSeekPosting
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

      const seekPosting = await JobPostingSeek.getByJobPostingId(job_posting_id);
      if (!seekPosting) {
        return res.status(404).json({ message: 'Seek details not found for this Job Posting' });
      }

      await JobPostingSeek.delete(job_posting_id);

      res.status(200).json({
        message: 'Seek Job Posting deleted',
        seekPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

export default JobPostingSeekController;