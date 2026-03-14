import fs from 'fs';
import path from 'path';

const delay = ms => new Promise(r => setTimeout(r, ms));

class ExtractRecruiteRpa {
  async extractRecruite(page, dataForm) {
    const { limit } = dataForm;
    const results = [];
    let hasNext = true;
    let count = 0;

    while(hasNext && count < limit) {
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

      for (const card of cards) {
        if (count >= limit) break;
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
        count++;
      }

      const nextBtn = await page.$('a[data-test-pagination-next]');

      if(nextBtn) {
        await Promise.all([
          nextBtn.click(),
          page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => {}),
        ]);
      }

      if(!nextBtn) {
        console.log('No more pages. Done!');
        break;
      }
    }

    return results;
  }

  async extractApplicant(page, dataForm) {
    const { account_id, job_name, linkedin_id, limit } = dataForm;
    const results = [];
    let hasNext = true;
    let count = 0;

    const safeName = job_name.replace(/[<>:"/\\|?*]+/g, '_');
    const downloadDir = path.resolve(`./resumes/${account_id}/${linkedin_id}_${safeName}`);
    fs.mkdirSync(downloadDir, { recursive: true });

    while(hasNext && count < limit) {
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

      for (const card of cards) {
        if (count >= limit) break;
        // extract basic info from the card
        const basic = await card.evaluate(el => ({
          name: el.querySelector('span[data-test-row-lockup-full-name]')?.innerText,
          last_position: el.querySelector('span[data-test-row-lockup-headline]')?.innerText,
          address: el.querySelector('[data-test-row-lockup-location]')?.innerText
        }));

        // click the card to open modal
        await card.evaluate(el => el.querySelector('a[data-test-link-to-profile-link]').click());
        await page.waitForSelector('div[data-live-test-profile-index-tab-content]', { visible: true });

        await page.waitForSelector('[data-test-contact-email-address]', { visible: true }).catch(() => null);
        await page.waitForSelector('[data-test-contact-phone]', { visible: true }).catch(() => null);

        const email = await page.$eval('[data-test-contact-email-address]', el => el.innerText);
        const phone = await page.$eval('[data-test-contact-phone]', el => el.innerText);

        await page.waitForSelector('div[class*="experience-card"] ul li', { visible: true });
      
        // extract modal data
        const modalData = await page.evaluate((email, phone) => {
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

          return { email, phone, experience: expData, education: eduData };
        }, email, phone);

        // Download resume if available
        await page.waitForSelector('[data-view-name="resume-download-link"]', { visible: true }).catch(() => null);
        let attachment = null;
        const downloadBtn = await page.$('[data-view-name="resume-download-link"]');

        if (downloadBtn) {
          const fileName = `${linkedin_id}_${count}.pdf`;
          attachment = `resumes/${account_id}/${linkedin_id}_${safeName}/${fileName}`;

          try {
            const filesBefore = new Set(fs.readdirSync(downloadDir));

            await page._client().send('Page.setDownloadBehavior', {
              behavior: 'allow',
              downloadPath: downloadDir
            });

            await page.evaluate(el => el.click(), downloadBtn);
            await delay(5000);

            const filesAfter = fs.readdirSync(downloadDir).filter(f => !f.endsWith('.crdownload'));
            const newFile = filesAfter.find(f => !filesBefore.has(f));
            if (newFile && newFile !== fileName) {
              fs.renameSync(path.join(downloadDir, newFile), path.join(downloadDir, fileName));
            }
          } catch (err) {
            console.log(`Error downloading resume: ${err.message}`);
            attachment = null;
          }
        }

        await page.click('a[data-test-close-pagination-header-button]');
        await page.waitForSelector('div[data-live-test-profile-index-tab-content]', { hidden: true });

        results.push({ ...basic, information: modalData, attachment });
        count++;
      }

      const nextBtn = await page.$('a[data-test-pagination-next]');

      if(nextBtn) {
        await Promise.all([
          nextBtn.click(),
          page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => {}),
        ]);
      }

      if(!nextBtn) {
        console.log('No more pages. Done!');
        break;
      }
    }

    return results;
  }
}

export default new ExtractRecruiteRpa();