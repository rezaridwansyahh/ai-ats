import jobAccountModel from "../../../job-account/job-account.model.js"
import cookieService from "../../../cookie/cookie.service.js";
import { decrypt } from "../../../../shared/utils/encrypt.js"

class SeekLoginService {
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
    await page.goto('https://id.employer.seek.com/id/dashboard', { waitUntil: 'networkidle0' });

    return page.url() === 'https://id.employer.seek.com/id/dashboard';
  }

  async redirectLoginSeek(page) {
    await page.goto('https://id.employer.seek.com/id/', { waitUntil: 'networkidle0' });
  }

  async checkLogin(page) {
    const loginBtn = await page.$('a[href="/id/oauth/login/"]');

    if(loginBtn) {
      return loginBtn
    }
  }

  async clickLoginButton(page, loginBtn) {
    console.log('Click Login Button');
    await loginBtn.click();
  }

  async fillEmail(page, email) {
    console.log('Enter email');

    await page.waitForSelector('#emailAddress');
    await page.type('#emailAddress', email, {delay: 100});
    await page.keyboard.press("Enter");
  }

  async fillPassword(page, password) {
    console.log('Enter password');

    await page.waitForSelector('#password');
    await page.type('#password', password, {delay: 100});
    await page.keyboard.press("Enter");

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  async fillLogin(page, email, password) {
    const loginBtn = await this.checkLogin(page);

    if (loginBtn) {
      await this.clickLoginButton(page, loginBtn);
    }

    await this.fillEmail(page, email);
    await this.fillPassword(page, password);
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

    return "Success - logged in fresh";
  }
}

export default new SeekLoginService();
