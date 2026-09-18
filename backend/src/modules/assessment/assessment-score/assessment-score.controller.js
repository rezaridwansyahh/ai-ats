import assessmentScoreService from './assessment-score.service.js';

class AssessmentScoreController {
  async upsert(req, res) {
    try {
      const { result_id, subtest_id, score } = req.body;
      const row = await assessmentScoreService.upsert({ result_id, subtest_id, score });
      res.status(200).json({ message: 'Score saved', score: row });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByResultId(req, res) {
    try {
      const scores = await assessmentScoreService.getByResultId(req.params.result_id);
      res.status(200).json({ message: 'Scores for result', scores });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AssessmentScoreController();
