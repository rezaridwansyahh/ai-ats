import PipelineService from "./pipeline.service.js";

class PipelineController {
  async getByJobId(req, res) {
    try {
      const result = await PipelineService.getByJobId(req.params.jobId);
      res.status(200).json({ message: 'Pipeline stages', data: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async saveStages(req, res) {
    try {
      const { stages, templateId } = req.body;
      const result = await PipelineService.saveStages(req.params.jobId, stages, templateId);
      res.status(200).json({ message: 'Pipeline stages saved', data: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new PipelineController();
