import assessmentAnswerService from './assessment-answer.service.js';

class AssessmentAnswerController {
  async upsert(req, res) {
    try {
      const { result_id, question_id, answer, is_correct, score_earned } = req.body;
      const row = await assessmentAnswerService.upsert({ result_id, question_id, answer, is_correct, score_earned });
      res.status(200).json({ message: 'Answer saved', answer: row });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByResultId(req, res) {
    try {
      const answers = await assessmentAnswerService.getByResultId(req.params.result_id);
      res.status(200).json({ message: 'Answers for result', answers });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AssessmentAnswerController();
