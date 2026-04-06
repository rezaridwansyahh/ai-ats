import getDb from "../../config/postgres.js";

class PipelineModel {
  async getByJobId(jobId) {
    const result = await getDb().query(`
      SELECT
        p.id AS pipeline_id,
        p.job_id,
        p.created_at AS pipeline_created_at,
        s.id AS stage_id,
        s.stage_order,
        s.category,
        s.name
      FROM core_job_pipeline p
      LEFT JOIN core_job_pipeline_stages s ON s.pipeline_id = p.id
      WHERE p.job_id = $1
      ORDER BY s.stage_order ASC
    `, [jobId]);

    if (result.rows.length === 0) return null;

    const { pipeline_id, job_id } = result.rows[0];
    const stages = result.rows
      .filter(r => r.stage_id !== null)
      .map(r => ({
        id: r.stage_id,
        stage_order: r.stage_order,
        category: r.category,
        name: r.name,
      }));

    return { pipeline_id, job_id, stages };
  }

  async createPipeline(jobId) {
    const result = await getDb().query(
      `INSERT INTO core_job_pipeline (job_id) VALUES ($1) RETURNING *`,
      [jobId]
    );
    return result.rows[0];
  }

  async replaceStages(pipelineId, stages) {
    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'DELETE FROM core_job_pipeline_stages WHERE pipeline_id = $1',
        [pipelineId]
      );

      if (stages.length > 0) {
        const values = [];
        const placeholders = [];
        stages.forEach((stage, idx) => {
          const offset = idx * 4;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
          values.push(pipelineId, idx + 1, stage.category, stage.name);
        });

        await client.query(`
          INSERT INTO core_job_pipeline_stages (pipeline_id, stage_order, category, name)
          VALUES ${placeholders.join(', ')}
          RETURNING *
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
}

export default new PipelineModel();
