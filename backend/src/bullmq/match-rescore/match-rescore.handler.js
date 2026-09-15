import jobModel from '../../modules/job/job.model.js';
import screeningModel from '../../modules/screening/screening.model.js';
import screeningService from '../../modules/screening/screening.service.js';

const rerunAllHandler = async ({ job_id }) => {
  console.log(`[Match-Rescore Worker] Force-rescoring all candidates for job ${job_id}`);

  const applicantIds = await screeningModel.getApplicantIdsForJob(job_id);

  if (applicantIds.length === 0) {
    await jobModel.markMatchRescoreDone(job_id, { processed: 0, total: 0, errorCount: 0 });
    console.log(`[Match-Rescore Worker] Job ${job_id} has no candidates — nothing to score.`);
    return;
  }

  await jobModel.markMatchRescoreRunning(job_id, applicantIds.length);

  try {
    // No req.user here (this runs off the queue, not an HTTP request) — the
    // AI budget check needs company_id, so pull it from the job itself.
    const job = await jobModel.getById(job_id);
    const result = await screeningService.scoreCandidatesList(job_id, applicantIds, {
      force: true,
      context: { company_id: job?.company_id ?? null },
    });
    await jobModel.markMatchRescoreDone(job_id, {
      processed: result.scored,
      total: result.total,
      errorCount: result.errors.length,
    });
    console.log(`[Match-Rescore Worker] Job ${job_id} done — ${result.scored}/${result.total} scored, ${result.errors.length} errors.`);
    if (result.errors.length > 0) {
      console.log(`[Match-Rescore Worker] Job ${job_id} errors:`, JSON.stringify(result.errors));
    }
  } catch (err) {
    await jobModel.markMatchRescoreFailed(job_id, err.message || String(err));
    throw err;
  }
};

const scorePendingHandler = async ({ job_id }) => {
  console.log(`[Match-Rescore Worker] Scoring pending candidates for job ${job_id}`);

  const pending = await screeningModel.getCandidatesByJobAndEngine(job_id, 'match');
  const applicantIds = pending.map((r) => r.applicant_id);

  if (applicantIds.length === 0) {
    await jobModel.markMatchRescoreDone(job_id, { processed: 0, total: 0, errorCount: 0 });
    console.log(`[Match-Rescore Worker] Job ${job_id} has no pending candidates.`);
    return;
  }

  await jobModel.markMatchRescoreRunning(job_id, applicantIds.length);

  try {
    const job = await jobModel.getById(job_id);
    const result = await screeningService.scoreCandidatesList(job_id, applicantIds, {
      force: false,
      context: { company_id: job?.company_id ?? null },
    });
    await jobModel.markMatchRescoreDone(job_id, {
      processed: result.scored,
      total: result.total,
      errorCount: result.errors.length,
    });
    console.log(`[Match-Rescore Worker] Job ${job_id} done — ${result.scored}/${result.total} scored, ${result.errors.length} errors.`);
    if (result.errors.length > 0) {
      console.log(`[Match-Rescore Worker] Job ${job_id} errors:`, JSON.stringify(result.errors));
    }
  } catch (err) {
    await jobModel.markMatchRescoreFailed(job_id, err.message || String(err));
    throw err;
  }
};

const handlers = {
  'match-rescore-all': rerunAllHandler,
  'match-score-pending': scorePendingHandler,
};

export default handlers;
