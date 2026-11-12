import formService from './form.services.js'

class FormController {
	getCompanyForm = async (req, res) => {
		try {
			const form = await formService.getByCompanyId(req.user.company_id);
			res.json(form);
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}

	updateCompanyForm = async (req, res) => {
		try {
			const form = await formService.updateCompanyForm(req.user.company_id, req.body.schema);
			res.json(form);
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}

	getJobForm = async (req, res) => {
		try {
			const { job_id } = req.params;
			const form = await formService.getCombinedForm(req.user.company_id, job_id);
			res.json(form);
		} catch (err) {
			res.status(err.status || 500).json({ message: err.message });
		}
	}
}

export default new FormController();