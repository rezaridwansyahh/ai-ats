import seekService from "../../modules/platform/seek/seek.service.js";
import jobSourceModel from "../../modules/job-source/job-source.model.js";

const createJobPostHandler = async (data) => {
  await seekService.jobPost(data.account_id, data.service, data.dataForm);
};

const createJobPostDraftHandler = async (data) => {
  await seekService.jobPostDraft(data.account_id, data.service, data.job_post_id, data.dataForm);
}

const deleteJobPostDraftHandler = async (data) => {
  await seekService.deleteJobPostDraft(data.job_sourcing_id, data.account_id);
}

const extractCandidateHandler = async (data) => {
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

const handlers = {
  'seek-create-job-post': createJobPostHandler,
  'seek-create-job-post-draft': createJobPostDraftHandler,
  'seek-delete-job-post-draft': deleteJobPostDraftHandler,
  'seek-extract-candidate': extractCandidateHandler,
  'seek-sync-job-post': syncSeekJobPostHandler,
  'seek-check-connection': checkConnectionSeekHandler,
  'seek-sync-all': syncAllSeekHandler
};

export default handlers;