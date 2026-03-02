import linkedinService from "./linkedin.service.js";

class LinkedInController {
  async jobPostRpa(req, res) {
    const data = {
      user_id: 1,
      service: "linkedin",
      dataForm: {}
    } // data here not yet used, the data for job posting still hardcoded in the service (changed to req.body);

    try {
      const jobPost = await linkedinService.jobPost(data);
      return res.status(200).json({ message: "success" }) // not yet good
    } catch(err) {
      return res.status(500).json({
        status: 'error',
        retry: true,
        message: err.message
      });
    }
  }

  async projectCreateRpa(req, res) {
    const data = {
      user_id: 1,
      service: "linkedin",
      dataForm: {}
    } // data here not yet used, the data for job posting still hardcoded in the service (changed to req.body);

    try {
      const projectCreate = await linkedinService.projectCreate(data);
      return res.status(200).json({ message: "success" }) // not yet good
    } catch(err) {
      return res.status(500).json({
        status: 'error',
        retry: true,
        message: err.message
      });
    }
  }
}

export default new LinkedInController();
