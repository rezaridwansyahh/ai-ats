import jobAccountModel from "../../../job-account/job-account.model.js"
import cookieService from "../../../cookie/cookie.service.js";
import { decrypt } from "../../../../shared/utils/encrypt.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_DIR = path.resolve(__dirname, '../../../../../debug-screenshots');

class SeekLoginService {
  // Saves a screenshot + logs the current URL whenever a login step times
  // out — a bare "selector not found" error otherwise gives zero context on
  // what page was actually loaded (blank page? bot-check? rate-limited?).
  // Never throws itself — a failure here shouldn't mask the real error.
  async captureDebugContext(page, label) {
    try {
      fs.mkdirSync(DEBUG_DIR, { recursive: true });
      const filename = `${label}-${Date.now()}.png`;
      const filepath = path.join(DEBUG_DIR, filename);
      await page.screenshot({ path: filepath });
      console.error(`[login.rpa] ${label} failed — url=${page.url()} screenshot=${filepath}`);
    } catch (captureErr) {
      console.error(`[login.rpa] ${label} failed — and screenshot capture also failed:`, captureErr.message);
    }
  }
  async getAccountAndDecrypt(account_id) {
    const account = await jobAccountModel.getById(account_id);
    
    try {
      const [ivHex, encryptedPassword] = account.password.split(':');

      const decrypted = decrypt(encryptedPassword, ivHex);

      return { email: account.email, decrypted };
    } catch(err) {
      throw err;
    }
  }

  async checkRedirectDashboard(page) {
    await page.goto('https://id.employer.seek.com/id/dashboard', { waitUntil: 'networkidle2', timeout: 60000 });

    return page.url() === 'https://id.employer.seek.com/id/dashboard';
  }

  async redirectLoginSeek(page) {
    await page.goto('https://id.employer.seek.com/id/', { waitUntil: 'networkidle2', timeout: 60000 });
  }

  async checkLogin(page) {
    const loginBtn = await page.$('a[href="/id/oauth/login/"]');

    if(loginBtn) {
      return loginBtn
    }
  }

  async clickLoginButton(page, loginBtn) {
    console.log('Click Login Button');
    // Clicking triggers an OAuth redirect to the actual email-entry page.
    // Without waiting for that navigation here, fillEmail starts polling for
    // #emailAddress immediately and can race the redirect — Promise.all
    // (not click-then-wait sequentially) avoids missing the navigation event
    // if it starts before the wait call is even registered.
    await Promise.all([
      loginBtn.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
  }

  async fillEmail(page, email) {
    console.log('Enter email');

    try {
      await page.waitForSelector('#emailAddress');
    } catch (err) {
      await this.captureDebugContext(page, 'fillEmail');
      throw err;
    }
    await page.type('#emailAddress', email, {delay: 100});
    await page.keyboard.press("Enter");
  }

  async fillPassword(page, password) {
    console.log('Enter password');

    try {
      await page.waitForSelector('#password');
    } catch (err) {
      await this.captureDebugContext(page, 'fillPassword');
      throw err;
    }
    await page.type('#password', password, {delay: 100});
    await page.keyboard.press("Enter");

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  // Some accounts land on an account-picker page after password submit
  // instead of going straight to the dashboard (seen at
  // id.employer.seek.com/account/select?returnUrl=...) — each selectable
  // account is an <a id="{accountId}-selectable-link">. Always picks the
  // first one. No-ops if this page isn't the one we're on.
  async handleAccountSelection(page) {
    if (!page.url().startsWith('https://id.employer.seek.com/account/select')) {
      return;
    }

    console.log('Account selection page detected');

    const link = await page.$('a[id$="-selectable-link"]');
    if (!link) {
      throw new Error('Account selection page shown but no selectable account link found');
    }

    await Promise.all([
      link.click(),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
  }

  // Returns a reason string if the login attempt clearly failed in a way a
  // retry can't fix, or null if it looks like it succeeded (navigated away
  // from the login form).
  async detectLoginFailure(page) {
    const captcha = await page.$('iframe[src*="recaptcha"], iframe[title*="captcha" i], [class*="captcha" i]');
    if (captcha) {
      return 'CAPTCHA detected';
    }

    // Seek re-renders the same form with an inline error instead of
    // navigating away when credentials are rejected — still seeing the
    // password field after submitting means the login was rejected.
    const stillOnLoginForm = await page.$('#password');
    if (stillOnLoginForm) {
      return 'Invalid credentials';
    }

    return null;
  }

  async fillLogin(page, email, password) {
    const loginBtn = await this.checkLogin(page);

    if (loginBtn) {
      await this.clickLoginButton(page, loginBtn);
    }

    await this.fillEmail(page, email);
    await this.fillPassword(page, password);
    await this.handleAccountSelection(page);

    const failureReason = await this.detectLoginFailure(page);
    if (failureReason) {
      const err = new Error(`Seek login failed: ${failureReason}`);
      err.unrecoverable = true;
      throw err;
    }
  }

  async authenticatedPage(page, account_id) {
    console.log("check page");
    const isLoggedIn = await this.checkRedirectDashboard(page);

    if(isLoggedIn) {
      console.log("cookies valid");
      return "Success - already authenticated";
    }

    console.log("cookies invalid, logging in...");

    const account = await this.getAccountAndDecrypt(account_id);

    await this.redirectLoginSeek(page);
    await this.fillLogin(page, account.email, account.decrypted);

    const client = await page.createCDPSession();
    const { cookies } = await client.send('Storage.getCookies');
    const cleanCookies = cookies.map(({ partitionKey, ...rest }) => rest);
    const userAgent = await page.evaluate(() => navigator.userAgent);

    await cookieService.addCookies(account_id, { cookies: cleanCookies, userAgent });
    console.log("done");

    return "Success - logged in fresh";
  }
}

export default new SeekLoginService();
