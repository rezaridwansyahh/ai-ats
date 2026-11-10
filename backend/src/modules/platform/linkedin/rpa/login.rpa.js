class LinkedInLoginService {
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

  // Takes an already-resolved account ({ email, password }) — credential
  // lookup/decryption happens one level up, in linkedin.service.js. Returns
  // the fresh cookies/userAgent as data instead of persisting them itself —
  // the caller decides where that gets saved.
  async authenticatedPage(page, account) {
    console.log("check page");
    const isLoggedIn = this.checkIsLoggedIn(page);

    if (isLoggedIn) {
      console.log("cookies valid");
      return { success: true, freshLogin: false };
    }

    console.log("cookies invalid, logging in...");

    await this.fillLogin(page, account.email, account.password);

    const client = await page.createCDPSession();
    const { cookies } = await client.send('Storage.getCookies');
    const cleanCookies = cookies.map(({ partitionKey, ...rest }) => rest);
    const userAgent = await page.evaluate(() => navigator.userAgent);

    await this.clickRecruiteLite(page);

    return { success: true, freshLogin: true, cookies: cleanCookies, userAgent };
  }

  async clickRecruiteLite(page){
    console.log('Click Recruite Lite');
    await page.click('button[data-live-test-contract-select="Recruiter Lite - SAS Usmany"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  }
}

export default new LinkedInLoginService();
