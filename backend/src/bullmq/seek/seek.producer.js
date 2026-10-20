import seekQueue from "./seek.queue.js";
import jobSourceModel from "../../modules/job-source/job-source.model.js";

// | | Linked | Unlinked |
// |---|---|---|
// | Manual    | 1 | 3 |
// | Scheduler | 2 | 4 |
// Linked dominates (a swept linked sourcing must still outrank a manually
// clicked unlinked one); manual-vs-scheduler is only a tiebreak within tier.
async function computePriority(job_sourcing_id, trigger) {
  const linkedJobIds = await jobSourceModel.getLinkedJobIds(job_sourcing_id);
  const linked = linkedJobIds && linkedJobIds.length > 0;

  if (linked) return trigger === 'manual' ? 1 : 2;
  return trigger === 'manual' ? 3 : 4;
}

class SeekProducer {
  async createSeekJobPost(account_id, service, dataForm) {
    const job = await seekQueue.add('seek-create-job-post', {
      account_id,
      service,
      dataForm
    });

    return job;
  }

  async createSeekJobPostDraft(account_id, service, job_post_id, dataForm) {
    const job = await seekQueue.add('seek-create-job-post-draft', {
      account_id,
      service,
      job_post_id,
      dataForm
    });

    return job;
  }

  async deleteSeekJobPostDraft(job_sourcing_id, account_id) {
    const job = await seekQueue.add('seek-delete-job-post-draft', {
      job_sourcing_id,
      account_id
    });

    return job;
  }

  async updateSeekJobPostDraft(job_sourcing_id, account_id, dataForm) {
    const job = await seekQueue.add('seek-update-job-post-draft', {
      job_sourcing_id,
      account_id,
      dataForm
    });

    return job;
  }

  // trigger: 'manual' (Sync button / controller) or 'scheduler' (night/day
  // sweep) — determines both queue priority (see computePriority above) and
  // the per-sourcing duplicate guard below.
  async extractSeekCandidate(account_id, job_sourcing_id, trigger = 'manual') {
    const jobId = `seek-extract-candidate-${job_sourcing_id}`;
    const existing = await seekQueue.getJob(jobId);

    if (existing) {
      const state = await existing.getState();
      if (['waiting', 'active', 'delayed', 'paused'].includes(state)) {
        return { job: existing, alreadyQueued: true };
      }
      // stale (completed/failed) — clear it so the same jobId can be reused
      await existing.remove();
    }

    const priority = await computePriority(job_sourcing_id, trigger);

    const job = await seekQueue.add('seek-extract-candidate', {
      account_id,
      job_sourcing_id
    }, { jobId, priority });

    return { job, alreadyQueued: false };
  }

  // Deterministic jobId per account so a duplicate Sync click can't queue
  // a redundant back-to-back scrape. We can't rely on BullMQ's jobId
  // collision alone though — completed jobs stick around for hours
  // (removeOnComplete), and a naive add() would silently no-op forever
  // after the first successful run. So: check the existing job's state
  // explicitly, and only block if one is genuinely still in flight.
  async syncSeekJobPost(account_id) {
    const jobId = `seek-sync-job-post-${account_id}`;
    const existing = await seekQueue.getJob(jobId);

    if (existing) {
      const state = await existing.getState();
      if (['waiting', 'active', 'delayed', 'paused'].includes(state)) {
        return { job: existing, alreadyQueued: true };
      }
      // stale (completed/failed) — clear it so the same jobId can be reused
      await existing.remove();
    }

    const job = await seekQueue.add('seek-sync-job-post', { account_id }, { jobId });
    return { job, alreadyQueued: false };
  }

  async checkConnection(account_id) {
    const job = await seekQueue.add('seek-check-connection', {
      account_id
    });

    return job;
  }

  async syncAll(account_id) {
    const job = await seekQueue.add('seek-sync-all', {
      account_id
    });

    return job;
  }
}

export default new SeekProducer();