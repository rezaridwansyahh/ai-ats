import jwt from 'jsonwebtoken';
import portalAssessmentService from './portal-assessment.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

class PortalAssessmentController {
  async getByHash(req, res) {
    try {
      const session = await portalAssessmentService.getByHash(req.params.hash);
      res.status(200).json({ message: 'Invitation found', session });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { email } = req.body || {};
      const result = await portalAssessmentService.verifyEmail(req.params.hash, email);
      res.status(200).json({ message: 'Email verified', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  }

  async requirePortalAuth(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Missing portal token.' });

      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.scope !== 'portal') {
        return res.status(403).json({ message: 'Wrong token scope.' });
      }

      const session = await portalAssessmentService.getByHash(req.params.hash);
      if (!session) return res.status(404).json({ message: 'Invalid invitation link.' });

      req.portalSessionId = payload.session_id;
      next();
    } catch {
      return res.status(403).json({ message: 'Invalid or expired portal token.' });
    }
  }

  async getForm(req, res) {
    // Placeholder — real assessment form ships in a later slice.
    res.status(200).json({
      message: 'Form not yet implemented',
      session_id: req.portalSessionId,
    });
  }

  async updateParticipant(req, res) {
    try {
      const result = await portalAssessmentService.updateParticipant({
        sessionId: req.portalSessionId,
        fields: req.body || {},
      });
      res.status(200).json({ message: 'Participant updated', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  }

  async startAttempt(req, res) {
    try {
      const result = await portalAssessmentService.startAttempt({ sessionId: req.portalSessionId });
      res.status(200).json({ message: 'Attempt started', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  }

  async getQuestions(req, res) {
    try {
      const result = await portalAssessmentService.getQuestions({ sessionId: req.portalSessionId });
      res.status(200).json({ message: 'Questions for assessment', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  }

  async getProgress(req, res) {
    try {
      const result = await portalAssessmentService.getProgress({ sessionId: req.portalSessionId });
      res.status(200).json({ message: 'Progress for attempt', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  }

  async saveAnswer(req, res) {
    try {
      const { result_id, question_id, answer, is_correct, score_earned } = req.body;
      const row = await portalAssessmentService.saveAnswer({ result_id, question_id, answer, is_correct, score_earned });
      res.status(200).json({ message: 'Answer saved', answer: row });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  }

  async saveSubtestScore(req, res) {
    try {
      const { result_id, subtest_id, score } = req.body;
      const row = await portalAssessmentService.saveSubtestScore({ result_id, subtest_id, score });
      res.status(200).json({ message: 'Score saved', score: row });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  }

  async submit(req, res) {
    try {
      const { results, summary } = req.body || {};
      const result = await portalAssessmentService.submit({
        sessionId: req.portalSessionId,
        results,
        summary,
      });
      res.status(201).json({ message: 'Submission accepted', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  }
}

export default new PortalAssessmentController();
