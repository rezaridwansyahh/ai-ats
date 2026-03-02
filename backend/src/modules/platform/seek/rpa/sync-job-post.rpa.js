const delay = (ms) => new Promise(r => setTimeout(r, ms));
const CrawlJob = require('../../models/crawlModel.js');

class SeekSyncJobPostService {
  async goToJobsPage(page) {
    console.log('Navigating to jobs page');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('a[href="/id/jobs"]')
    ]);
    
    console.log('Job page loaded');
  }

  async extractJobApplicationsType(page, worker_id) {
    console.log('Starting extract status job application');

    await page.waitForSelector('header');

    await page.exposeFunction('saveProgress', async (current) => {
      await CrawlJob.updateProgress(worker_id, current);
    });

    let lastPercent = 0;

    const dataAttributesName = await page.evaluate(async (lastPercent) => {
      const dataAttributes = Array.from(document.querySelectorAll('[data-test]'));

      const filtered = dataAttributes.filter((el) => {
        return /^jobs-.+-page$/.test(el.getAttribute('data-test'));
      });

      const countData = filtered.length;

      const status = [];

      for(let i = 0; i < countData; i++) {
        const el = filtered[i];

        status.push({
          name: el.textContent.trim(),
          values: el.getAttribute('data-test'),
          classname: el.getAttribute('class'),
        });

        const percent = Math.floor(((i + 1) / countData) * 50);

        if (percent >= lastPercent + 5) {
          lastPercent = percent - (percent % 5); // lock to 5% steps
          // await window.saveProgress(lastPercent, countData);
        }
      }

      const uniqueDesktop = status.splice(0, 4); //remove the first 4

      return status;
    }, lastPercent);

    //get the count
    for(let i = 0; i < dataAttributesName.length; i++) {
      const item = dataAttributesName[i];

      try {
        console.log('Navigating to Job Detail');
        await this.navigateToJobApplicationsDetail(
          page,
          item.classname,
          item.values
        );

        console.log('Getting Job Type Count');
        const count = await this.extractJobAppTypeCount(page);

        item.count = count;
      } catch (error) {
          console.log(`Error processing ${item.name}:`, error.message);
          item.count = 0; // Set count to 0 on error
      }

      const percent = 50 + Math.floor(((i + 1) / dataAttributesName.length) * 50);
      if (percent >= lastPercent + 5) {
        lastPercent = percent - (percent % 5);
        await CrawlJob.updateProgress(worker_id, lastPercent);
      }
    }

    return dataAttributesName;
  }

  async navigateToJobApplicationsDetail(page, className, values) {
    const classSelector = className.split(' ').map(c => `.${c}`).join('');
    const fullSelector = `${classSelector}[data-test="${values}"]`;
    console.log(classSelector);
    console.log(fullSelector);

    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click(fullSelector)
      ])

    } catch (error) {
        console.log(`Selector not found or click failed for: ${values}`);
    }
  }

  async extractJobAppTypeCount(page) {
    const data =  await page.evaluate(() => {
      const el = document.querySelector('[data-testid="totalCount"]');
      
      if (!el) return 0;

      const match = el.textContent.match(/\d+/);
      
      return match ? Number(match[0]) : 0;
    });

    return data;
  }
      
  async extractJobApplications(page, jobType, worker_id) {
    console.log('Waiting for Table content');
    let results = [];
    let hasNext = true;

    await page.exposeFunction('saveProgress', async (current) => {
      await CrawlJob.updateProgress(worker_id, current);
    });
    console.log(jobType);
    

    const countData = jobType.count;
    let lastPercent = 0;
    let dataExtracted = 0;

    while(hasNext) {
      await page.waitForSelector('table tbody tr td');

      console.log('Waiting data to fully Load');
      await page.waitForFunction(() => {
        const firstCell = document.querySelector('table tbody tr td');
        return firstCell && firstCell.textContent.trim() !== '' && !firstCell.textContent.includes('_');
      });
      await delay(1000);
      
      console.log('Processing Data');
      const tableData = await page.evaluate(async (countData, jobType, dataExtracted, lastPercent) => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        let extractedThisPage = dataExtracted;
        let percentThisPage =  lastPercent;
        
        const results = {
          extractedThisPage,
          percentThisPage,
          data: []
        };

        for(let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const cells = Array.from(row.querySelectorAll('td'));
          const href = cells[1]?.querySelector('a')?.getAttribute('href') || '';

          const id = href.match(/(\d+)$/);

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
          
          const candidateCount = cells[2]?.querySelector('span:nth-of-type(1)')?.textContent.trim() || '';

          results.data.push({
            status: cells[0]?.textContent.trim() || '',
            type_id: jobType.id,
            application_id: id ? parseInt(id[0]) : null ,
            name: cells[1]?.querySelector('[data-testid="jobTitle"]')?.textContent.trim() || '',
            location: cells[1]?.querySelector('[data-testid="location"]')?.textContent.trim() || '',
            created_date: createdDate ? createdDate[0] : null,
            created_by: createdBy ? createdBy[0] : null,
            candidate_count: candidateCount ? parseInt(candidateCount.replace(/,/g, ""), 10) : null
          });

          const percent = Math.floor(((extractedThisPage + 1) / countData) * 100);
          extractedThisPage++;
          results.extractedThisPage = extractedThisPage;

          if (percent >= percentThisPage + 5) {
            percentThisPage = percent - (percent % 5); // lock to 5% steps
            results.percentThisPage = percentThisPage;
            await window.saveProgress(percentThisPage);
          }
        }

        return results;
      }, countData, jobType, dataExtracted, lastPercent);
    
      results = results.concat(tableData.data);
      dataExtracted = tableData.extractedThisPage;
      lastPercent = tableData.percentThisPage;

      console.log("Checking next button...");
      const nextBtn = await page.$('a[rel="next"][aria-hidden="false"]');
      
      hasNext = false;

      if(nextBtn) {
        console.log("Next page detected, clicking...");

        await Promise.all([
          nextBtn.click(),
          page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => {}),
        ]);

        hasNext = true;
      }

      if (!hasNext) console.log("No more pages.");
    }
  
    console.log(`Total job applications extracted: ${results.length}`);
    return results;
  }
}

export default new SeekSyncJobPostService();