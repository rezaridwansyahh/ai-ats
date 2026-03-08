const delay = (ms) => new Promise((r) => setTimeout(r, ms));

class RecruiteSearchRpa {
  async redirectTalentSearch(page) {
    await page.goto("https://www.linkedin.com/talent/search", { waitUntil: "networkidle0" });
  }

  async fillLocation(page, location = "Jakarta") {
    await page.click('button[aria-label="Add a Candidate geographic location"]');

    await page.waitForSelector('input[placeholder="enter a location…"]');
    await page.click('input[placeholder="enter a location…"]');
    await page.type('input[placeholder="enter a location…"]', location);

    await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden)', { visible: true });
    await page.waitForSelector('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child', { visible: true });
    
    await delay(500);
    await page.click('ul.typeahead-results:not(.typeahead-results--hidden) li:first-child');
  }

  async fillFormRecruiteSearch(page, data = {}) {
    const { location } = data;

    await this.redirectTalentSearch(page);

    if (location) {
      await this.fillLocation(page, location);
    }
  }
}

export default new RecruiteSearchRpa();