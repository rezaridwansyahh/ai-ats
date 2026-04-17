import jobSourceService from './job-source.service.js';

class JobSourceController {
  async getAll(req, res) {
    try {
      const postings = await jobSourceService.getAll();
      res.status(200).json({ message: 'List all Job Postings', postings });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    const { id } = req.params
    try {
      const posting = await jobSourceService.getById(id);
      res.status(200).json({ message: 'Job Posting found', posting });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByUserId(req, res) {
    try {
      const { user, postings } = await jobSourceService.getByUserId(req.params.user_id);
      res.status(200).json({ message: 'List of Job Postings for this User', user, postings });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobId(req, res) {
    try {
      const { job, postings } = await jobSourceService.getByJobId(req.params.job_id);
      res.status(200).json({ message: 'List of Job Postings for this Job', postings });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobPostId(req, res) {
    try {
      const { jobPost, postings } = await jobSourceService.getByJobPostId(req.params.job_post_id);
      res.status(200).json({ message: 'List of Job Postings for this Job', postings });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByUserIdAndStatus(req, res) {
    try {
      const { user, postings, status } = await jobSourceService.getByUserIdAndStatus(req.params.user_id, req.query.status);
      res.status(200).json({ message: `List of ${status} Job Postings for this User`, user, postings });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getFullById(req, res) {
    try {
      const fullPosting = await jobSourceService.getFullById(req.params.id);
      res.status(200).json({ message: 'Full Job Posting details', posting: fullPosting });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getSeekByUserId(req, res) {
    try {
      const { user, postings } = await jobSourceService.getSeekByUserId(req.params.user_id);
      res.status(200).json({ message: 'List of full Job Postings for this User', user, postings });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async submitSeek(req, res) {
    try {
      const { user_id, service, dataForm } = req.body;
      const result = await jobSourceService.submitSeek(user_id, service, dataForm);
      res.status(201).json({ message: 'Seek Job Posting submitted', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { job_title, job_desc, job_location, work_option, work_type } = req.body;
      const fields = {};
      if (job_title)    fields.job_title    = job_title;
      if (job_desc)     fields.job_desc     = job_desc;
      if (job_location) fields.job_location = job_location;
      if (work_option)  fields.work_option  = work_option;
      if (work_type)    fields.work_type    = work_type;

      const updatedPosting = await jobPostService.update(req.params.id, fields);
      res.status(200).json({ message: 'Job Posting updated', updatedPosting });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const updatedPosting = await jobPostService.updateStatus(req.params.id, req.body.status);
      res.status(200).json({ message: `Job Posting status updated to ${req.body.status}`, updatedPosting });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const posting = await jobPostService.delete(req.params.id);
      res.status(200).json({ message: 'Job Posting deleted', posting });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new JobSourceController();