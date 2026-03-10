import jobAccountModel from "../../../job-account/job-account.model.js"
import cookieService from "../../../cookie/cookie.service.js";
import { decrypt } from "../../../../shared/utils/encrypt.js"

class LinkedInLoginService {
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

  checkIsLoggedIn(page) {
    return page.url().includes("/talent/");
  }

  async fillEmail(page, email) {
    console.log('Enter email');
    await page.waitForSelector('input#username');
    await page.click('input#username', { clickCount: 3});
    await page.keyboard.press('Backspace');
    await page.type('input#username', email, { delay: 100 });
  }

  async fillPassword(page, password) {
    console.log('Enter password');
    await page.waitForSelector('input#password');
    await page.type('input#password', password, { delay: 100 });
  }

  async clickLoginButton(page) {
    console.log('Click Login Button');
    await page.click('button[data-litms-control-urn="login-submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  async fillLogin(page, email, password) {
    await this.fillEmail(page, email);
    await this.fillPassword(page, password);
    await this.clickLoginButton(page);
  }

  async authenticatedPage(page, account_id) {
    console.log("check page");
    const isLoggedIn = this.checkIsLoggedIn(page);

    if (isLoggedIn) {
      console.log("cookies valid");
      return "Success - already authenticated";
    }

    console.log("cookies invalid, logging in...");

    const account = await this.getAccountAndDecrypt(account_id);

    await this.fillLogin(page, account.email, account.decrypted);

    const client = await page.createCDPSession();
    const { cookies } = await client.send('Storage.getCookies');
    const cleanCookies = cookies.map(({ partitionKey, ...rest }) => rest);
    const userAgent = await page.evaluate(() => navigator.userAgent);

    await cookieService.addCookies(account_id, { cookies: cleanCookies, userAgent });

    await this.clickRecruiteLite(page);

    return "Success - logged in fresh";
  }

  async clickRecruiteLite(page){
    console.log('Click Recruite Lite');
    await page.click('button[data-live-test-contract-select="Recruiter Lite - SAS Usmany"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  }
}

export default new LinkedInLoginService();
