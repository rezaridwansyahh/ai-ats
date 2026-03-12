class ExtractRecruiteRpa {
  async extractData(page) {
    await page.waitForSelector('ol[data-test-paginated-list]', { visible: true });

    // scroll to the bottom so it will load all data on current page
    await page.evaluate(async () => {
      const distance = window.innerHeight; // scroll one viewport at a time
      const delay = 800;
      while (true) {
        const prevHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        await new Promise(r => setTimeout(r, delay));
        if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
          // wait once more in case new content loads
          await new Promise(r => setTimeout(r, delay));
          if (document.body.scrollHeight === prevHeight) break;
        }
      }
    });

    const cards = await page.$$('ol[data-test-paginated-list] > li');

    const results = [];
    for (const card of cards) {
      // extract basic info from the card
      const basic = await card.evaluate(el => ({
        name: el.querySelector('span[data-test-row-lockup-full-name]')?.innerText,
        skill: el.querySelector('span[data-test-row-lockup-headline]')?.innerText,
      }));

      // click the card to open modal
      await card.click();
      await page.waitForSelector('div[data-live-test-profile-index-tab-content]', { visible: true });

      // extract modal data
      const modalData = await page.evaluate(() => {
        const expSection = document.querySelectorAll('div[class*="experience-card"] ul li');

        const data = Array.from(expSection, (exp) => {
          const div = exp.querySelector('div');
          
          if (div.hasAttribute('data-test-position-list-container')) {
              const title = div.querySelector('[data-test-position-entity-title]').innerText;
              const companyPosition = div.querySelector('[data-test-position-entity-company-name]').innerText;
              const dateRange = div.querySelector('[data-test-position-entity-date-range]').innerText;
              const desc = div.querySelector('[data-test-position-entity-description]').innerText;
              const skill = div.querySelectorAll('[data-test-position-skill-item]');

              return {
                  title,
                  companyPosition,
                  dateRange,
                  desc,
                  skill: skill ? [...skill].map(el => el.innerText) : ''
              };
          }
          if (div.hasAttribute('data-test-group-position-list-container')) return 'y';
      });

        return {
          email: document.querySelector('.modal-email-selector')?.innerText,
          // ...other fields
        };
      });

      // close the modal
      await page.click('.modal-close-selector');
      await page.waitForSelector('.modal-selector', { hidden: true });

      results.push({ ...basic, ...modalData });
    }

    return data;
  }
}

export default new ExtractRecruiteRpa();