import PortalOnboardingService from './portal-onboarding.service.js';
import OnboardingJourneyService from './onboarding-journey/onboarding-journey.service.js';
import CertificateService from './certificate/certificate.service.js';

class PortalOnboardingController {

  async login(req, res) {
    try {
      const { email } = req.body || {};
      const result = await PortalOnboardingService.login(email);
      res.status(200).json({ message: 'Login successful', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getMe(req, res) {
    try {
      const result = await PortalOnboardingService.getMe(req.onboardingId);
      res.status(200).json({ message: 'Onboarding fetched', onboarding: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getCurriculum(req, res) {
    try {
      const result = await PortalOnboardingService.getCurriculum(req.onboardingId);
      res.status(200).json({ message: 'Curriculum fetched', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getJourney(req, res) {
    try {
      const result = await OnboardingJourneyService.getJourney(req.onboardingId);
      res.status(200).json({ message: 'Journey fetched', journey: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getModuleDetail(req, res) {
    try {
      const { module_id } = req.params;
      const result = await PortalOnboardingService.getModuleDetail(req.onboardingId, module_id);
      res.status(200).json({ message: 'Module fetched', module: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async markModuleDone(req, res) {
    try {
      const { module_id } = req.params;
      const result = await PortalOnboardingService.markModuleDone(req.onboardingId, module_id);
      res.status(200).json({ message: 'Module marked complete', module: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async listCertificates(req, res) {
    try {
      const result = await CertificateService.listForCandidate(req.onboardingId);
      res.status(200).json({ message: 'Certificates fetched', certificates: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getCertificate(req, res) {
    try {
      const { certificate_id } = req.params;
      const result = await CertificateService.getOne(req.onboardingId, certificate_id);
      res.status(200).json({ message: 'Certificate fetched', certificate: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

}

export default new PortalOnboardingController();