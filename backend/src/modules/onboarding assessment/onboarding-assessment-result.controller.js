import OnboardingAssessmentResultService from './onboarding-assessment-result.service.js';

class OnboardingAssessmentResultController {
  async getCatalog(req, res) {
    try {
      const catalog = await OnboardingAssessmentResultService.getCatalog();
      res.status(200).json({ message: 'Assessment catalog', catalog });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getMyResults(req, res) {
    try {
      const results = await OnboardingAssessmentResultService.getResultsForOnboarding(req.onboardingId);
      res.status(200).json({ message: 'Your assessment results', results });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByCode(req, res) {
    try {
      const { battery } = req.params;
      const result = await OnboardingAssessmentResultService.getByBattery(req.onboardingId, battery);
      res.status(200).json({ message: 'Result fetched', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async submit(req, res) {
    try {
      const { battery, results, summary, started_at } = req.body;
      const result = await OnboardingAssessmentResultService.submit({
        candidate_onboarding_id: req.onboardingId,
        battery, results, summary, started_at,
      });
      res.status(201).json({ message: 'Assessment submitted', result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new OnboardingAssessmentResultController();