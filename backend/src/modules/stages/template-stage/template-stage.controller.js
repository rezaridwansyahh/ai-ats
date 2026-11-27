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

  async create(req, res) {
    try {
      const data = await TemplateStageService.create(req.body);
      res.status(201).json({ message: 'Template created', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const data = await TemplateStageService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Template updated', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const data = await TemplateStageService.delete(req.params.id);
      res.status(200).json({ message: 'Template deleted', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async addStage(req, res) {
    try {
      const data = await TemplateStageService.addStage(req.params.id, req.body);
      res.status(201).json({ message: 'Stage added', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateStage(req, res) {
    try {
      const data = await TemplateStageService.updateStage(req.params.stageId, req.body);
      res.status(200).json({ message: 'Stage updated', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async deleteStage(req, res) {
    try {
      const data = await TemplateStageService.deleteStage(req.params.stageId);
      res.status(200).json({ message: 'Stage deleted', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new TemplateStageController();
