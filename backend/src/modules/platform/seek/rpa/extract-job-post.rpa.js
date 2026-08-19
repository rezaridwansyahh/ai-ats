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
          // get seek_id
          const href = row.getAttribute('data-testid');
          const seek_id = Number(href.match(/\d+/)[0]);

          // Select td as array of nodelist
          const cells = Array.from(row.querySelectorAll('td'));

          // get location, job title, job location
          const divMain = cells[0].querySelector('div');

          const divDividedArr = divMain.querySelectorAll(':scope > div');

          const job_title = divDividedArr[0].querySelector('[data-testid="jobTitle"]').innerText;

          const locations = divDividedArr[1].querySelector('span:first-of-type')?.textContent.trim();
          const created_by = divDividedArr[1].querySelector(':scope > span:nth-last-child(1)')?.textContent.trim();

          // get candidate count
          const countString = cells[1].querySelector('[data-testid="numberOfCandidatesLink"]').innerText;
          const countArr = countString.match(/\d+/g).map(Number); 
          const candidate_count = Number(countArr.join('')); 

          console.log(seek_id);
          console.log(job_title);
          console.log(locations);
          console.log(created_by);
          console.log(candidate_count);
          return {
            seek_id: seek_id,
            job_title: job_title,
            candidate_count: candidate_count,
            location: locations,
            created_by: created_by
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

        console.log("Extract Job Description");

        const newPage = await browser.newPage();
        await newPage.goto(`https://id.jobstreet.com/id/expiredjob/${basicData.seek_id}?ref=hirer-jobs-list`);

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

        const detailBtnClicked = await page.evaluate(() => {
          const btnDetail = document.querySelectorAll('[role="menuitem"]');
          if (!btnDetail[1]) return false;
          btnDetail[1].click();
          return true;
        });

        if (!detailBtnClicked) {
          results.push({ ...basicData, job_desc: contentDesc });
          continue;
        }

        await page.waitForSelector('[data-testid="jobInformation"]', { visible: true });

        const jobDetail = await page.evaluate(() => {
          const result = {};

          const container = document.querySelector('[data-testid="jobInformation"]');
          if (!container) return result;

          const blocks = container.querySelectorAll(':scope > div > div');

          blocks.forEach(block => {
            const rows = block.querySelectorAll(':scope > div');
            rows.forEach(row => {
              const keyEl   = row.firstElementChild;
              const valueEl = row.lastElementChild;
              if (!keyEl || !valueEl) return; // skip malformed rows instead of crashing the whole sync

              const key = keyEl.innerText;
              const value = valueEl.innerText;
              result[key.toLowerCase().replace(/\s+/g, "_")] = value;
            });
          });

          return result;
        });

        console.log("job detail", jobDetail);

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