// One-off backfill — some candidates were synced from Seek before email
// scraping existed (extract-candidate.rpa.js now reads it off the opened
// candidate drawer, via [aria-label^="Email "]), so their master_applicant
// row is still sitting on email = NULL. This re-opens the Seek candidate
// list for one job_sourcing and, for applicants that still have no email,
// opens just their card long enough to read it and update the DB — no
// resume re-download, no re-parsing, nothing else touched.
//
// Requires a real Seek login (via the account's saved cookies) — this is
// live browser automation against Seek, not a DB-only script.
//
// Run with:
//   cd backend && node scripts/backfill-seek-emails.js
//
// Safe to re-run — only applicants with email IS NULL are targeted each
// time, so anyone already backfilled (or who already had an email) is
// left alone. If a candidate can't be found in the current Seek list
// (moved, deleted, or a name that no longer matches), it's reported at
// the end and simply stays NULL until you fix it manually.

import '../src/config/env.js';
import getDb from '../src/config/postgres.js';
import cookieService from '../src/modules/cookie/cookie.service.js';
import loginRpa from '../src/modules/platform/seek/rpa/login.rpa.js';
import extractCandidateRpa from '../src/modules/platform/seek/rpa/extract-candidate.rpa.js';
import jobPostSeekModel from '../src/modules/platform/seek/job-post-seek.model.js';
import applicantModel from '../src/modules/applicant/applicant.model.js';
import browserPuppeteer from '../src/shared/services/puppeteer/browser.puppeteer.js';

// ---- Edit these before running ----------------------------------------------
const ACCOUNT_ID       = 1; // <-- master_job_account.id used to log in to Seek
const JOB_SOURCING_ID   = 3; // <-- core_job_sourcing.id whose candidates to backfill
// -------------------------------------------------------------------------------

async function run() {
  const applicants = await applicantModel.getByJobSourcingId(JOB_SOURCING_ID);
  const missing = applicants.filter((a) => !a.email);

  if (missing.length === 0) {
    console.log('Every applicant for this sourcing already has an email — nothing to do.');
    return;
  }

  const targetNames = new Map(missing.map((a) => [a.name, a.id]));
  console.log(`Backfilling email for ${targetNames.size} applicant(s):`, [...targetNames.keys()]);

  const jobPostSeek = await jobPostSeekModel.getDetailsByJobSourcingId(JOB_SOURCING_ID);
  const page = await cookieService.includeCookiesIfExist(ACCOUNT_ID);

  try {
    await loginRpa.authenticatedPage(page, ACCOUNT_ID);
    await extractCandidateRpa.navigateToCandidatePage(page, jobPostSeek.seek_id);

    const buckets = await extractCandidateRpa.extractCandidateType(page, jobPostSeek.seek_id);

    for (const bucket of buckets) {
      if (targetNames.size === 0) break;
      if (bucket.count === 0) continue;

      await extractCandidateRpa.navigateToCandidateDetail(page, bucket.name);
      await extractCandidateRpa.backfillEmails(page, targetNames, async (name, email) => {
        const applicantId = targetNames.get(name);
        await applicantModel.updateEmail(applicantId, email);
        console.log(`  + ${name} -> ${email}`);
      });
    }
  } finally {
    await browserPuppeteer.close();
  }

  if (targetNames.size > 0) {
    console.log(`Done. Could not find an email for: ${[...targetNames.keys()].join(', ')}`);
  } else {
    console.log('Done. All applicants backfilled.');
  }
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Backfill failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });
