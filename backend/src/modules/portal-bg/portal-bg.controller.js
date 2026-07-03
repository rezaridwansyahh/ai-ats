import jwt from 'jsonwebtoken';
import portalBgConsentService from './portal-bg.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

class PortalBgConsentController {

  async getByToken(req, res) {
    try {
      const result = await portalBgConsentService.getByToken(req.params.token);
      res.status(200).json({ message: 'Consent found', consent: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { email } = req.body || {};
      const result = await portalBgConsentService.verifyEmail(req.params.token, email);
      res.status(200).json({ message: 'Email verified', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // Middleware — verify bg_consent JWT
  async requireBgConsentAuth(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Missing consent token.' });

      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.scope !== 'bg_consent') {
        return res.status(403).json({ message: 'Wrong token scope.' });
      }
      req.bgConsentId = payload.bg_consent_id;
      next();
    } catch {
      return res.status(403).json({ message: 'Invalid or expired consent token.' });
    }
  }

  // JWT-protected — get full consent document
  async getConsent(req, res) {
    try {
      const result = await portalBgConsentService.getConsent(
        req.params.token,
        req.bgConsentId
      );
      res.status(200).json({ message: 'Consent fetched', consent: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // JWT-protected — sign
  async sign(req, res) {
    try {
      const result = await portalBgConsentService.sign(
        req.params.token,
        req.bgConsentId
      );
      res.status(200).json({ message: 'Consent signed', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

}

export default new PortalBgConsentController();