import seekService from "../../modules/platform/seek/seek.service.js";
import jobSourceModel from "../../modules/job-source/job-source.model.js";
import seekProducer from "./seek.producer.js";

const NIGHT_START_HOUR = 21; // 9PM
const NIGHT_END_HOUR = 5;    // 5AM
function isNightWindow() {
  const hour = new Date().getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

const createJobPostHandler = async (data) => {
  await seekService.jobPost(data.account_id, data.service, data.dataForm);
};

const createJobPostDraftHandler = async (data) => {
  await seekService.jobPostDraft(data.account_id, data.service, data.job_post_id, data.dataForm);
}

const deleteJobPostDraftHandler = async (data) => {
  await seekService.deleteJobPostDraft(data.job_sourcing_id, data.account_id);
}

const extractCandidateHandler = async (data, job) => {
  // priority <= 2 means linked (see the priority table in seek.producer.js) —
  // linked sourcings always run; unlinked ones are deferred to the
  // 9PM-5AM night window so business hours are reserved for high-priority
  // work. Picked up again by the next night sweep if skipped here.
  const linked = (job?.opts?.priority ?? 1) <= 2;

  if (!linked && !isNightWindow()) {
    console.log(`[Worker] Skipping unlinked job_sourcing ${data.job_sourcing_id} — outside night window`);
    return;
  }

  try {
    await seekService.extractCandidates(data.account_id, data.job_sourcing_id);
    await jobSourceModel.markSynced(data.job_sourcing_id);   // idle + last_sync
  } catch (err) {
    await jobSourceModel.markSyncError(data.job_sourcing_id); // error badge in UI
    throw err;
  }
}

const syncSeekJobPostHandler = async (data) => {
  await seekService.syncJobPostAll(data.account_id);
}

const checkConnectionSeekHandler = async (data) => {
  await seekService.checkConnection(data.account_id);
}

const syncAllSeekHandler = async (data) => {
  await seekService.syncAll(data.account_id);
}

// Night sweep (9PM-5AM, ~every 30min): every eligible sourcing, linked or
// not — this is the once-a-night guarantee every Active sourcing gets swept
// regardless of priority.
const seekNightScanHandler = async () => {
  const rows = await jobSourceModel.getSeekSchedulerEligible();
  console.log(`[Scheduler] Night scan: ${rows.length} eligible sourcing(s)`);

  for (const row of rows) {
    try {
      await jobSourceModel.markSyncing(row.id);
      await seekProducer.extractSeekCandidate(row.account_id, row.id, 'scheduler');
    } catch (err) {
      console.error(`[Scheduler] Night scan failed to enqueue sourcing ${row.id}:`, err.message);
    }
  }
}

// Day sweep (5AM-9PM, hourly): linked sourcings only — keeps high-priority
// candidates fresh during business hours without touching anything the
// worker's day/night gate would defer anyway.
const seekDayScanHandler = async () => {
  const rows = await jobSourceModel.getSeekSchedulerEligible({ linkedOnly: true });
  console.log(`[Scheduler] Day scan: ${rows.length} eligible linked sourcing(s)`);

  for (const row of rows) {
    try {
      await jobSourceModel.markSyncing(row.id);
      await seekProducer.extractSeekCandidate(row.account_id, row.id, 'scheduler');
    } catch (err) {
      console.error(`[Scheduler] Day scan failed to enqueue sourcing ${row.id}:`, err.message);
    }
  }
}

const handlers = {
  'seek-create-job-post': createJobPostHandler,
  'seek-create-job-post-draft': createJobPostDraftHandler,
  'seek-delete-job-post-draft': deleteJobPostDraftHandler,
  'seek-extract-candidate': extractCandidateHandler,
  'seek-sync-job-post': syncSeekJobPostHandler,
  'seek-check-connection': checkConnectionSeekHandler,
  'seek-sync-all': syncAllSeekHandler,
  'seek-night-scan': seekNightScanHandler,
  'seek-day-scan': seekDayScanHandler
};

export default handlers;