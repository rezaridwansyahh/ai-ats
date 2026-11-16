import logger from '../../shared/utils/logger.js';
import authService from "./auth.service.js";

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const login = await authService.login(email, password)

      // Mirrors the JWT's own expiry — lets the cookie-checker extension
      // (which has no login UI of its own) read this via chrome.cookies
      // and forward it as a Bearer token. The app itself still reads the
      // token from the JSON body into localStorage, same as before.
      res.cookie('ats_token', login.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 60 * 60 * 1000,
      });

      return res.status(200).json(login);

    } catch (err) {
      logger.error(`Login failed: ${err.message}`);
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  async register(req, res) {
    const { email, password, username, company_name } = req.body;

    try {
      const register = await authService.register(email, password, username, company_name);

      return res.status(201).json(register);

    } catch (err) {
      logger.error(`Register failed: ${err.message}`);
      return res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new AuthController();