import getDb from "../../config/postgres.js";

class StageCategoryModel {
  async getAll() {
    const result = await getDb().query(
      `SELECT id, name FROM recruitment_stage_category ORDER BY id`
    );
    return result.rows;
  }
}

export default new StageCategoryModel();
