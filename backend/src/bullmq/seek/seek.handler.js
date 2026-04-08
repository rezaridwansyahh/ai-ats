import seekService from "../../modules/platform/seek/seek.service.js";

const createJobPostHandler = async (data) => {
  await seekService.jobPost(data.account_id, data.service, data.dataForm);
};

const createJobPostDraftHandler = async (data) => {
  await seekService.jobPostDraft(data.account_id, data.service, data.job_id, data.dataForm);
}

const deleteJobPostDraftHandler = async (data) => {
  await seekService.deleteJobPostDraft(data.job_posting_id, data.account_id);
}

const extractCandidateHandler = async (data) => {
  await seekService.extractCandidates(data.account_id, data.job_posting_id);
}

const syncSeekJobPostHandler = async (data) => {
  await seekService.syncJobPostAll(data.account_id);
}

const checkConnectionSeekHandler = async (data) => {
  await seekService.checkConnection(data.account_id);
}

const handlers = {
  'seek-create-job-post': createJobPostHandler,
  'seek-create-job-post-draft': createJobPostDraftHandler,
  'seek-delete-job-post-draft': deleteJobPostDraftHandler,
  'seek-extract-candidate': extractCandidateHandler,
  'seek-sync-job-post': syncSeekJobPostHandler,
  'seek-check-connection': checkConnectionSeekHandler
};

export default handlers;