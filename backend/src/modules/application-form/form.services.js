import formRepository from './form.repository.js'
import jobModel from '../job/job.model.js'

class FormService {
	async getByCompanyId(company_id) {
		const form = await formRepository.findByCompanyId(company_id);

		if (!form) throw { status: 404, message: 'Application form has not been set up' };

		return form;
	}

	// Combines the company's default questions with this job's additional
	// ones — the position form never replaces the company form, only adds
	// to it. Returns one schema shaped like company_application_form.schema
	// ({ sections: [...] }) so every existing consumer (qa-details.jsx,
	// QAFollowUp.jsx, normalizeApplicationForm/findMissingRequired) renders
	// and validates it exactly like a company-only schema, no changes needed.
	// A company form that hasn't been set up yet doesn't block this — the
	// job's own questions can still stand alone.
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