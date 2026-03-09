const delay = (ms) => new Promise((r) => setTimeout(r, ms));

class RecruiteSearchRpa {
  async redirectTalentSearch(page) {
    await page.goto("https://www.linkedin.com/talent/search", { waitUntil: "networkidle0" });
  }

  async fillJobTitle(page, jobTitle = ["Frontend", "Fullstack", "Backend"]) {
    await page.click('buttonn[aria-label="Add Job titles or boolean"]');

    for(let i = 0; i < jobTitle.length; i++) {
      await page.waitForSelector('input[placeholder="enter a job title or boolean…"]');
      await page.click('input[placeholder="enter a job title or boolean…"]');
      await page.type('input[placeholder="enter a job title or boolean…"]', jobTitle[i]);

      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden)', { visible: true });
      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child', { visible: true });
      
      await delay(500);
      await page.click('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child');
    }

    const jobTitles = await page.evaluate(() => {
      
    })
  }

  async fillLocation(page, location = ["Jakarta", "Bandung", "Surabaya"]) {
    await page.click('button[aria-label="Add a Candidate geographic location"]');
    
    for(let i = 0; i < location.length; i++) {
      await page.waitForSelector('input[placeholder="enter a location…"]');
      await page.click('input[placeholder="enter a location…"]');
      await page.type('input[placeholder="enter a location…"]', location[i]);

      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden)', { visible: true });
      await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child', { visible: true });
      
      await delay(500);
      await page.click('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child');
    } 

    const locations = await page.evaluate(() => {
      const ul = document.querySelectorAll('ul[class="pills-list-section__list"] li');

      const li = Array.from(ul, ul => ul.querySelector('span[class="facet-pill__label"]').innerText);

      return li;
    });

    return locations;
  }

  async fillFormRecruiteSearch(page, data = {}) {
    const { location } = data;
    const form = {};

    await this.redirectTalentSearch(page);

    if (location) {
      const locations = await this.fillLocation(page, location);
      form.location = locations;
    }

    return form;
  } 
}

export default new RecruiteSearchRpa();