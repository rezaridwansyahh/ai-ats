class ExtractRecruiteRpa {
  async extractData(page) {
    
    while(hasNext) {

    }
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
      await card.evaluate(el => el.querySelector('a[data-test-link-to-profile-link]').click());
      await page.waitForSelector('div[data-live-test-profile-index-tab-content]', { visible: true });
      await page.waitForSelector('div[class*="experience-card"] ul li', { visible: true });
      await page.waitForSelector('div[class*="experience-card"] ul li', { visible: true });
      // extract modal data
      const modalData = await page.evaluate(() => {
        const expSection = document.querySelectorAll('div[class*="experience-card"] ul li');

        const expData = Array.from(expSection, (exp) => {
          const div = exp.querySelector('div');
          
          if (div.hasAttribute('data-test-position-list-container')) {
            const title = div.querySelector('[data-test-position-entity-title]')?.innerText;
            const companyPosition = div.querySelector('[data-test-position-entity-company-name]')?.innerText;
            const dateRange = div.querySelector('[data-test-position-entity-date-range]')?.innerText;
            const desc = div.querySelector('[data-test-position-entity-description]')?.innerText;
            const skill = div.querySelectorAll('[data-test-position-skill-item]');

            return {
                title,
                companyPosition,
                dateRange,
                desc: desc ? desc : '',
                skill: skill.length > 0 ? [...skill].map(el => el.innerText) : ''
            };
          }

          if (div.hasAttribute('data-test-group-position-list-container')) {
            const company = div.querySelector('a[data-test-grouped-position-entity-company-link]')?.innerText;

            const sections = div.querySelectorAll('div[data-test-grouped-position-entity-metadata-container]');

            const data = Array.from(sections, (sections) => {
              const div = sections.querySelector('div[class*="grouped-position-entity"]');

              const title = div.querySelector('[data-test-grouped-position-entity-title]')?.innerText;
              const position = div.querySelector('[data-test-position-entity-employment-status]')?.innerText;
              const dateRange = div.querySelector('[data-test-grouped-position-entity-date-range]')?.innerText;
              const desc = div.querySelector('[data-test-position-entity-description]')?.innerText;
              const skill = div.querySelectorAll('[data-test-position-skill-item]');

              return {
                title,
                position,
                dateRange,
                desc: desc ? desc : '',
                skill: skill.length > 0 ? [...skill].map(el => el.innerText) : ''
              }
            });

            return {
              company,
              data
            }
          };
        });

        const eduSection = document.querySelectorAll('div[data-test-education-card] ul li');

        const eduData = Array.from(eduSection, (edu) => {
          const school = edu.querySelector('[data-test-education-entity-school-name]')?.innerText;
          const degree = edu.querySelector('[data-test-education-entity-degree-name]')?.innerText;
          const field = edu.querySelector('[data-test-education-entity-field-of-study]')?.innerText;
          const dateRange = edu.querySelector('[data-test-education-entity-dates]')?.innerText;
          
          return {
            school,
            degree,
            field,
            dateRange
          }
        });

        return { experience: expData, education: eduData };
      });
      
      await page.click('a[data-test-close-pagination-header-button]');
      await page.waitForSelector('div[data-live-test-profile-index-tab-content]', { hidden: true });
      
      results.push({ ...basic, information: modalData });
    }

    return results;
  }
}

export default new ExtractRecruiteRpa();