import cookieService from "./cookie.service.js";

class CookieController {
  async checkCookie(req, res) {
    const { user_id, service } = req.body;

    try {
      const isLoggedIn = await cookieService.checkCookies(user_id, service);

      if (isLoggedIn) {
        return res.json({
          status: 'valid',
          retry: false,
        });
      }

      return res.json({
        status: 'invalid',
        retry: true,
      });
    } catch(err) {
      return res.status(500).json({
        status: 'error',
        retry: true,
        message: err.message
      });
    }
  }

  async create(req, res) {
    const { user_id, cookies, service } = req.body;

    try {
      const cookie = cookieService.addCookies(accunt_id, cookies);

      return res.json({ message: "Cookie added", cookie});
    } catch(err) {
      return res.status(500).json({
        status: 'error',
        message: err.message
      });
    }
  }
}

export default new CookieController();
