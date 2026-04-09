import slaService from "./sla.service.js";

class SlaController {
  async getByJobId(req, res) {
    try {
      const sla = await slaService.getByJobId(req.params.jobId);
      res.status(200).json({ message: 'SLA details', data: sla });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const sla = await slaService.create(req.params.jobId, req.body);
      res.status(201).json({ message: 'SLA created successfully', data: sla });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new SlaController();
