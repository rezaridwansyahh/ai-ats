import authService from "./auth.service.js";

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const login = await authService.login(email, password);
      return res.status(200).json(login);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AuthController();
