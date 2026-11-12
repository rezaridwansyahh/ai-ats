import getDb from '../../config/postgres.js';

class FormRepository {
	async findByCompanyId(company_id) {
		const form = await getDb().query(
			`
				SELECT * FROM company_application_form
				WHERE company_id = $1
			`
		, [company_id]);

		return form.rows[0];
	}

	async upsertByCompanyId(company_id, schema) {
		const result = await getDb().query(
			`
				INSERT INTO company_application_form (company_id, schema, updated_at)
				VALUES ($1, $2, now())
				ON CONFLICT (company_id) DO UPDATE
					SET schema = EXCLUDED.schema, updated_at = now()
				RETURNING *
			`
		, [company_id, JSON.stringify(schema)]);

		return result.rows[0];
	}
}

export default new FormRepository();
