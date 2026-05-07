import logger from '../../shared/utils/logger.js';
import authService from "./auth.service.js";

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const login = await authService.login(email, password)

      return res.status(200).json(login);

    } catch (err) {
      logger.error(`Login failed: ${err.message}`);
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async register(req, res) {
    const { email, password, username, company_id } = req.body;

    try {
      const register = await authService.register(email, password, username, company_id);

      return res.status(201).json(register);

    } catch (err) {
      logger.error(`Register failed: ${err.message}`);
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AuthController();