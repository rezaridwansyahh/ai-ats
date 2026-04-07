import TemplateStageService from "./template-stage.service.js";

class TemplateStageController {
  async getAll(req, res) {
    try {
      const data = await TemplateStageService.getAll();
      res.status(200).json({ message: 'Template stages', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const data = await TemplateStageService.getById(req.params.id);
      res.status(200).json({ message: 'Template stage detail', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new TemplateStageController();
