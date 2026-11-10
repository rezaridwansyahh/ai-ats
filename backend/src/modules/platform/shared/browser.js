// services/browser.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from "fs";
import path from 'path';

puppeteer.use(StealthPlugin());

const PROFILES_DIR = process.env.BROWSER_PROFILES_DIR || path.resolve(process.cwd(), 'browser-profiles')

// DEV ONLY: with PUPPETEER_KEEP_OPEN=true (and NODE_ENV !== 'production'),
// close() leaves the window open so you can inspect what the RPA did.
// A profile dir can only be held by one Chrome at a time, so the kept-open
// browser for a profile is closed when the next job for it launches.
const KEEP_OPEN =
  process.env.NODE_ENV !== 'production' && process.env.PUPPETEER_KEEP_OPEN === 'true';
const keptOpen = new Map(); // profile key -> Browser left open by close()

class BrowserPuppeteer {
  constructor() {
    this.page = null;
    this.browser = null;
    this.profileKey = null;
  }

  async init({ accountId = null } = {}) {
    const launchOptions = { headless: process.env.PUPPETEER_HEADLESS === 'true' };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    if (accountId) {
      launchOptions.userDataDir = path.join(PROFILES_DIR, `account_${accountId}`);
      await fs.promises.mkdir(launchOptions.userDataDir, { recursive: true });
    }

    this.profileKey = launchOptions.userDataDir || 'no-profile';

    if (KEEP_OPEN) {
      const previous = keptOpen.get(this.profileKey);
      if (previous) {
        keptOpen.delete(this.profileKey);
        await previous.close().catch(() => {});
      }
    }

    this.browser = await puppeteer.launch(launchOptions);

    // Close any restored tabs (about:blank, old pages) and open a fresh one
    const existingPages = await this.browser.pages();
    this.page = await this.browser.newPage();
    for (const page of existingPages) {
      if (page !== this.page) await page.close();
    }

    await this.page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    return this.page;
  }

  async injectCookies(cookies = []) {
    if (!cookies.length) return;

    const cleanCookies = cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || '/',
      httpOnly: !!c.httpOnly,
      secure: !!c.secure,
      ...(c.sameSite && c.sameSite !== 'unspecified' ? { sameSite: c.sameSite } : {}),
      ...(c.expires || c.expirationDate ? { expires: c.expires || c.expirationDate } : {}),
    }));

    await this.browser.setCookie(...cleanCookies);
  }

  getPage() {
    return this.page;
  }

  getBrowser() {
    return this.browser;
  }

  async clickAndNewTab(selector, { timeout = 15000 } = {}) {
    const newTarget = this.browser.waitForTarget(
      (t) => t.type() === 'page' && t.opener() === this.page.target(),
      { timeout }
    );
    await this.page.click(selector);

    const newPage = await (await newTarget).page();
    await newPage.waitForNetworkIdle({ timeout }).catch(() => {});

    await this.page.close().catch(() => {});
    this.page = newPage;
    return this.page;
  }

  async close() {
    if (!this.browser) return;

    if (KEEP_OPEN) {
      const browser = this.browser;
      const key = this.profileKey;
      keptOpen.set(key, browser);
      browser.once('disconnected', () => {
        if (keptOpen.get(key) === browser) keptOpen.delete(key);
      });
      console.log(`[puppeteer] PUPPETEER_KEEP_OPEN: leaving browser open (${key})`);
    } else {
      await this.browser.close();
    }

    this.page = null;
    this.browser = null;
  }
}

export async function withBrowser(options, fn) {
  const browser = new BrowserPuppeteer();
  try {
    const page = await browser.init(options);
    return await fn(page, browser);
  } finally {
    await browser.close();
  }
}

export default BrowserPuppeteer;