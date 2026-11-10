import seekQueue from "./seek.queue.js";
import { SEEK_JOBS } from "./seek.jobs.js";

// | | Linked | Unlinked |
// |---|---|---|
// | Manual    | 1 | 3 |
// | Scheduler | 2 | 4 |
// Linked dominates (a swept linked sourcing must still outrank a manually
// clicked unlinked one); manual-vs-scheduler is only a tiebreak within tier.
// async function computePriority(job_sourcing_id, trigger) {
//   const linkedJobIds = await jobSourceModel.getLinkedJobIds(job_sourcing_id);
//   const linked = linkedJobIds && linkedJobIds.length > 0;

//   if (linked) return trigger === 'manual' ? 1 : 2;
//   return trigger === 'manual' ? 3 : 4;
// }

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

export function enqueueExtractCandidate(account_id, job_sourcing_id) {
  const jobId = `seek-extract-candidate-${job_sourcing_id}`;
  return seekQueue.add(
    SEEK_JOBS.EXTRACT_CANDIDATE,
    { account_id, job_sourcing_id },
    { jobId },
  );
}