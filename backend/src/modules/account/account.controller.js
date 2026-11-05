import jobAccountModel from "./account.model.js";
import jobAccountService from "./account.service.js";

class JobAccountController {
  async getMyAccount(req, res) {
    try {
      const accounts = await jobAccountService.getByUserId(req.user.user_id);

      res.json(accounts);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    const { user_id, portal_name, email, password } = req.body;

    try {
      const newAccount = await jobAccountService.create(user_id, portal_name, email, password);

      res.status(201).json(newAccount);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { email, password } = req.body;

    try {
      const updatedAccount = await jobAccountService.update(id, email, password);

      res.status(200).json(updatedAccount);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    const { id } = req.params;

    try {
      const deleted = await jobAccountService.delete(id);

      res.status(200).json(deleted);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }  
}

export default new JobAccountController();