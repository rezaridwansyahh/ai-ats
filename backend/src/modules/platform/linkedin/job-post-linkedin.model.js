import db from '../../../config/postgres.js';

class JobPostLinkedinModel {
  async getByJobPostingId(job_posting_id) {
    const result = await db.query(`
      SELECT mjpl.*, cpl.projec_id as project_id
      FROM mapping_job_posting_linkedin mjpl
      JOIN core_project_linkedin cpl ON cpl.id = mjpl.project_id
      WHERE mjpl.job_posting_id = $1
    `, [job_posting_id]);

    return result.rows[0];
  }
}

export default new JobPostLinkedinModel();
