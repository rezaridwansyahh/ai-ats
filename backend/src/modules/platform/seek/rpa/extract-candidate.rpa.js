import path from 'path';
import fs from 'fs';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

class ExtractCandidateService {
  async navigateToCandidatePage(page, application_id) {
    console.log('Navigating to candidates for job ID:', application_id);

    await page.goto(`https://id.employer.seek.com/id/candidates/?jobid=${application_id}`, {
      waitUntil: 'networkidle0',
    });

    console.log('Candidate page loaded');
  }

  async navigateToCandidateDetail(page, candidateType) {
    await page.waitForSelector('header');
    console.log(candidateType);

    const clicked = await page.evaluate((candidateType) => {
      const button = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent.includes(candidateType)
      );

      button?.click();
      return !!button;
    }, candidateType);

    if (clicked) {
      console.log('Navigated to candidate type:', candidateType);
    } else {
      console.log('Candidate type button not found:', candidateType);
    }
  }

  async extractCandidateType(page, application_id) {
    console.log('Extracting candidate types');

    const buckets = await page.evaluate((application_id) => {
      const buttons = document.querySelectorAll('[data-testid="desktop-buckets"]');
      const type = Array.from(buttons);
      const dataType = [];

      for (let i = 0; i < type.length; i++) {
        const nameEl = type[i].querySelector('div[data-testid="item"] > div:first-child span');
        const countEl = type[i].querySelector('div[data-testid="item"] > div:last-child span');

        dataType.push({
          name: nameEl.textContent.trim(),
          application_id,
          count: parseInt(countEl.textContent.trim().replace(/,/g, ""))
        });
      }

      return dataType;
    }, application_id);

    console.log('Candidate types extracted:', buckets);
    return buckets;
  }

  async extractCandidates(page, candidateType, account_id, application_id, job_name) {
    console.log(candidateType);
    console.log("Starting candidate extraction with pagination");

    await page.waitForSelector('[data-cy="job-application-list"]');

    // Click to open filter for full candidate list
    try {
      await page.waitForSelector('[data-testid="status-folder-buttons"]');
      const filter = await page.evaluate(() => {
        const filterBtn = document.querySelector('input[id="must-have-toggle"]');
        if (filterBtn) return true;
        return false;
      });

      if (filter) await page.click('input[id="must-have-toggle"]');
      await delay(1000);
      console.log('Filter toggle opened');
    } catch (error) {
      console.log('Filter toggle not found or already open');
    }

    let allCandidates = [];

    // Prepare download path: resumes/{account_id}/{jobId}_{jobName}/
    const safeName = job_name.replace(/[<>:"/\\|?*]+/g, '_');
    const downloadDir = path.resolve(`./resumes/${account_id}/${application_id}_${safeName}`);
    fs.mkdirSync(downloadDir, { recursive: true });

    while (true) {
      await delay(1000);
      const totalCards = await page.evaluate(() => {
        return document.querySelectorAll('[data-testid="job-application-card"]').length;
      });

      console.log(`\nFound ${totalCards} candidate cards on this page`);

      for (let i = 0; i < totalCards; i++) {
        const cardSelector = `[data-testid="job-application-card-${i}"]`;

        const cardData = await page.evaluate((selector) => {
          const card = document.querySelector(selector);
          if (!card) return null;

          let name = "";
          let last_position = "";

          const spans = Array.from(card.querySelectorAll("span"))
            .map(s => s.innerText.trim())
            .filter(t => t.length > 0);

          const filtered = spans.filter(t => t.length > 1);

          name = filtered[0] || "";
          last_position = filtered.slice(1, 5).join(" ");

          let address = "";

          const locationBlock = Array.from(card.querySelectorAll("span"))
            .find(span => {
              const svg = span.querySelector("svg");
              return svg && span.innerText.trim().length > 0 && !span.innerText.includes("Bachelor");
            });

          if (locationBlock) {
            const locText = locationBlock.innerText.trim();
            if (locText.length < 50) address = locText;
          }

          let education = "";

          const eduBlock = card.querySelector('[aria-describedby="tooltip-profile-details"]');
          if (eduBlock) {
            education = eduBlock.innerText.trim();
          }

          const information = {};

          const rows = Array.from(
            card.querySelectorAll('[data-cy="role-requirement"]')
          );

          rows.forEach(row => {
            const q = row.querySelector('[data-cy="question"] span')?.innerText.trim();
            const a = row.querySelector('[data-cy="answer-0"] span')?.innerText.trim();

            if (q) {
              information[q] = a || "";
            }
          });

          const dateWrapper = card.querySelector('span[aria-describedby]');
          const date = dateWrapper?.getAttribute('aria-describedby') || "";

          console.log("Card data:", name, last_position, address, education);
          return {
            name,
            last_position,
            address,
            education,
            information: Object.keys(information).length > 0 ? information : null,
            date
          };

        }, cardSelector);

        if (!cardData) {
          console.log(`Card ${i} not found, skipping...`);
          continue;
        }

        // Click card to open details
        await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          if (el) el.click();
        }, cardSelector);

        await page.waitForSelector('[data-cy="job-application-details"]', { timeout: 10000 });
        await delay(1000);

        const candidateId = await page.evaluate(() => {
          const url = new URL(window.location.href);
          return url.searchParams.get("selected");
        });

        console.log(`Candidate ID: ${candidateId}`);

        if (!candidateId) {
          console.log('No candidate_id found, skipping...');
          await page.evaluate(() => {
            const btn = document.querySelector('button[aria-label="Tutup halaman"]');
            if (btn) btn.click();
          });
          await delay(500);
          continue;
        }

        let resumeFileName = null;

        // Check if resume tab exists
        const hasResumeTab = await page.$('#tab-select-detail-view_3');

        if (hasResumeTab) {
          resumeFileName = `${application_id}_${candidateId}.pdf`;

          try {
            await page.click('#tab-select-detail-view_3');
            console.log("Resume tab opened");
            await delay(1000);

            const hasDownloadBtn = await page.$('#download-document-viewer');

            if (hasDownloadBtn) {
              await page._client().send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: downloadDir
              });

              await page.click('#download-document-viewer');
              console.log(`Downloading: ${resumeFileName}`);
              await delay(5000);
            } else {
              console.log('No download button found - Resume not available');
              resumeFileName = null;
            }
          } catch (error) {
            console.log(`Error downloading resume: ${error.message}`);
            resumeFileName = null;
          }
        } else {
          console.log(`No resume tab found for candidate ${candidateId}`);
        }

        // Close modal
        await page.evaluate(() => {
          const btn = document.querySelector('button[aria-label="Tutup halaman"]');
          if (btn) btn.click();
        });

        await delay(500);

        allCandidates.push({
          ...cardData,
          candidate_id: candidateId,
          attachment: resumeFileName
        });

        console.log(`Extracted candidate ${i + 1}/${totalCards}: ${cardData.name} (ID: ${candidateId})`);
      }

      console.log(`Candidates extracted so far: ${allCandidates.length}`);
      console.log('\nChecking for next page...');

      const nextBtn = await page.$('a[rel="next"][aria-hidden="false"]');

      if (nextBtn) {
        console.log("Next page detected, clicking...");

        await Promise.all([
          nextBtn.click(),
          page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => {}),
        ]);
      }

      if (!nextBtn) {
        console.log('No more pages. Done!');
        break;
      }

      console.log('Going to next page...');
      await delay(3000);
      await page.waitForSelector('[data-cy="job-application-list"]');
      await delay(2000);
    }

    console.log(`\nTotal candidates extracted: ${allCandidates.length}`);
    return allCandidates;
  }
}

export default new ExtractCandidateService();
