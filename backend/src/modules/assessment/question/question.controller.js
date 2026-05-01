import questionService from './question.service.js';

class QuestionController {
  async getAllAssessments(req, res) {
    try {
      const assessments = await questionService.getAllAssessments();
      res.status(200).json({ message: 'List all assessments', assessments });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByAssessmentCode(req, res) {
    try {
      const questions = await questionService.getQuestionsByCode(req.params.code);
      res.status(200).json({ message: 'Questions for assessment', questions });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getBySubtest(req, res) {
    try {
      const items = await questionService.getSubtestByCode(req.params.code, req.params.subtest);
      res.status(200).json({ message: 'Questions for subtest', subtest: req.params.subtest, items });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const assessment = await questionService.getById(req.params.id);
      res.status(200).json({ message: 'Assessment found', assessment });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new QuestionController();
