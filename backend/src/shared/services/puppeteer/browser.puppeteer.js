// services/browser.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.resolve(__dirname, '../../../../browser-profiles');

class BrowserPuppeteer {
  constructor() {
    this.page = null
    this.browser = null
  }

  async init(session, accountId = null) {
    const launchOptions = { headless: false };

    if (accountId) {
      launchOptions.userDataDir = path.join(PROFILES_DIR, `account_${accountId}`);
    }

    this.browser = await puppeteer.launch(launchOptions);

    // Close any restored tabs (about:blank, old pages) and open a fresh one
    const existingPages = await this.browser.pages();
    this.page = await this.browser.newPage();
    for (const p of existingPages) {
      if (p !== this.page) await p.close();
    }

    await this.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // If using userDataDir, check if existing session is still valid
    if (accountId && session?.cookies?.length > 0) {
      const needsInjection = await this._isSessionExpired();

      if (needsInjection) {
        console.log(`[account_${accountId}] Session expired, re-injecting cookies`);
        await this._injectCookies(session);
      } else {
        console.log(`[account_${accountId}] Session still valid, skipping cookie injection`);
      }
    } else if (session?.cookies?.length > 0) {
      // No userDataDir, always inject
      await this._injectCookies(session);
    }

    return this.page;
  }

  async _isSessionExpired() {
    try {
      await this.page.goto("https://www.linkedin.com/talent/home", { waitUntil: "networkidle2", timeout: 15000 });
      const url = this.page.url();
      return !url.includes("/talent/home") && !url.includes("/talent/contract-chooser");
    } catch {
      return true;
    }
  }

  async _injectCookies(session) {
    if (session.userAgent) {
      await this.page.setUserAgent(session.userAgent);
    }

    const cleanCookies = session.cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || '/',
      httpOnly: !!c.httpOnly,
      secure: !!c.secure,
      ...(c.sameSite && c.sameSite !== 'unspecified' ? { sameSite: c.sameSite } : {}),
      ...(c.expires || c.expirationDate ? { expires: c.expires || c.expirationDate } : {})
    }));

    await this.browser.setCookie(...cleanCookies);
  }

  getPage() {
    return this.page
  }

    // services/browser.js
  getBrowser() {
    return this.browser;
  }

  async clickAndNewTab(selector) {
    const [newPage] = await Promise.all([
      new Promise((resolve) =>
        this.browser.once('targetcreated', async (target) => resolve(await target.page()))
      ),
      this.page.click(selector),
    ]);

    await newPage.waitForNavigation({ waitUntil: 'networkidle0' });
    this.page = newPage; // update active page
    
    return this.page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.page = null
      this.browser = null
    }
  }
}

export default new BrowserPuppeteer()
