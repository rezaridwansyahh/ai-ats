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

  /**
   * Scrapes the full jobs table across all pages.
   *
   * options.onRow(rowData) — called immediately after each row finishes
   * processing (success OR graceful partial-failure), so the caller can
   * persist it right away instead of waiting for the whole scrape to
   * finish. This is what makes a crash partway through non-catastrophic —
   * everything already pushed via onRow is already saved.
   *
   * options.shouldSkipDetail(basicData) — called right after the cheap
   * row-level scrape, before opening the (expensive) detail modal. If it
   * resolves true, the modal is skipped entirely for that row — nothing
   * changed, nothing to persist.
   *
   * Returns lightweight counts ({ scraped, skipped, failed }), not the
   * scraped data itself — persistence already happened via onRow as each
   * row was processed, and nothing currently reads the full result set,
   * so there's no reason to hold every row's data in memory for the
   * entire run just to throw it away at the end.
   */
  async extractJobPost(page, { onRow, shouldSkipDetail } = {}) {
    console.log('Starting Extract Job Post');
    const browser = browserPuppeteer.getBrowser();

    const counts = { scraped: 0, skipped: 0, failed: 0 };
    let hasNext = true;

    const report = async (data) => {
      counts.scraped++;
      if (onRow) {
        try {
          await onRow(data);
        } catch (err) {
          // A failure persisting one row should never abort the scrape —
          // log and keep going. Callers are expected to handle their own
          // errors internally, but this is a last-resort safety net.
          console.error('[extractJobPost] onRow callback failed:', err.message);
        }
      }
    };

    while(hasNext) {
      const table = await this.waitForOptionalTable(page);

      if(!table) return counts;

      await page.waitForFunction(() => {
        const firstCell = document.querySelector('table tbody tr td');
        return firstCell && firstCell.textContent.trim() !== '' && !firstCell.textContent.includes('_');
      });
      await delay(1000);

      const rows = await page.$$('table tbody tr');
      console.log('Start page');
      for (let i = 0; i < rows.length; i++) {
        // Every row is independently guarded — one row's unexpected
        // failure (timeout, navigation error, unforeseen selector issue)
        // logs and moves on to the next row instead of aborting the
        // entire multi-page scrape and losing everything already gathered.
        try {
          const row = rows[i];

          // 1️⃣ Extract basic row info — every step is null-guarded so a
          // malformed/unexpected row (ad banner, skeleton, layout variant)
          // returns seek_id: null instead of throwing.
          const basicData = await row.evaluate((row) => {
            const empty = { seek_id: null, job_title: null, candidate_count: null, location: null, created_by: null };

            // get seek_id
            const href = row.getAttribute('data-testid');
            const seekIdMatch = href?.match(/\d+/);
            if (!seekIdMatch) return empty;
            const seek_id = Number(seekIdMatch[0]);

            // Select td as array of nodelist
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length < 2) return empty;

            // get location, job title, job location
            const divMain = cells[0].querySelector('div');
            if (!divMain) return empty;

            const divDividedArr = divMain.querySelectorAll(':scope > div');
            if (divDividedArr.length < 2) return empty;

            const job_title = divDividedArr[0].querySelector('[data-testid="jobTitle"]')?.innerText || null;

            const locations = divDividedArr[1].querySelector('span:first-of-type')?.textContent?.trim() || null;
            const created_by = divDividedArr[1].querySelector(':scope > span:nth-last-child(1)')?.textContent?.trim() || null;

            // get candidate count
            const countString = cells[1].querySelector('[data-testid="numberOfCandidatesLink"]')?.innerText;
            const countArr = countString?.match(/\d+/g)?.map(Number) || [];
            const candidate_count = countArr.length ? Number(countArr.join('')) : null;

            return {
              seek_id: seek_id,
              job_title: job_title,
              candidate_count: candidate_count,
              location: locations,
              created_by: created_by
            };
          });

          if (!basicData.seek_id) continue;

          // 2️⃣ Decide whether the expensive detail scrape is even needed.
          // NOTE: deliberately NOT calling report()/onRow() here — basicData
          // alone is missing job_desc/pay/work_option/etc (never scraped for
          // a skipped row), and normalizing+upserting that partial object
          // would overwrite the already-good stored detail with blanks.
          // Skip means "confirmed unchanged," which means nothing to persist.
          const skip = shouldSkipDetail ? await shouldSkipDetail(basicData) : false;
          if (skip) {
            counts.skipped++;
            continue;
          }

          console.log('click dot btn');

          const dotBtn = await this.waitForDotBtn(page, row);

          if (!dotBtn) {
            console.log("no btn");
            await report(basicData);
            continue;
          }

          await dotBtn.click();

          const dropdown = await this.waitForDropdown(page);

          if (!dropdown) {
            await report(basicData);
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
            await report({ ...basicData, job_desc: contentDesc });
            continue;
          }

          // ---- MODAL: extract job detail ----
          const dotBtnAgain = await this.waitForDotBtn(page, freshRow);  // FIX: use freshRow

          if (!dotBtnAgain) {
            await report({ ...basicData, job_desc: contentDesc });
            continue;
          }

          await dotBtnAgain.click();  // FIX: was using stale dotBtn

          const dropdown2 = await this.waitForDropdown(page);

          if (!dropdown2) {  // FIX: null check was missing
            await report({ ...basicData, job_desc: contentDesc });
            continue;
          }

          const detailBtnClicked = await page.evaluate(() => {
            const btnDetail = document.querySelectorAll('[role="menuitem"]');
            if (!btnDetail[1]) return false;
            btnDetail[1].click();
            return true;
          });

          if (!detailBtnClicked) {
            await report({ ...basicData, job_desc: contentDesc });
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
          await report({
            ...basicData,
            ...jobDetail,
            job_desc: contentDesc
          });
        } catch (rowErr) {
          counts.failed++;
          console.error(`[extractJobPost] Row ${i} failed, skipping:`, rowErr.message);
          continue;
        }
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

    return counts;
  }

  /**
   * options.onRow(normalizedRow) — called per row, already normalized
   * (SeekJobMapper.normalize applied), ready to persist immediately.
   * options.shouldSkipDetail(basicData, type) — see extractJobPost above;
   * `type` is threaded in automatically here so the caller doesn't need
   * its own closure over it.
   *
   * Returns the same { scraped, skipped, failed } counts as extractJobPost.
   */
  async syncAll(page, type, { onRow, shouldSkipDetail } = {}) {
    await this.redirectJobsPage(page, type);

    const counts = await this.extractJobPost(page, {
      shouldSkipDetail: shouldSkipDetail
        ? (basicData) => shouldSkipDetail(basicData, type)
        : undefined,
      onRow: onRow
        ? async (rawRow) => {
            const normalized = SeekJobMapper.normalize(rawRow, type);
            await onRow(normalized);
          }
        : undefined,
    });

    return counts;
  }
}

export default new ExtractJobPostService();
