import portalBgConsentService from './portal-bg.service.js';

class PortalBgConsentController {

  async getByToken(req, res) {
    try {
      const result = await portalBgConsentService.getByToken(req.params.token);
      res.status(200).json({ message: 'Consent found', consent: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async sign(req, res) {
    try {
      const result = await portalBgConsentService.sign(req.params.token);
      res.status(200).json({ message: 'Consent signed', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

}

export default new PortalBgConsentController();