import cookieService from "./cookie.service.js";

class CookieController {
  async save(req, res) {
    const { account_id, cookies } = req.body;

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
