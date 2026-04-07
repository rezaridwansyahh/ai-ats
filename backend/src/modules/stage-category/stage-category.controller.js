import StageCategoryService from "./stage-category.service.js";

class StageCategoryController {
  async getAll(req, res) {
    try {
      const data = await StageCategoryService.getAll();
      res.status(200).json({ message: 'Stage categories', data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new StageCategoryController();
