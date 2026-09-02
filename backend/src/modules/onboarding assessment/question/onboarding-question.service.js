import OnboardingQuestion from './onboarding-question.model.js';

class OnboardingQuestionService {
  async getAllAssessments() {
    return await OnboardingQuestion.getAllAssessments();
  }

  async getById(id) {
    const assessment = await OnboardingQuestion.getById(id);
    if (!assessment) throw { status: 404, message: 'Assessment not found' };
    return assessment;
  }

  async getByAssessmentCode(code) {
    if (!code) throw { status: 400, message: 'assessment_code is required' };
    const assessment = await OnboardingQuestion.getByAssessmentCode(code);
    if (!assessment) throw { status: 404, message: 'Assessment not found' };
    return assessment;
  }

  async getQuestionsByCode(code) {
    if (!code) throw { status: 400, message: 'assessment_code is required' };
    const questions = await OnboardingQuestion.getQuestionsByCode(code);
    if (!questions) throw { status: 404, message: 'Assessment not found' };
    return questions;
  }
}

export default new OnboardingQuestionService();