class ExtractJobPostService {
  async redirectJobsPage(page) {
    console.log('Navigating to jobs page');

    await page.waitForSelector('a[data-test="jobs-page"]', { visible: true, timeout: 10000 });
    await page.click('a[data-test="jobs-page"]');
  }

  async extractJobPost(page) {
    console.log('Starting Job Post');

    let results = [];
    let hasNext = true;

    while(hasNext) {
      await page.waitForSelector('table tbody tr td');

      console.log('Waiting data to fully Load');
      await page.waitForFunction(() => {
        const firstCell = document.querySelector('table tbody tr td');
        return firstCell && firstCell.textContent.trim() !== '' && !firstCell.textContent.includes('_');
      });
      await delay(1000);
      
      console.log('Processing Data');
      const tableData = await page.evaluate(async () => {
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
            seek_id: id ? parseInt(id[0]) : null ,
            job_title: cells[1]?.querySelector('[data-testid="jobTitle"]')?.textContent.trim() || '',
            job_location: cells[1]?.querySelector('[data-testid="location"]')?.textContent.trim() || '',
            created_date_seek: createdDate ? createdDate[0] : null,
            created_by: createdBy ? createdBy[0] : null,
            candidate_count: candidateCount ? parseInt(candidateCount.replace(/,/g, ""), 10) : null
          });
        }

        return results;
      }, jobType, dataExtracted, lastPercent);
    
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
  }
}