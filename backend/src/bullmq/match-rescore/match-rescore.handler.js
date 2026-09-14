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
    const result = await screeningService.scoreCandidatesList(job_id, applicantIds, { force: true });
    await jobModel.markMatchRescoreDone(job_id, {
      processed: result.scored,
      total: result.total,
      errorCount: result.errors.length,
    });
    console.log(`[Match-Rescore Worker] Job ${job_id} done — ${result.scored}/${result.total} scored, ${result.errors.length} errors.`);
  } catch (err) {
    await jobModel.markMatchRescoreFailed(job_id, err.message || String(err));
    throw err;
  }
};

const handlers = {
  'match-rescore-all': rerunAllHandler,
};

export default handlers;
