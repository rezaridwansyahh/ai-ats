import formRepository from './form.repository.js'
import jobModel from '../job/job.model.js'

class FormService {
	async getByCompanyId(company_id) {
		const form = await formRepository.findByCompanyId(company_id);

		// return empty row
		if (!form) return { company_id, schema: { sections: [] }, updated_at: null };

		return form;
	}

	async updateCompanyForm(company_id, schema) {
		if (!schema || !Array.isArray(schema.sections)) {
			throw { status: 400, message: 'schema.sections must be an array' };
		}
		for (const section of schema.sections) {
			if (!section || typeof section.key !== 'string' || !Array.isArray(section.fields)) {
				throw { status: 400, message: 'each section needs a key and a fields array' };
			}
		}

		return await formRepository.upsertByCompanyId(company_id, schema);
	}

	async getCombinedForm(company_id, job_id) {
		const job = await jobModel.getById(job_id);
		if (!job) throw { status: 404, message: 'Job not found' };

		const companyForm = await formRepository.findByCompanyId(company_id);
		const sections = Array.isArray(companyForm?.schema?.sections)
			? [...companyForm.schema.sections]
			: [];

		const additionalQuestions = Array.isArray(job.additional_application_questions)
			? job.additional_application_questions
			: [];
		if (additionalQuestions.length > 0) {
			sections.push({
				key: 'position',
				label: 'Additional Questions for This Role',
				fields: additionalQuestions,
			});
		}

		return {
			company_id,
			job_id,
			schema: { sections },
		};
	}
}

export default new FormService();