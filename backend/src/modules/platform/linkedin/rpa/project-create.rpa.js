class ProjectCreateRpa {
  async redirectProjectCreate(page) {
    await page.goto("https://www.linkedin.com/talent/create/new/req-details", { waitUntil: "networkidle2" });
  }

  async fillProjectName(page, name = "Project HRIS") {
    console.log("start fill project name");

    await page.type('input[placeholder="Name (required)"]', name, {delay: 100});
  }

  async fillProjectDescription(page, description = "Test Description") { // optional
    console.log("start fill project description");

    await page.type('textarea[placeholder="(Optional)"]', description); // didn't use delay since it will took too long
  }

  async fillJobTitle(page, jobTitle = "Frontend") {
    console.log("start fill job title");

    await page.type('input[id*="job-title"]', jobTitle, {delay: 100});
    await page.waitForSelector('ul[id*="typeahead-result"] li', { visible: true, timeout: 5000 });
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
      'ul[id*="typeahead-result"] li'
    );
    await page.click('ul[id*="typeahead-result"] li:first-child');

  }

  async fillJobLocation(page, jobLocation = "Jakarta") {
    console.log("start fill job location");

    await page.type('input[data-test-remote-jobs-location-typeahead-input]', jobLocation, {delay: 100});
    await page.waitForSelector('ul[id*="listbox"] li', { visible: true, timeout: 5000 });
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
      'ul[id*="listbox"] li'
    );
    await page.click('ul[id*="listbox"] li:first-child');
  }

  async fillSeniorityLevel(page, seniorityLevel = "INTERNSHIP") {
    console.log("start fill seniority level");

    // [INTERNSHIP, ENTRY_LEVEL, ASSOCIATE, MID_SENIOR_LEVEL, DIRECTOR, EXECUTIVE]
    await page.select('select[id*="seniority"]', seniorityLevel);
  }

  async fillCompanyHiringFor(page, companyFor = "Abhimata") {
    console.log("start fill company hiring for");

    await page.click('input[id*="company-typeahead"]', { clickCount: 3 }); // delete the default first
    await page.keyboard.press('Backspace');

    await page.type('input[id*="company-typeahead"]', companyFor, {delay: 100});
    await page.waitForSelector('ul[id*="typeahead-result"] li', { visible: true, timeout: 5000 });
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
      'ul[id*="typeahead-result"] li'
    );
    await page.click('ul[id*="typeahead-result"] li:first-child');
  }

  async fillProjectVisible(page, projectVisible) { // still question ??
    console.log("start fill project visible");

    await page.evaluate(() => {
      document.querySelector('input[id*=projectVisibility-public]').click();
    })
  }

  async fillFormProjectCreate(page, data) {
    await this.fillProjectName(page, data.name);
    await this.fillProjectDescription(page, data.description);
    await this.fillJobTitle(page, data.jobTitle);
    await this.fillJobLocation(page, data.jobLocation);
    await this.fillSeniorityLevel(page, data.seniorityLevel);
    await this.fillCompanyHiringFor(page, data.companyFor);
    // await this.fillProjectVisible(page, data.projectVisible); // still don't know
  }
}

export default new ProjectCreateRpa();
