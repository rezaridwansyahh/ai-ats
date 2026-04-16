import questionService from './question.service.js';

class QuestionController {
  async getAll(req, res) {
    try {
      const questions = await questionService.getAll();
      res.status(200).json({ message: 'List all questions', questions });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const question = await questionService.getById(req.params.id);
      res.status(200).json({ message: 'Question found', question });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { text, options, correct, points } = req.body;
      const question = await questionService.create(text, options, correct, points);
      res.status(201).json({ message: 'Question created', question });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const question = await questionService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Question updated', question });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const question = await questionService.delete(req.params.id);
      res.status(200).json({ message: 'Question deleted', question });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new QuestionController();
