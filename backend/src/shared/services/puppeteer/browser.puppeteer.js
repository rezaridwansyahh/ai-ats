// services/browser.js
import puppeteer from "puppeteer"

class BrowserPuppeteer {
  constructor() {
    this.page = null
    this.browser = null
  }

  async init(session = null) {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();

    await this.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    if (session?.cookies?.length > 0) {
      await this.page.setUserAgent(session.userAgent);
      await this.browser.setCookie(...session.cookies);
    }

    return this.page;
  }

  getPage() {
    return this.page
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
