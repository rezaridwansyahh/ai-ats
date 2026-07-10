import applicantService from './applicant.service.js';
import companyService from '../company/company.service.js';
import userService from '../user/user.service.js';

class ApplicantController {
  async getAll(req, res) {
    try {
      const applicants = await applicantService.getAll();
      res.status(200).json({ message: 'List all applicants', applicants });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getAllByCompanyId(req, res) {
    const userData = req.user;
    const companyId = Number(req.params.company_id);

    try {
      const user = await userService.getById(userData.user_id);

      if(user.company_id !== companyId) return res.status(403).json({ message: "Forbidden" });

      const applicants = await applicantService.getAllByCompanyId(companyId);
      res.status(200).json({ message: `List all applicants of Company Id : ${companyId}`, applicants });
    } catch(err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getAllByCompanyWithScore(req, res) {
    const userData = req.user;
    const companyId = Number(req.params.company_id);

    try {
      const user = await userService.getById(userData.user_id);

      if(user.company_id !== companyId) return res.status(403).json({ message: "Forbidden" });

      const applicants = await applicantService.getAllByCompanyWithScore(companyId);
      res.status(200).json({ message: `List all applicants with score of Company Id : ${companyId}`, applicants });
    } catch(err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobSourcingId(req, res) {
    try {
      const applicants = await applicantService.getByJobSourcingId(req.params.job_sourcing_id);
      res.status(200).json({ message: 'Applicants for job sourcing', applicants });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const applicant = await applicantService.getById(req.params.id);
      res.status(200).json({ message: 'Applicant found', applicant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const applicant = await applicantService.delete(req.params.id);
      res.status(200).json({ message: 'Applicant deleted', applicant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async downloadCv(req, res) {
    try {
      const filePath = await applicantService.getCv(req.params.id);
      res.download(filePath);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new ApplicantController();
