import path from 'path';
import fs from 'fs';
import os from 'os';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// Polls downloadDir until a file not present in filesBefore shows up and is no
// longer .crdownload (i.e. Chrome finished writing it), instead of a fixed
// delay that misses slow downloads and silently leaves them un-renamed under
// their original filename.
async function waitForNewDownload(downloadDir, filesBefore, timeoutMs = 30000, intervalMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const filesNow = fs.readdirSync(downloadDir).filter(f => !f.endsWith('.crdownload'));
    const newFile = filesNow.find(f => !filesBefore.has(f));
    if (newFile) return newFile;
    await delay(intervalMs);
  }
  return null;
}

class ExtractCandidateService {
  async navigateToCandidatePage(page, seek_id) {
    console.log('Navigating to candidates for job ID:', seek_id);

    await page.goto(`https://id.employer.seek.com/id/candidates/?jobid=${seek_id}`, {
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

  async extractCandidateType(page, seek_id) {
    console.log('Extracting candidate types');

    const buckets = await page.evaluate((seek_id) => {
      const buttons = document.querySelectorAll('[data-testid="desktop-buckets"]');
      const type = Array.from(buttons);
      const dataType = [];

      for (let i = 0; i < type.length; i++) {
        const nameEl = type[i].querySelector('div[data-testid="item"] > div:first-child span');
        const countEl = type[i].querySelector('div[data-testid="item"] > div:last-child span');

        dataType.push({
          name: nameEl.textContent.trim(),
          seek_id,
          count: parseInt(countEl.textContent.trim().replace(/,/g, ""))
        });
      }

      return dataType;
    }, seek_id);

    console.log('Candidate types extracted:', buckets);
    return buckets;
  }

  // checkExists(name) → Promise<boolean>: called right after a card's name is
  // read, before we click into it — lets the caller skip the expensive part
  // (open detail modal, download resume) for candidates already synced from a
  // previous run instead of only deduping at DB insert time.
  // onSave(candidate) → Promise<void>: called immediately per candidate as
  // soon as it's fully scraped, instead of buffering everything into an array
  // and returning it only once the whole bucket (all pages) finishes — so a
  // crash/timeout partway through a large candidate list doesn't lose
  // everything scraped so far.
  async extractCandidates(page, candidateType, account_id, seek_id, job_name, { checkExists, onSave } = {}, progress) {
    console.log(candidateType);
    console.log("Starting candidate extraction with pagination");

    await page.waitForSelector('[data-testid="job-application-card"]');

    // Click to open filter for full candidate list
    try {
      await page.waitForSelector('[data-testid="status-folder-buttons"]');
      const filterOn = await page.evaluate(() => {
        const filterBtn = document.querySelector('input[id="must-have-toggle"]');
        return !!filterBtn && filterBtn.checked;
      });

      if (filterOn) {
        await page.click('input[id="must-have-toggle"]');
        await delay(1000);
        console.log('Filter toggle was on, turned off');
      } else {
        console.log('Filter toggle already off');
      }
    } catch (error) {
      console.log('Filter toggle not found or already open');
    }

    let saved = 0;
    let skipped = 0;

    // Download to a temp staging dir — at this point the applicant doesn't have
    // a master_applicant row yet (that only exists after seek.service.js calls
    // applicantModel.create), so we can't name/place the file into permanent
    // storage yet. seek.service.js promotes it into uploads/cv/{company}/ —
    // same location manual Talent Pool CV uploads use — once the applicant id
    // is known (see promoteDownloadedCv in shared/utils/cv-storage.js).
    const safeName = job_name.replace(/[<>:"/\\|?*]+/g, '_');
    const downloadDir = path.join(os.tmpdir(), 'seek-cv-staging', `${account_id}_${seek_id}_${safeName}`);
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
          // dont forget to change
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

          if(rows) {
            rows.forEach(row => {
              const q = row.querySelector('[data-cy="question"] span')?.innerText.trim();
              const a = row.querySelector('[data-cy="answer-0"] span')?.innerText.trim();

              // Seek shows a Match/No Match icon next to each screening question,
              // indicating whether the candidate's answer meets the job's stated
              // requirement for it — identified by the <svg><title> text since the
              // surrounding CSS classes are auto-generated/unstable.
              const iconTitle = row.querySelector('svg title')?.textContent?.trim();
              let meets_requirement = null;
              if (iconTitle === 'Match Icon') meets_requirement = true;
              else if (iconTitle === 'No Match Icon') meets_requirement = false;

              if (q) {
                information[q] = { answer: a || "", meets_requirement };
              }
            });
          }

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

        // Skip already-synced candidates before paying for the click + modal +
        // resume download — cheap short-circuit on re-sync.
        if (checkExists && cardData.name && await checkExists(cardData.name)) {
          console.log(`Already synced, skipping: ${cardData.name}`);
          skipped++;
          continue;
        }

        // Click card to open details
        await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          if (el) el.click();
        }, cardSelector);

        await page.waitForSelector('[id="details-view-drawer"]', { timeout: 10000 });
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
          const fileName = `${seek_id}_${candidateId}.pdf`;
          // Temp absolute path — promoted into permanent storage by seek.service.js
          // once the applicant's real DB id exists.
          resumeFileName = path.join(downloadDir, fileName);

          try {
            await page.click('#tab-select-detail-view_3');
            console.log("Resume tab opened");
            await delay(1000);

            const hasDownloadBtn = await page.$('#download-document-viewer');

            if (hasDownloadBtn) {
              // Snapshot files before download so we can identify the new file
              const filesBefore = new Set(fs.readdirSync(downloadDir));

              await page._client().send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: downloadDir
              });

              await page.click('#download-document-viewer');
              console.log(`Downloading: ${fileName}`);

              // Rename the newly downloaded file to our consistent naming convention
              const newFile = await waitForNewDownload(downloadDir, filesBefore);
              if (newFile && newFile !== fileName) {
                fs.renameSync(path.join(downloadDir, newFile), path.join(downloadDir, fileName));
                console.log(`Renamed: ${newFile} → ${fileName}`);
              } else if (!newFile) {
                console.log(`Download timed out, no file appeared for candidate ${candidateId}`);
                resumeFileName = null;
              }
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
        progress++;
        const candidate = { ...cardData, candidate_id: candidateId, progress, attachment: resumeFileName };

        // Save immediately rather than buffering — persists progress as we go
        // instead of holding the whole bucket in memory until it's all done.
        if (onSave) {
          await onSave(candidate);
        }
        saved++;

        console.log(`Extracted candidate ${i + 1}/${totalCards}: ${cardData.name} (ID: ${candidateId})`);
      }

      console.log(`Candidates saved so far: ${saved}, skipped (already synced): ${skipped}`);
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
      await page.waitForSelector('[data-testid="job-application-card"]');
      await delay(2000);
    }

    console.log(`\nTotal candidates saved: ${saved}, skipped: ${skipped}`);
    return { saved, skipped, progress };
  }
}

export default new ExtractCandidateService();
