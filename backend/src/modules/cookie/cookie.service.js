import cookieModel from './cookie.model.js';
import BrowserPuppeteer from '../../shared/services/puppeteer/browser.puppeteer.js';

class CookieService {
  async checkCookies(account_id) { // still hardcode to link on linkedin only
    const cookies = await cookieModel.getByAccountId(account_id);

    if (!cookies || cookies.length === 0) {
      return false;
    }

    console.log("run cookie");

    const puppeteerCookies = cookies.cookies;
    console.log(cookies.cookies);

    const browserPuppeteer = new BrowserPuppeteer();
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

  // Returns the BrowserPuppeteer instance itself (not just the page) — the
  // caller owns its lifecycle from here and is responsible for calling
  // .close() on it once done. One instance per call, never shared across
  // concurrent jobs (that's what made concurrency >1 unsafe before).
  async includeCookiesIfExist(accountId) {
    const row = await cookieModel.getByAccountId(accountId);

    // row.cookies is now { cookies: [...], userAgent: "..." }
    const browserPuppeteer = new BrowserPuppeteer();
    await browserPuppeteer.init(row?.cookies || null, accountId);

    return browserPuppeteer;
  }

  async addCookies(account_id, cookies) {
    return await cookieModel.save(account_id, cookies);
    
  }
}

export default new CookieService();
