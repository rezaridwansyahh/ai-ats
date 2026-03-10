const delay = (ms) => new Promise((r) => setTimeout(r, ms));

class RecruiteSearchRpa {
  async redirectTalentSearch(page) {
    await page.goto("https://www.linkedin.com/talent/search", { waitUntil: "networkidle0" });
  }

  async fillJobTitle(page, jobTitle = ["Frontend", "Fullstack", "Backend"]) {
    await page.click('button[aria-label="Add Job titles or boolean"]');

    for(let i = 0; i < jobTitle.length; i++) {
      await page.waitForSelector('input[placeholder="enter a job title or boolean…"]');
      await page.click('input[placeholder="enter a job title or boolean…"]');
      await page.type('input[placeholder="enter a job title or boolean…"]', jobTitle[i], { delay: 80 });

      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden)', { visible: true });
      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child', { visible: true });
      
      await delay(500);
      await page.click('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child');
    }

    const jobTitles = await page.evaluate(() => {
      const div = document.querySelector('div[class*="facet-titles"]');

      const ul = div.querySelectorAll('ul[class="pills-list-section__list"] li');

      const li = Array.from(ul, ul => ul.querySelector('span[class="facet-pill__label"]').innerText);

      return li;
    });

    return jobTitles;
  }

  async fillLocation(page, location = ["Jakarta", "Bandung", "Surabaya"]) {
    await page.click('button[aria-label="Add a Candidate geographic location"]');
    
    for(let i = 0; i < location.length; i++) {
      await page.waitForSelector('input[placeholder="enter a location…"]');
      await page.click('input[placeholder="enter a location…"]');
      await page.type('input[placeholder="enter a location…"]', location[i], { delay: 80 });

      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden)', { visible: true });
      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child', { visible: true });
      
      await delay(500);
      await page.click('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child');
    } 

    const locations = await page.evaluate(() => {
      const div = document.querySelector('div[class*="facet-locations"]');

      const ul = div.querySelectorAll('ul[class="pills-list-section__list"] li');

      const li = Array.from(ul, ul => ul.querySelector('span[class="facet-pill__label"]').innerText);

      return li;
    });

    return locations;
  }

  async fillSkillsAndAssesments(page, skill = ["JavaScript", "HTML", "CSS"]) {
    await page.click('text/Skill keywords anywhere on profile');
    
    for(let i = 0; i < skill.length; i++) {
      await page.waitForSelector('input[placeholder="enter a skill…"]');
      await page.click('input[placeholder="enter a skill…"]');
      await page.type('input[placeholder="enter a skill…"]', skill[i], { delay: 80 });

      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden)', { visible: true });
      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child', { visible: true });
      
      await delay(500);
      await page.click('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child');
    } 

    const skills = await page.evaluate(() => {
      const div = document.querySelector('div[class*="facet-skills"]');

      const ul = div.querySelectorAll('ul[class="pills-list-section__list"] li');

      const li = Array.from(ul, ul => ul.querySelector('span[class="facet-pill__label"]').innerText);

      return li;
    });

    return skills;
  }

  async fillCompanies(page, company = ["Bank Central Asia", "Bank Rakyat Indonesia", "Bank Mandiri"]) {
    await page.click('button span[aria-label="Add Companies or boolean"]');
    
    for(let i = 0; i < company.length; i++) {
      await page.waitForSelector('input[placeholder="enter a company or boolean…"]');
      await page.click('input[placeholder="enter a company or boolean…"]');
      await page.type('input[placeholder="enter a company or boolean…"]', company[i], { delay: 80 });

      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden)', { visible: true });
      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child', { visible: true });
      
      await delay(500);
      await page.click('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child');
    } 

    const companies = await page.evaluate(() => {
      const div = document.querySelector('div[class*="facet-companies"]');

      const ul = div.querySelectorAll('ul[class="pills-list-section__list"] li');

      const li = Array.from(ul, ul => ul.querySelector('span[class="facet-pill__label"]').innerText);

      return li;
    });

    return companies;
  }

  async fillSchools(page, school = ["Binus", "Atma Jaya"]) {
    await page.click('text/Schools attended');
    
    for(let i = 0; i < school.length; i++) {
      await page.waitForSelector('input[placeholder="enter a school…"]');
      await page.click('input[placeholder="enter a school…"]');
      await page.type('input[placeholder="enter a school…"]', school[i], { delay: 80 });

      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden)', { visible: true });
      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child', { visible: true });
      
      await delay(500);
      await page.click('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child');
    } 

    const schools = await page.evaluate(() => {
      const div = document.querySelector('div[class*="facet-schools"]');

      const ul = div.querySelectorAll('ul[class="pills-list-section__list"] li');

      const li = Array.from(ul, ul => ul.querySelector('span[class="facet-pill__label"]').innerText);

      return li;
    });

    return schools;
  }

  async fillYearsGrad(page, yearsGrad = "2021 - 2025") {
    const regexGrad = yearsGrad.match(/\d+/g);

    await page.click('text/Add graduation year range');
    
    await page.waitForSelector('form[method="post"] input', { visible: true });

    await page.click('form[method="post"] input[data-test-from-field]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('form[method="post"] input[data-test-from-field]', regexGrad[0], { delay: 80 });

    await page.click('form[method="post"] input[data-test-to-field]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('form[method="post"] input[data-test-to-field]', regexGrad[1], { delay: 80 });

    await page.click('button[data-test-submit]');

    return yearsGrad;
  }

  async fillIndustries(page, industry = ["Banking", "Tech"]) {
    await page.click('text/Candidate industries');
    
    for(let i = 0; i < industry.length; i++) {
      await page.waitForSelector('input[placeholder="enter a school…"]');
      await page.click('input[placeholder="enter a school…"]');
      await page.type('input[placeholder="enter a school…"]', industry[i], { delay: 80 });

      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden)', { visible: true });
      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child', { visible: true });
      
      await delay(500);
      await page.click('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child');
    } 

    const industries = await page.evaluate(() => {
      const div = document.querySelector('div[class*="facet-industry"]');

      const ul = div.querySelectorAll('ul[class="pills-list-section__list"] li');

      const li = Array.from(ul, ul => ul.querySelector('span[class="facet-pill__label"]').innerText);

      return li;
    });

    return industries;
  }

  async fillKeyword(page, keyword = "HTML CSS") {
    await page.click('text/Profile keywords or boolean');

    await page.waitForSelector('textarea[placeholder="enter keywords…"]');

    await page.type('textarea[placeholder="enter keywords…"]', keyword, { delay: 80 });

    await page.keyboard.press('Enter');

    const keywords = await page.evaluate(() => {
      const div = document.querySelector('div[class="keywords-facet"]');

      const ul = div.querySelectorAll('ul[class="pills-list-section__list"] li');

      const li = Array.from(ul, ul => ul.querySelector('span[class="facet-pill__label"]').innerText);

      return li;
    });

    return keywords;
  }

  async fillFormRecruiteSearch(page, data = {}) {
    const { skills, job_titles, locations, companies, schools, year_grads, industries, keywords } = data;
    const form = {};

    await this.redirectTalentSearch(page);

    if(job_titles) form.jobTitles = await this.fillJobTitle(page, job_titles);

    if(locations) form.locations = await this.fillLocation(page, locations);

    if(skills) form.skills = await this.fillSkillsAndAssesments(page, skills);

    if(companies) form.companies = await this.fillCompanies(page, companies);

    if(schools) form.schools = await this.fillSchools(page, schools);

    if(year_grads) form.yearGrad = await this.fillYearsGrad(page, year_grads);

    if(industries) form.industries = await this.fillIndustries(page, industries);

    if(keywords) form.keywords = await this.fillKeyword(page, keywords);
      
    return form;
  }
}

export default new RecruiteSearchRpa();