import jwt from 'jsonwebtoken';
import portalQaService from './portal-qa.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

class PortalQaController {
  async getByToken(req, res) {
    try {
      const qa = await portalQaService.getByToken(req.params.token);
      res.status(200).json({ message: 'Q&A found', qa });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { email } = req.body || {};
      const result = await portalQaService.verifyEmail(req.params.token, email);
      res.status(200).json({ message: 'Email verified', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async requireQaAuth(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Missing Q&A token.' });

      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.scope !== 'qa') {
        return res.status(403).json({ message: 'Wrong token scope.' });
      }
      req.screeningQaId = payload.screening_qa_id;
      next();
    } catch {
      return res.status(403).json({ message: 'Invalid or expired Q&A token.' });
    }
  }

  async getQuestions(req, res) {
    try {
      const qa = await portalQaService.getQuestions(req.params.token, req.screeningQaId);
      res.status(200).json({ message: 'Q&A questions', qa });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async submit(req, res) {
    try {
      const { answers } = req.body || {};
      const result = await portalQaService.submit(req.params.token, req.screeningQaId, answers);
      res.status(200).json({ message: 'Answers submitted', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new PortalQaController();
