import TemplateStageModel from "./template-stage.model.js";

class TemplateStageService {
  async getAll() {
    return await TemplateStageModel.getAll();
  }

  async getById(id) {
    const template = await TemplateStageModel.getById(id);
    if (!template) {
      throw { status: 404, message: 'Template not found' };
    }
    const stages = await TemplateStageModel.getStagesByTemplateId(id);
    return { ...template, stages };
  }
}

export default new TemplateStageService();
