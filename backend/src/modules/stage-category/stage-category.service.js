import StageCategoryModel from "./stage-category.model.js";

class StageCategoryService {
  async getAll() {
    return await StageCategoryModel.getAll();
  }
}

export default new StageCategoryService();
