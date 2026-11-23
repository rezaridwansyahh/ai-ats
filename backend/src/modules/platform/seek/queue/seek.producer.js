import seekQueue from "./seek.queue.js";
import { SEEK_JOBS } from "./seek.jobs.js";
import jobSourceModel from "../../../job-source/job-source.model.js";

// | | Linked | Unlinked |
// |---|---|---|
// | Manual    | 1 | 3 |
// | Scheduler | 2 | 4 |
// Linked dominates (a swept linked sourcing must still outrank a manually
// clicked unlinked one); manual-vs-scheduler is only a tiebreak within tier.
// Lower number = higher BullMQ priority.
async function computePriority(job_sourcing_id, trigger) {
  const linkedJobIds = await jobSourceModel.getLinkedJobIds(job_sourcing_id);
  const linked = linkedJobIds && linkedJobIds.length > 0;

  if (linked) return trigger === 'manual' ? 1 : 2;
  return trigger === 'manual' ? 3 : 4;
}

export function enqueueCheckConnection(account_id) {
  return seekQueue.add(
    SEEK_JOBS.CHECK_CONNECTION,        
    { account_id },                   
    { deduplication: { id: `check-connection-${account_id}` } },
  );
}

export function enqueueSyncJobSource(account_id) {
  return seekQueue.add(
    SEEK_JOBS.SYNC_JOB,
    { account_id },
    { deduplication: { id: `sync-job-source-${account_id}` } },
  );
}

export function enqueueJobPostDraft(account_id, service, job_post_id, dataForm) {
  return seekQueue.add(
    SEEK_JOBS.CREATE_JOB_POST_DRAFT,
    { account_id, service, job_post_id, dataForm },
  );
}

// trigger: 'manual' (a recruiter's own Sync click) or 'scheduler' (the
// night sweep) — determines priority per the linked/unlinked x
// manual/scheduler table above. Defaults to 'manual' so existing callers
// that only pass (account_id, job_sourcing_id) keep working unchanged.
export async function enqueueExtractCandidate(account_id, job_sourcing_id, trigger = 'manual') {
  const priority = await computePriority(job_sourcing_id, trigger);
  return seekQueue.add(
    SEEK_JOBS.EXTRACT_CANDIDATE,
    { account_id, job_sourcing_id },
    {
      // deduplication (not a fixed jobId) — only blocks a second enqueue
      // while one for this sourcing is still active/waiting. A fixed jobId
      // would silently no-op every re-click once the first job completed or
      // failed, since BullMQ treats that id as already existing forever.
      deduplication: { id: `extract-candidate-${job_sourcing_id}` },
      priority,
    },
  );
}

// Super Admin only — opens a headful, remote-debuggable Puppeteer instance
// for this account on demand (its existing profile + cookies, not a fresh
// session), so a human can take over via chrome://inspect/VNC without
// needing to flip env vars or restart the worker. Never auto-retries
// (queue default is attempts: 1) — a retry would just launch a second,
// orphaned browser while someone's already looking at the first one.
export function enqueueDebugSession(account_id) {
  return seekQueue.add(
    SEEK_JOBS.DEBUG_SESSION,
    { account_id },
    { deduplication: { id: `debug-session-${account_id}` } },
  );
}