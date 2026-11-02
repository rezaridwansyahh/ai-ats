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
}

export default new FormRepository();
