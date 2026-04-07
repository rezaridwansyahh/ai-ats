import getDb from "../../config/postgres.js";

class PipelineModel {
  async getByJobId(jobId) {
    const result = await getDb().query(`
      SELECT
        cj.id AS job_id,
        cjt.template_stage_id,
        mts.name AS template_name,
        rs.id AS stage_id,
        rs.stage_order,
        rs.name,
        rs.stage_type_id,
        rsc.name AS category
      FROM core_job cj
      LEFT JOIN core_job_template cjt ON cjt.job_id = cj.id
      LEFT JOIN master_template_stage mts ON mts.id = cjt.template_stage_id
      LEFT JOIN recruitment_stage rs ON (
        CASE
          WHEN cjt.template_stage_id IS NOT NULL THEN rs.master_id = cjt.template_stage_id
          ELSE rs.job_id = cj.id
        END
      )
      LEFT JOIN recruitment_stage_category rsc ON rsc.id = rs.stage_type_id
      WHERE cj.id = $1
      ORDER BY rs.stage_order ASC
    `, [jobId]);

    if (result.rows.length === 0) return null;

    const { job_id, template_stage_id, template_name } = result.rows[0];
    const stages = result.rows
      .filter(r => r.stage_id !== null)
      .map(r => ({
        id: r.stage_id,
        stage_order: r.stage_order,
        name: r.name,
        stage_type_id: r.stage_type_id,
        category: r.category,
      }));

    return {
      job_id,
      template_stage_id,
      template_name,
      is_custom: template_stage_id === null,
      stages,
    };
  }

  async saveCustomStages(jobId, stages) {
    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      // Remove template link (switch to custom)
      await client.query(
        `DELETE FROM core_job_template WHERE job_id = $1`,
        [jobId]
      );

      // Delete existing custom stages for this job
      await client.query(
        `DELETE FROM recruitment_stage WHERE job_id = $1`,
        [jobId]
      );

      // Insert new stages
      if (stages.length > 0) {
        const values = [];
        const placeholders = [];
        stages.forEach((stage, idx) => {
          const offset = idx * 4;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
          values.push(jobId, stage.stage_type_id, stage.name, idx + 1);
        });

        await client.query(`
          INSERT INTO recruitment_stage (job_id, stage_type_id, name, stage_order)
          VALUES ${placeholders.join(', ')}
        `, values);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async applyTemplate(jobId, templateId) {
    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      // Upsert template link for this job
      await client.query(`
        INSERT INTO core_job_template (job_id, template_stage_id)
        VALUES ($1, $2)
        ON CONFLICT (job_id) DO UPDATE SET template_stage_id = $2, updated_at = NOW()
      `, [jobId, templateId]);

      // Remove any custom stages for this job
      await client.query(
        `DELETE FROM recruitment_stage WHERE job_id = $1`,
        [jobId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default new PipelineModel();
