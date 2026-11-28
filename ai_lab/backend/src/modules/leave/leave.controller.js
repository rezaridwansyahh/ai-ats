import leaveService from './leave.service.js';

class LeaveController {
  async getAll(req, res) {
    try {
      const result = await leaveService.getAll(req.query);
      res.status(200).json({ message: 'List leave requests', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const result = await leaveService.create(req.body);
      res.status(201).json({ message: 'Leave request created', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getLink(req, res) {
    try {
      const result = await leaveService.getLink(req.params.id);
      res.status(200).json({ message: 'Approval link', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async resend(req, res) {
    try {
      const result = await leaveService.resend(req.params.id);
      res.status(200).json({ message: 'Approval link regenerated', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getSaldo(req, res) {
    try {
      const result = await leaveService.getSaldo(req.query);
      res.status(200).json({ message: 'Leave balances', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getSaldoByNik(req, res) {
    try {
      const result = await leaveService.getSaldoByNik(req.params.nik, req.query);
      res.status(200).json({ message: 'Leave balance', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async setBalance(req, res) {
    try {
      const result = await leaveService.setBalance(req.params.nik, req.body);
      res.status(200).json({ message: 'Leave balance saved', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new LeaveController();