import formService from './form.services.js'

class FormController {
	getCompanyForm = async (req, res) => {
		const form = await formService.getByCompanyId(req.user.company_id);

  	res.json(form);
	}
}

export default new FormController();