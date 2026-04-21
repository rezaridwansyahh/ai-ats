import linkedinService from "../../modules/platform/linkedin/linkedin.service.js";

const recruiteSearchHandler = async (data) => {
  await linkedinService.recruiteSearchQueued(data.sourcing_id, data.account_id, data.dataForm);
};

const handlers = {
  'linkedin-recruite-search': recruiteSearchHandler,
};

export default handlers;
