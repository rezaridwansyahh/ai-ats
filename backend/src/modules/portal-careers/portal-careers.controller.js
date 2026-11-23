import portalCareersService from './portal-careers.service.js';

class PortalCareersController {
  getRecaptchaConfig(req, res) {
    res.json(portalCareersService.getRecaptchaConfig());
  }

  async getCompanyCareers(req, res) {
    try {
      const data = await portalCareersService.getCompanyCareers(req.params.slug);
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getJobDetail(req, res) {
    try {
      const data = await portalCareersService.getJobDetail(req.params.slug, req.params.job_id);
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async apply(req, res) {
    try {
      const result = await portalCareersService.submitApplication(
        req.params.slug,
        req.params.job_id,
        req.body,
        req.file
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new PortalCareersController();
