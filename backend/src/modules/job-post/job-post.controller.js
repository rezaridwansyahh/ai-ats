import jobPostService from './job-post.service.js';

class JobPostController {
  async getAll(req, res) {
    try {
      const jobPosts = await jobPostService.getAll();
      res.status(200).json({ message: "List all job posts", jobPosts });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const jobPost = await jobPostService.getById(req.params.id);
      res.status(200).json({ message: "Job post details", jobPost });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobId(req, res) {
    try {
      const jobPosts = await jobPostService.getByJobId(req.params.job_id);
      res.status(200).json({ message: "Job posts for job", jobPosts });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const jobPost = await jobPostService.create(req.body);
      res.status(201).json({ message: "Job post created successfully", jobPost });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const jobPost = await jobPostService.update(req.params.id, req.body);
      res.status(200).json({ message: "Job post updated successfully", jobPost });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const jobPost = await jobPostService.delete(req.params.id);
      res.status(200).json({ message: "Job post deleted successfully", jobPost });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async publish(req, res) {
    try {
      const user_id = req.user?.id ?? req.body.user_id;
      const result = await jobPostService.publish({ ...req.body, user_id });
      res.status(201).json({ message: "Job published", ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new JobPostController();
