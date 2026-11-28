import portalLeaveService from './portal-leave.service.js';

class PortalLeaveController {
  async getByToken(req, res) {
    try {
      const request = await portalLeaveService.getByToken(req.params.token);
      res.status(200).json({ message: 'Leave request found', request });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async decide(req, res) {
    try {
      const result = await portalLeaveService.decide(req.params.token, req.body);
      res.status(200).json({ message: 'Decision saved', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new PortalLeaveController();