import onboardingQuestionService from './onboarding-question.service.js';

class OnboardingQuestionController {
  async getAllAssessments(req, res) {
    try {
      const assessments = await onboardingQuestionService.getAllAssessments();
      res.status(200).json({ message: 'List all onboarding assessments', assessments });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByAssessmentCode(req, res) {
    try {
      const questions = await onboardingQuestionService.getQuestionsByCode(req.params.code);
      res.status(200).json({ message: 'Questions for assessment', questions });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const assessment = await onboardingQuestionService.getById(req.params.id);
      res.status(200).json({ message: 'Assessment found', assessment });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new OnboardingQuestionController();