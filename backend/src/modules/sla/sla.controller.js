import SlaService from "./sla.service.js";

class SlaController {
  async getByJobId(req, res) {
    try {
      const result = await SlaService.getByJobId(req.params.jobId);
      res.status(200).json({ message: 'SLA data', data: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async save(req, res) {
    try {
      const { stages, sla_deadline_days } = req.body;
      const result = await SlaService.save(req.params.jobId, stages, sla_deadline_days);
      res.status(200).json({ message: 'SLA saved', data: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new SlaController();
