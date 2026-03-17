class JobPostRpa {
  async redirectJobPost(page) {
    const response = await page.goto("https://www.linkedin.com/talent/job-posting/post", { waitUntil: "networkidle2" });
  }

  async checkPrefilled(page) {
    const button = await page.$('button[data-test-prefill-clear-button]');

    if (button) {
      await page.click('button[data-test-prefill-clear-button]');
    }
  }

  async fillCompany(page, company = "Abhimata") {
    console.log("start fill company");

    await page.type('input[placeholder="Company"]', company, {delay: 100}); // change the data
    await page.waitForSelector('div.company-typeahead-results li', { visible: true, timeout: 30000 });
    await page.waitForFunction(
      (selector) => {
        const items = document.querySelectorAll(selector);
        const current = items[0]?.textContent;
        return new Promise(resolve => {
          setTimeout(() => {
            const updated = document.querySelectorAll(selector)[0]?.textContent;
            resolve(current === updated);
          }, 500);
        });
      },
      { timeout: 10000 },
      'div.company-typeahead-results li'
    );
    await page.click('div.company-typeahead-results li:first-child')
  }

  async fillJobTitle(page, jobTitle = "Software Engineer") {
    console.log("start fill job title");

    await page.type('input[placeholder="Job title"]', jobTitle, {delay: 100}); // change the data
    await page.waitForSelector('div[data-test-typeahead-results] li', { visible: true, timeout: 5000 });
    await page.waitForFunction(
      (selector) => {
        const items = document.querySelectorAll(selector);
        const current = items[0]?.textContent;
        return new Promise(resolve => {
          setTimeout(() => {
            const updated = document.querySelectorAll(selector)[0]?.textContent;
            resolve(current === updated);
          }, 500);
        });
      },
      { timeout: 10000 },
      'div[data-test-typeahead-results] li'
    );
    await page.click('div[data-test-typeahead-results] li:first-child')
  }

  async fillWorkplaceType(page, workplaceType = "Hybrid") {
    console.log("start fill workplace type");

    await page.click('button[id^="workplace-dropdown"]');
    await page.waitForSelector('div[class="artdeco-dropdown__content-inner"]', { visible: true, timeout: 5000 });

    // [On-Site, Hybrid, Remote]
    switch(workplaceType) {  // change the data
      case "On-Site":
        await page.click('div[class="artdeco-dropdown__content-inner"] li:nth-child(1)');
        break;
      case "Hybrid":
        await page.click('div[class="artdeco-dropdown__content-inner"] li:nth-child(2)');
        break;
      case "Remote":
        await page.click('div[class="artdeco-dropdown__content-inner"] li:nth-child(3)');
        break;
    };
  }

  async fillJobLocation(page, jobLocation = "Jakarta") {
    console.log("start fill job location");

    await page.evaluate((value) => {
      const input = document.querySelector('input[placeholder="City or metro area"]');
      input.focus();
      input.value = value;
    }, jobLocation);
    await page.click('input[placeholder="City or metro area"]');
    await page.type('input[placeholder="City or metro area"]', ' '); //just to show the dropwdown
    await page.waitForSelector('ul[class^="_datalist"] li', { visible: true, timeout: 5000 });
    await page.waitForFunction(
      (selector) => {
        const items = document.querySelectorAll(selector);
        const current = items[0]?.textContent;
        return new Promise(resolve => {
          setTimeout(() => {
            const updated = document.querySelectorAll(selector)[0]?.textContent;
            resolve(current === updated);
          }, 2000);
        });
      },
      { timeout: 10000 },
      'ul[class^="_datalist"] li'
    );
    await page.click('ul[class^="_datalist"] li:first-child')
  }

  async fillEmploymentType(page, employmentType = "FULL_TIME") {
    console.log("start fill employment type");

    // [FULL_TIME, PART_TIME, CONTRACT, TEMPORARY, OTHER, VOLUNTEER, INTERNSHIP] must uppercase
    await page.select('select[data-live-test-select="employment-type"]', employmentType); // change the data
  }

  async fillSeniorityLevel(page, seniorityLevel = "INTERNSHIP") {
    console.log("start fill seniority level");

    // [INTERNSHIP, ENTRY_LEVEL, ASSOCIATE, MID_SENIOR_LEVEL, DIRECTOR, EXECUTIVE, NOT_APPLICABLE] must uppercase
    await page.select('select[data-live-test-select="seniority-level"]', seniorityLevel); // change the data
  }

  async fillCompanyUrl(page, companyUrl = "https://www.google.com") {
    // How would you like to receive your applicants?
    await page.evaluate(() => {
      document.querySelector('input[id="apply-method-radio-select-external"]').click()
    })
    await page.type('input[placeholder="http://yourcompany.com/job123"]', companyUrl, {delay: 100}) // change the data
  }

  async fillProject(page, project = "Project HRIS") {
    // Add to a project *
    await page.type('input[placeholder="Choose or create a project"]', project, {delay: 100});

    await page.waitForSelector('li[class="artdeco-typeahead__result ember-view"]', { visible: true, timeout: 10000 });

    await page.evaluate(() => {
      const items = document.querySelectorAll('li.artdeco-typeahead__result.ember-view');
      const item = items[1];
      item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  }

  async fillFormJobPost(page, data) { // data here in JSON (Orchestration)
    await this.redirectJobPost(page);
    await this.checkPrefilled(page);
    await this.fillCompany(page, data.company);
    await this.fillJobTitle(page, data.jobTitle);
    await this.fillWorkplaceType(page, data.workplaceType);
    await this.fillJobLocation(page, data.jobLocation);
    await this.fillEmploymentType(page, data.employmentType);
    await this.fillSeniorityLevel(page, data.seniorityLevel);
    await this.fillCompanyUrl(page, data.companyUrl);
    await this.fillProject(page, data.project); // Create Project need to be created before jobPost, except it already created before
  }
}

export default new JobPostRpa();
