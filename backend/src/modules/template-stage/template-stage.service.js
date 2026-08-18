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

  async create({ name, sort_order }) {
    const trimmed = (name || '').trim();
    if (!trimmed) throw { status: 400, message: 'Template name is required' };

    const existing = await TemplateStageModel.findByName(trimmed);
    if (existing) throw { status: 409, message: 'A template with this name already exists' };

    const template = await TemplateStageModel.create({ name: trimmed, sort_order });
    return { ...template, stages: [] };
  }

  async update(id, { name, sort_order }) {
    const template = await TemplateStageModel.getById(id);
    if (!template) throw { status: 404, message: 'Template not found' };

    if (name != null) {
      const trimmed = name.trim();
      if (!trimmed) throw { status: 400, message: 'Template name cannot be empty' };
      const existing = await TemplateStageModel.findByName(trimmed);
      if (existing && existing.id !== Number(id)) {
        throw { status: 409, message: 'A template with this name already exists' };
      }
    }

    const updated = await TemplateStageModel.update(id, { name, sort_order });
    if (!updated) throw { status: 404, message: 'Template not found' };
    return updated;
  }

  async delete(id) {
    const deleted = await TemplateStageModel.delete(id);
    if (!deleted) throw { status: 404, message: 'Template not found' };
    return deleted;
  }

  async addStage(templateId, { name, stage_type_id, stage_order }) {
    const template = await TemplateStageModel.getById(templateId);
    if (!template) throw { status: 404, message: 'Template not found' };

    const trimmed = (name || '').trim();
    if (!trimmed) throw { status: 400, message: 'Stage name is required' };
    if (!stage_type_id) throw { status: 400, message: 'stage_type_id is required' };

    return await TemplateStageModel.addStage(templateId, { name: trimmed, stage_type_id, stage_order });
  }

  async updateStage(stageId, { name, stage_type_id }) {
    const stage = await TemplateStageModel.getStageById(stageId);
    if (!stage || stage.master_id == null) {
      throw { status: 404, message: 'Template stage not found' };
    }

    if (name != null && !name.trim()) {
      throw { status: 400, message: 'Stage name cannot be empty' };
    }

    const updated = await TemplateStageModel.updateStage(stageId, {
      name: name != null ? name.trim() : null,
      stage_type_id,
    });
    if (!updated) throw { status: 404, message: 'Template stage not found' };
    return updated;
  }

  async deleteStage(stageId) {
    const stage = await TemplateStageModel.getStageById(stageId);
    if (!stage || stage.master_id == null) {
      throw { status: 404, message: 'Template stage not found' };
    }
    return await TemplateStageModel.deleteStage(stageId);
  }
}

export default new TemplateStageService();
