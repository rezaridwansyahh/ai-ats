import formRepository from './form.repository.js'

class FormService {
	async getByCompanyId(company_id) {
		const form = formRepository.findByCompanyId(company_id);

		if (!form) throw new NotFoundError('Application form has not been set up');

		return form;
	}
}

export default new FormService();