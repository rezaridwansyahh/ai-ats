const delay = (ms) => new Promise(r => setTimeout(r, ms));

class SeekJobPostingService {
  async redirectJobsPage(page) {
    console.log('Navigating to jobs page');

    await page.waitForSelector('a[data-test="jobs-page"]', { visible: true, timeout: 10000 });
    await page.click('a[data-test="jobs-page"]');
  }

  async redirectJobsPageSection(page){
    console.log('Navigating to jobs posting page');

    await page.waitForSelector('a[href*="/job/managejob/express/create"]', { visible: true, timeout: 30000 });
    await page.click('a[href*="/job/managejob/express/create"]');
  }

  async filljobTitle(page, job_title = "Software Engineer") {
    console.log('start fill job title');

    await page.waitForSelector('#JobTitleTextField');

    await page.click('#JobTitleTextField', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#JobTitleTextField', job_title, { delay: 30 });
  }

  async fillJobLocation(page, job_location = "Jakarta") {
    console.log('start fill job location');

    await page.waitForSelector('#JobLocation');

    await page.click('#JobLocation', { clickCount: 3 });
    await page.keyboard.press('Backspace');

    await page.type('#JobLocation', job_location, { delay: 100 });

    await page.waitForSelector('ul[id="JobLocation-menu"]', { visible: true, timeout: 5000 });
    await page.click('ul[id="JobLocation-menu"] li:first-child');

    await page.waitForFunction(() => {
      const error = document.getElementById('_r_4s_');
      return !error || error.textContent.trim() !== 'Enter a valid location';
    });
  }

  async fillJobWorkOption(page, work_option = 'On-site') {
    console.log('start fill job work option');

    // [On-site, Hybrid, Remote]
    const optionIndexMap = {
      'On-site': 0,
      'Hybrid': 1,
      'Remote': 2,
    };

    await page.click('input[id="workplace-options-list"]');

    await page.waitForSelector('ul[id="workplace-options-list-menu"]');

    await page.click(`li[id="workplace-options-list-item-${optionIndexMap[work_option]}"`);
  }

  async fillJobWorkType(page, work_type = 'Full-time') {
    console.log("start fill job work type");

    // [Full-time, Part-time, Contract, Casual]
    const typeMap = {
      'Full-time': 'fulltime',
      'Part-time': 'parttime',
      'Contract': 'contract',
      'Casual': 'casual',
    };

    await page.click(`button[data-testid="WorkTypeSegmentedButtonGroup_${typeMap[work_type]}"]`);
  }

  async fillJobPayType(page, pay_type = 'Monthly') {
    console.log("start fill job pay type");

    // [Hourly, Monthly, Annually]
    const typeMap = {
      'Hourly': 'hourlyRate',
      'Monthly': 'monthly',
      'Annually': 'annualSalary',
    };

    await page.click(`button[data-testid="PayTypeSegmentedButtonGroup_${typeMap[pay_type]}"]`);
  }

  async fillJobPayCurrencyRange(page, currency = 'IDR', pay_min = 5000000, pay_max = 8000000) {
    console.log("start fill job pay currency range");

    // [AUD, HKD, IDR, MYR, NZD, PHP, SGD, THB, USD]
    await page.select('select[id="salary_currency"]', currency)

    await page.click('input[id="minSalary"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');

    await page.type('input[id="minSalary"]', pay_min.toString(), { delay: 100 });

    await page.click('input[id="maxSalary"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');

    await page.type('#maxSalary', pay_max.toString(), { delay: 100 });

    await delay(200);
  }

  async checkSalaryCorrect(page) {
    console.log("check salary range is correct or not");

    const warningElement = await page.$('div[id="payRangeFieldMessage"]')

    if (warningElement) {
      const message = await page.evaluate(
        el => el.textContent.trim(),
        warningElement
      )

      return message;
    }

  }

  async fillJobPayDisplay(page, pay_display = 'Show') {
    console.log("start fill job pay display");

    // [Show, Hide]
    const displayMap = {
      'Show': 'show', 
      'Hide': 'hide'
    }

    await page.click(`button[data-testid="payDisplayToggle_${displayMap[pay_display]}"]`);
  }

  async clickDraftButton(page) {
    console.log("click draft button");

    await page.click('button[data-testid="saveDraftButton"]');

    await page.waitForSelector('div[role="alert"]', { visible: true });
  }

  async redirectDraftPage(page) {
    console.log("redirect to draft page");

    await page.goto("https://id.employer.seek.com/id/jobs?type=draft", { waitUntil: "networkidle0" });
  }

  async getSeekJobPostDraftId(page) {
    console.log("getting seek job post draft id");

    const href = await page.$eval('table tr:first-child td:nth-child(2) a', el => el.href);
    const match = href.match(/draftId=(.+)/);
    const draftId = match ? match[1] : null;

    return draftId;
  }

  async clickNextButton(page) {
    await page.waitForSelector('#next-page-button', { visible: true });

    await page.click('#next-page-button');

    await delay(1000);

    console.log('Clicked Continue button');
  }

  async clickDeleteButton(page, draftId) {
    console.log("click delete button");

    await page.waitForSelector('table tbody tr td');

    await page.$$eval('table tr', (rows, draftId) => {
      for (const row of rows) {
        const link = row.querySelector(`a[href*="${draftId}"]`);
        if (link) {
          // Traverse up to find the common container, then find delete button
          const deleteBtn = row.querySelector('button[type="button"]');
          if (deleteBtn) deleteBtn.click();
        }
      }
    }, draftId);

    await page.waitForSelector('button[data-testid="deleteDraftJobSubmitButton"]', { visible: true, timeout: 5000});

    await page.click('button[data-testid="deleteDraftJobSubmitButton"]');

    await page.waitForSelector('div[role="alert"]', { visible: true, timeout: 10000 });
  }

  async redirectJobPageEdit(page, draftId) {
    console.log("redirect to job page edit");

    await page.goto(`https://id.employer.seek.com/id/job/managejob/express/create/classify?referrer=editdraft&draftid=${draftId}`, { waitUntil: "networkidle0"});
  }

  async fillJobDescription(page, job_desc = "Description") {
    const editorSelector = '[data-cy="standardWritingFlow"] div[contenteditable="true"]';

    await page.waitForSelector(editorSelector, { visible: true });

    await page.click(editorSelector);
    await page.focus(editorSelector);

    await page.type(editorSelector, job_desc, { delay: 10 });

    // Verify
    const value = await page.evaluate((selector) => {
      return document.querySelector(selector).innerText;
    }, editorSelector);

    console.log('Job description set:', value);
  }

  async fillFormJobPostDraft(page, data) {
    await this.redirectJobsPage(page);
    await this.redirectJobsPageSection(page);
    await this.filljobTitle(page, data.job_title);
    await this.fillJobLocation(page, data.job_location);
    await this.fillJobWorkOption(page, data.work_option);
    await this.fillJobWorkType(page, data.work_type);
    await this.fillJobPayType(page, data.pay_type);
    await this.fillJobPayCurrencyRange(page, data.currency, data.pay_min, data.pay_max);
    const message = await this.checkSalaryCorrect(page);
    await this.fillJobPayDisplay(page, data.pay_display);
    await this.clickDraftButton(page);
    await this.redirectDraftPage(page);
    const draftId = await this.getSeekJobPostDraftId(page);

    return {
      message,
      draftId
    };
  }

  async fillFormJobPost(page, data) {
    await this.redirectJobsPage(page);
    await this.redirectJobsPageSection(page);
    await this.filljobTitle(page, data.jobTitle);
    await this.fillJobLocation(page, data.jobLocation);
    await this.fillJobWorkOption(page, data.workOption);
    await this.fillJobWorkType(page, data.workType);
    await this.fillJobPayType(page, data.payType);
    await this.fillJobPayCurrencyRange(page, data.currency, data.minSalary, data.maxSalary);
    await this.checkSalaryCorrect(page);
    await this.fillJobPayDisplay(page, data.display);
    await this.clickNextButton(page);
    await this.fillJobDescription(page, data.description);
  }

  async deleteJobPostDraft(page, draftId) {
    await this.redirectDraftPage(page);
    await this.clickDeleteButton(page, draftId);
  }

  async updateJobPostDraft(page, draftId, data) {
    await this.redirectJobPageEdit(page, draftId);
    await this.filljobTitle(page, data.job_title);
    await this.fillJobLocation(page, data.job_location);
    await this.fillJobWorkOption(page, data.work_option);
    await this.fillJobWorkType(page, data.work_type);
    await this.fillJobPayType(page, data.pay_type);
    await this.fillJobPayCurrencyRange(page, data.currency, data.pay_min, data.pay_max);
    const message = await this.checkSalaryCorrect(page);
    await this.fillJobPayDisplay(page, data.pay_display);
    await this.clickDraftButton(page);

    return {
      message
    };
  }
}

export default new SeekJobPostingService();