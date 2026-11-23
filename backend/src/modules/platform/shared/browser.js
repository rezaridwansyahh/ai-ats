// services/browser.js
// Must come before puppeteer-extra: puppeteer v25 is ESM-only, and
// puppeteer-extra (CJS) require()s it — if the ESM module isn't evaluated
// yet, require(esm) throws "ReferenceError: default is not defined".
import 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from "fs";
import path from 'path';

puppeteer.use(StealthPlugin());

const PROFILES_DIR = process.env.BROWSER_PROFILES_DIR || path.resolve(process.cwd(), 'browser-profiles')

const KEEP_OPEN_DEFAULT =
  (process.env.NODE_ENV !== 'production' && process.env.PUPPETEER_KEEP_OPEN === 'true') ||
  process.env.PUPPETEER_REMOTE_DEBUGGING === 'true';

const keptOpen = new Map();

class BrowserPuppeteer {
  constructor() {
    this.page = null;
    this.browser = null;
    this.profileKey = null;
    this.keepOpen = false;
    this.remoteDebugging = false;
  }

  async init({ accountId = null, headless, remoteDebugging, keepOpen } = {}) {
    const useHeadless = headless !== undefined ? headless : process.env.PUPPETEER_HEADLESS === 'true';
    this.remoteDebugging = remoteDebugging !== undefined ? remoteDebugging : process.env.PUPPETEER_REMOTE_DEBUGGING === 'true';
    this.keepOpen = keepOpen !== undefined ? keepOpen : (KEEP_OPEN_DEFAULT || this.remoteDebugging);

    const launchOptions = { headless: useHeadless };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    if (this.remoteDebugging) {
      launchOptions.args = [
        ...(launchOptions.args || []),
        `--remote-debugging-port=${process.env.PUPPETEER_REMOTE_DEBUGGING_PORT || '9222'}`,
      ];
    }

    if (accountId) {
      launchOptions.userDataDir = path.join(PROFILES_DIR, `account_${accountId}`);
      await fs.promises.mkdir(launchOptions.userDataDir, { recursive: true });
    }

    this.profileKey = launchOptions.userDataDir || 'no-profile';

    const previous = keptOpen.get(this.profileKey);
    if (previous) {
      keptOpen.delete(this.profileKey);
      if (previous.disconnected) {

        try { process.kill(previous.pid); } catch { /* already gone */ }
      } else {
        await previous.browser.close().catch(() => {});
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

    if (this.keepOpen) {
      const browser = this.browser;
      const key = this.profileKey;
      const pid = browser.process()?.pid;

      if (this.remoteDebugging) {
        
        await browser.disconnect();
        keptOpen.set(key, { pid, disconnected: true });
        console.log(`[puppeteer] Detached CDP — browser (pid ${pid}) still running at ${key}, untouched by any automation client now. Use VNC, not chrome://inspect, to interact with it.`);
      } else {
        keptOpen.set(key, { pid, disconnected: false, browser });
        browser.once('disconnected', () => {
          const entry = keptOpen.get(key);
          if (entry?.browser === browser) keptOpen.delete(key);
        });
        console.log(`[puppeteer] PUPPETEER_KEEP_OPEN: leaving browser open (${key})`);
      }
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