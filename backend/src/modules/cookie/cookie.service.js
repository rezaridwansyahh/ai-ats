import cookieModel from './cookie.model.js';
import browserPuppeteer from '../../shared/services/puppeteer/browser.puppeteer.js';

class CookieService {
  async checkCookies(account_id) { // still hardcode to link on linkedin only
    const cookies = await cookieModel.getByAccountId(account_id);

    if (!cookies || cookies.length === 0) {
      return false;
    }

    console.log("run cookie");

    const puppeteerCookies = cookies.cookies;
    console.log(cookies.cookies);

    await browserPuppeteer.init(puppeteerCookies, account_id);

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
    await browserPuppeteer.init(row?.cookies || null, accountId);

    return browserPuppeteer.getPage();
  }

  async addCookies(account_id, cookies) {
    return await cookieModel.save(account_id, cookies);
    
  }
}

export default new CookieService();
