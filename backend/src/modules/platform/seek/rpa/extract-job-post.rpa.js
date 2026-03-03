import SeekJobMapper from '../../../../shared/utils/data-mapper-seek.js';
import browserPuppeteer from '../../../../shared/services/puppeteer/browser.puppeteer.js';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

class ExtractJobPostService {
  async waitForOptionalTable(page) {
    try {
      const table = await page.waitForSelector('table tbody tr td', {
        timeout: 3000 // wait max 3 seconds
      });

      return table; // table exists
    } catch (err) {
      return null; // table does NOT exist
    }
  }

  async waitForDotBtn(page, row) {
    try {
      const dotBtn = await row.waitForSelector('div[data-testid="job-action-dropdown-menu-trigger"]', {
        timeout: 3000 // wait max 3 seconds
      });

      return dotBtn;
    } catch(err) {
      return null;
    }
  }

  async waitForDropdown(page) {
    try {
      const modal = await page.waitForSelector('[aria-label="view-job-info"]', {
        timeout: 5000
      });

      return modal;
    } catch(err) {
      return null;
    }
  }

  async redirectJobsPage(page, type) {
    console.log('Navigating to jobs page');

    await page.goto(`https://id.employer.seek.com/id/jobs?type=${type}`, { waitUntil: 'networkidle0' });
  }

  async extractJobPost(page) {
    console.log('Starting Extract Job Post');
    const browser = browserPuppeteer.getBrowser();

    let results = [];
    let hasNext = true;

    while(hasNext) {
      const table = await this.waitForOptionalTable(page);

      if(!table) return results;

      await page.waitForFunction(() => {
        const firstCell = document.querySelector('table tbody tr td');
        return firstCell && firstCell.textContent.trim() !== '' && !firstCell.textContent.includes('_');
      });
      await delay(1000);
      
      const rows = await page.$$('table tbody tr');
      console.log('Start page');
      for (let i = 0; i < rows.length; i++) {

        const row = rows[i];

        // 1️⃣ Extract basic row info
        const basicData = await row.evaluate((row) => {
          const cells = Array.from(row.querySelectorAll('td'));
          const href = cells[1]?.querySelector('a')?.getAttribute('href') || '';
          const candidateCount = cells[2]?.querySelector('span:nth-of-type(1)')?.textContent.trim() || '';
          const wordCreated = cells[1]?.querySelector('span:nth-of-type(2)')?.textContent.trim();
          const check = wordCreated?.match(/(oleh)/);
          let createdDate;
          let createdBy;
          
          if(check) {
            createdDate = cells[1]?.querySelector('span:nth-of-type(2)')?.textContent.trim().match(/\d.+?(?=\s+oleh)/);
            createdBy = cells[1]?.querySelector('span:nth-of-type(2)')?.textContent.trim().match(/(?<=oleh\s).+$/);
          } else {
            createdDate = cells[1]?.querySelector('span:nth-of-type(2)')?.textContent.trim().match(/\d.*$/);
          }
          const statusT = cells[0]?.textContent.trim() || '';
          const idMatch = statusT === 'Draf' ? href.match(/draftId=(.+)/) : href.match(/(\d+)$/);
          console.log(idMatch);
          return {
            status: statusT,
            seek_id: statusT === 'Draf' ? idMatch[1] : idMatch[0],
            job_title: cells[1]?.querySelector('[data-testid="jobTitle"]')?.textContent.trim() || '',
            candidate_count: candidateCount ? parseInt(candidateCount.replace(/,/g, ""), 10) : null,
            created_date: createdDate ? createdDate[0] : null,
            created_by: createdBy ? createdBy[0] : null
          };
        });

        if (!basicData.seek_id) continue;

        console.log('click dot btn');

        const dotBtn = await this.waitForDotBtn(page, row);

        if (!dotBtn) {
          console.log("no btn");
          results.push(basicData);

          continue;
        }

        await dotBtn.click();

        const dropdown = await this.waitForDropdown(page);

        if (!dropdown) {
          results.push(basicData);
          continue;
        }

        // ---- NEW TAB: extract job description ----
        const [newPage] = await Promise.all([
          new Promise((resolve) => {
            const handler = async (target) => {
              const p = await target.page();
              if (p) {
                browser.off('targetcreated', handler);
                resolve(p);
              }
            };
            browser.on('targetcreated', handler);
          }),
          page.click('div[aria-label="view-job"]'),
        ]);

        await newPage.waitForSelector('div[data-automation="jobAdDetails"]', {
          visible: true,
          timeout: 10000
        });

        const contentDesc = await newPage.evaluate(() => {
          const div = document.querySelector('div[data-automation="jobAdDetails"]');
          return div?.firstElementChild?.innerHTML || '';
        });

        await newPage.close();
        await page.bringToFront();
        await delay(500);

        // ---- BACK TO ORIGINAL PAGE: re-query everything ----
        const freshRows = await page.$$('table tbody tr');
        const freshRow = freshRows[i];  // FIX: different variable name

        if (!freshRow) {
          results.push({ ...basicData, job_desc: contentDesc });
          continue;
        }

        // ---- MODAL: extract job detail ----
        const dotBtnAgain = await this.waitForDotBtn(page, freshRow);  // FIX: use freshRow

        if (!dotBtnAgain) {
          results.push({ ...basicData, job_desc: contentDesc });
          continue;
        }

        await dotBtnAgain.click();  // FIX: was using stale dotBtn

        const dropdown2 = await this.waitForDropdown(page);

        if (!dropdown2) {  // FIX: null check was missing
          results.push({ ...basicData, job_desc: contentDesc });
          continue;
        }

        await page.click('[aria-label="view-job-info"]');
        await page.waitForSelector('[data-testid="jobInformation"]', { visible: true });

        const jobDetail = await page.evaluate(() => {
          const modal = document.querySelector('[id="job-information"]');
          if (!modal) return null;

          const exclude = ['Ad ID', 'Classification', 'Posted by'];
          const result = {};

          modal.querySelectorAll('._1rkv0k82n').forEach(r => {
            const label = r.querySelector('.ryotqa2')?.innerText?.trim();
            const value = r.querySelector(':not(.ryotqa2) .ux6ywn0, :not(.ryotqa2) [data-testid]')?.innerText?.trim();

            if (label && value && !exclude.includes(label)) {
              result[label.toLowerCase().replace(/\s+/g, "_")] = value;
            }
          });

          return result;
        });

        await page.click('button[aria-label="Close"]');
        await page.waitForSelector('[id="job-information"]', { hidden: true });

        // ---- COMBINE ----
        results.push({
          ...basicData,
          ...jobDetail,
          job_desc: contentDesc
        });
      }
      const nextBtn = await page.$('a[rel="next"][aria-hidden="false"]');
      hasNext = false;

      if(nextBtn) {
        await Promise.all([
          nextBtn.click(),
          page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => {}),
        ]);

        hasNext = true;
      }

      if (!hasNext) console.log("No more pages.");
    }
    
    return results;
  }

  async syncAll(page, type) {
    await this.redirectJobsPage(page, type);
    const result = await this.extractJobPost(page);
    console.log(result);
    const normalized = SeekJobMapper.normalizeAll(result, type);
    return normalized;
  }
}

export default new ExtractJobPostService();