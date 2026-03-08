import cookieService from "./cookie.service.js";

class CookieController {
  async checkCookie(req, res) {
    const { account_id } = req.body;

    try {
      const isLoggedIn = await cookieService.checkCookies(account_id);

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
    const { account_id, cookies, service } = req.body;

    try {
      // cookies may arrive as a JSON string from the extension — parse it
      const parsed = typeof cookies === 'string' ? JSON.parse(cookies) : cookies;
      const cookie = await cookieService.addCookies(account_id, parsed);

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
