// services/browser.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

class BrowserPuppeteer {
  constructor() {
    this.page = null
    this.browser = null
  }

  async init(session) {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();

    await this.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    if (session?.cookies?.length > 0) {
      if (session.userAgent) {
        await this.page.setUserAgent(session.userAgent);
      }

      // Sanitize cookies to only Puppeteer-supported fields
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

    return this.page;
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
