import JobPosting from '../model/JobPostingModel.js';
import JobPostingSeek from '../model/JobPostingSeekModel.js';
import JobPostingLinkedIn from '../model/JobPostingLinkedInModel.js';
import JobAccount from '../model/JobAccountModel.js';
import User from '../model/UserModel.js';

class JobPostingController {
  static async getAll(req, res) {
    try {
      const postings = await JobPosting.getAll();

      res.status(200).json({
        message: 'List all Job Postings',
        postings
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getById(req, res) {
    const { id } = req.params;

    try {
      const posting = await JobPosting.getById(id);

      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      res.status(200).json({
        message: 'Job Posting found',
        posting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getByUserId(req, res) {
    const { user_id } = req.params;

    try {
      const user = await User.getById(user_id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const postings = await JobPosting.getByUserId(user_id);

      res.status(200).json({
        message: 'List of Job Postings for this User',
        user,
        postings
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getByUserIdAndStatus(req, res) {
    const { user_id } = req.params;
    const { status } = req.query;

    try {
      if (!status) {
        return res.status(400).json({ message: 'status query param is required' });
      }

      const validStatuses = ['Draft', 'Submitted', 'Running', 'Expired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
      }

      const user = await User.getById(user_id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const postings = await JobPosting.getByUserIdAndStatus(user_id, status);

      res.status(200).json({
        message: `List of ${status} Job Postings for this User`,
        user,
        postings
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getFullById(req, res) {
    const { id } = req.params;

    try {
      const posting = await JobPosting.getById(id);
      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      let fullPosting;
      if (posting.platform === 'seek') {
        fullPosting = await JobPosting.getSeek(id);
      } else if (posting.platform === 'linkedin') {
        fullPosting = await JobPostingLinkedIn.getFullByJobPostingId(id);
      } else {
        return res.status(400).json({ message: `Unknown platform: ${posting.platform}` });
      }

      res.status(200).json({
        message: 'Full Job Posting details',
        posting: fullPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getSeekByUserId(req, res) {
    const { user_id } = req.params;

    try {
      const user = await User.getById(user_id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const postings = await JobPosting.getSeekByUserId(user_id);

      res.status(200).json({
        message: 'List of full Job Postings for this User',
        user,
        postings
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async submitSeek(req, res) {
    const { user_id, service, dataForm } = req.body;

    try {
      if (!user_id || !service || !dataForm) {
        return res.status(400).json({ message: 'user_id, service, and dataForm are required' });
      }

      if (service !== 'seek') {
        return res.status(400).json({ message: 'This endpoint only handles seek postings' });
      }

      const {
        jobTitle,
        jobLocation,
        workOption,
        workType,
        payType,
        currency,
        min,
        max,
        display
      } = dataForm;

      if (!jobTitle) {
        return res.status(400).json({ message: 'jobTitle is required in dataForm' });
      }

      const user = await User.getById(user_id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get the seek account for this user
      const account = await JobAccount.getByUserIdAndPortal(user_id, 'seek');
      if (!account) {
        return res.status(404).json({ message: 'No seek account found for this user' });
      }

      if (!account.is_active) {
        return res.status(403).json({ message: 'Seek account is inactive' });
      }

      // Step 1: create parent
      const newPosting = await JobPosting.create(
        account.id,
        'seek',
        jobTitle,
        dataForm.jobDesc || null,
        jobLocation  || null,
        workOption   || null,
        workType     || null
      );

      // Step 2: create seek-specific fields
      const seekDetails = await JobPostingSeek.create(
        newPosting.id,
        currency || null,
        payType  || null,
        min      || null,
        max      || null,
        display  || null
      );

      res.status(201).json({
        message: 'Seek Job Posting submitted',
        posting: newPosting,
        seekDetails
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const { job_title, job_desc, job_location, work_option, work_type } = req.body;

    const fields = {};
    if (job_title)    fields.job_title    = job_title;
    if (job_desc)     fields.job_desc     = job_desc;
    if (job_location) fields.job_location = job_location;
    if (work_option)  fields.work_option  = work_option;
    if (work_type)    fields.work_type    = work_type;

    try {
      if (Object.keys(fields).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update' });
      }

      const posting = await JobPosting.getById(id);
      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      const updatedPosting = await JobPosting.update(id, fields);

      res.status(200).json({
        message: 'Job Posting updated',
        updatedPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async updateStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    try {
      if (!status) {
        return res.status(400).json({ message: 'status is required' });
      }

      const validStatuses = ['Draft', 'Submitted', 'Running', 'Expired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
      }

      const posting = await JobPosting.getById(id);
      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      const updatedPosting = await JobPosting.updateStatus(id, status);

      res.status(200).json({
        message: `Job Posting status updated to ${status}`,
        updatedPosting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async delete(req, res) {
    const { id } = req.params;

    try {
      const posting = await JobPosting.getById(id);
      if (!posting) {
        return res.status(404).json({ message: 'Job Posting not found' });
      }

      await JobPosting.delete(id);

      res.status(200).json({
        message: 'Job Posting deleted',
        posting
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

export default JobPostingController;