import automationService from './automation.service.js';

class AutomationController {
  async getAll(req, res) {
    try {
      const automations = await automationService.getAll();
      res.status(200).json({ message: 'List all automation settings', data: automations });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobId(req, res) {
    try {
      const automation = await automationService.getByJobId(req.params.jobId);
      res.status(200).json({ message: 'Automation setting details', data: automation });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const automation = await automationService.create(req.body);
      res.status(201).json({ message: 'Automation setting created successfully', data: automation });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const automation = await automationService.update(req.params.jobId, req.body);
      res.status(200).json({ message: 'Automation setting updated successfully', data: automation });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AutomationController();
