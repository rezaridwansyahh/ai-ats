import cookieModel from './cookie.model.js';
import browserPuppeteer from '../../shared/services/puppeteer/browser.puppeteer.js';

class CookieService {
  async checkCookies(user_id, service) { // still hardcode to link on linkedin only
    const cookies = await cookieModel.getByUserIdAndService(user_id, service);

    if (!cookies || cookies.length === 0) {
      return false;
    }

    const puppeteerCookies = cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || "/",
      secure: c.secure || false,
      httpOnly: c.httpOnly || false,
      ...(c.sameSite && { sameSite: c.sameSite }),
      ...(c.expirationDate && { expires: c.expirationDate })
    }))

    await browserPuppeteer.init(puppeteerCookies);

    try {
      const page = browserPuppeteer.getPage();

      await page.goto("https://www.linkedin.com/talent/home", { waitUntil: "networkidle2" })
      const check = page.url().includes("/talent/home");

      return check;
    } catch (err) {
      console.error('Cookie check failed:', err.message);
      return false;
    } finally {
      await browserPuppeteer.close();
    }
  }

  async includeCookiesIfExist(accountId) {
    const row = await cookieModel.getByAccountId(accountId);

    // row.cookies is now { cookies: [...], userAgent: "..." }
    await browserPuppeteer.init(row?.cookies || null);

    return browserPuppeteer.getPage();
  }

  async addCookies(account_id, cookies) {
    return await cookieModel.save(account_id, cookies);
    
  }
}

export default new CookieService();
