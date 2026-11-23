// services/browser.js
// Must come before puppeteer-extra: puppeteer v25 is ESM-only, and
// puppeteer-extra (CJS) require()s it — if the ESM module isn't evaluated
// yet, require(esm) throws "ReferenceError: default is not defined".
import 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';

puppeteer.use(StealthPlugin());

const PROFILES_DIR = process.env.BROWSER_PROFILES_DIR || path.resolve(process.cwd(), 'browser-profiles')

// DEV ONLY: with PUPPETEER_KEEP_OPEN=true (and NODE_ENV !== 'production'),
// close() leaves the window open so you can inspect what the RPA did.
// A profile dir can only be held by one Chrome at a time, so the kept-open
// browser for a profile is closed when the next job for it launches.
//
// PUPPETEER_REMOTE_DEBUGGING=true keeps it open unconditionally (even in
// production) — the whole point of that mode is driving the browser by hand
// over chrome://inspect (e.g. to clear an OTP challenge), so an automatic
// close() would yank it away mid-session.
const KEEP_OPEN =
  (process.env.NODE_ENV !== 'production' && process.env.PUPPETEER_KEEP_OPEN === 'true') ||
  process.env.PUPPETEER_REMOTE_DEBUGGING === 'true';
// profile key -> { browser, pid, disconnected } for a browser left open by
// close() — disconnected:true means Puppeteer's own CDP session was torn
// down (see close()'s PUPPETEER_REMOTE_DEBUGGING branch), so there's no
// `browser` handle left to close gracefully, only a pid to kill.
const keptOpen = new Map();

class BrowserPuppeteer {
  constructor() {
    this.page = null;
    this.browser = null;
    this.profileKey = null;
  }

  async init({ accountId = null, userAgent = null } = {}) {
    const launchOptions = { headless: process.env.PUPPETEER_HEADLESS === 'true' };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    // Opt-in only — exposes a DevTools-inspectable debug port (chrome://inspect
    // on your own machine, tunneled over SSH) so you can click/type into a
    // running RPA session, e.g. to clear an OTP challenge by hand. Bound to
    // localhost by default via Chrome itself; never enabled unless asked for.
    if (process.env.PUPPETEER_REMOTE_DEBUGGING === 'true') {
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

    if (KEEP_OPEN) {
      const previous = keptOpen.get(this.profileKey);
      if (previous) {
        keptOpen.delete(this.profileKey);
        if (previous.disconnected) {
          // No CDP connection left to ask it to close gracefully (see
          // close() below) — kill the process directly by pid instead.
          try { process.kill(previous.pid); } catch { /* already gone */ }
        } else {
          await previous.browser.close().catch(() => {});
        }
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

    if (userAgent) await this.page.setUserAgent(userAgent);

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
      const pid = browser.process()?.pid;

      if (process.env.PUPPETEER_REMOTE_DEBUGGING === 'true') {
        // Detach Puppeteer's own CDP connection entirely, not just skip
        // close() — a human solving a Cloudflare challenge over
        // chrome://inspect still gets "verification failed", since that
        // just adds a second CDP client on top of Puppeteer's own, and
        // Cloudflare flags the CDP attachment itself, not who's clicking.
        // Interact with the browser over VNC (not chrome://inspect) from
        // here on; the process can now only be ended by killing its pid
        // (handled in init() above when the next job for this profile starts).
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