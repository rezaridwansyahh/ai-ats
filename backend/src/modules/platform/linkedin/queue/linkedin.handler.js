import linkedinService from "../linkedin.service.js";
import { LINKEDIN_JOBS } from "./linkedin.jobs.js";

const checkConnectionLinkedinHandler = async (data) => {
  await linkedinService.checkConnection(data.account_id);
};

const handlers = {
  [LINKEDIN_JOBS.CHECK_CONNECTION]: checkConnectionLinkedinHandler,
};

export default handlers;
