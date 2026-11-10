import linkedinQueue from "./linkedin.queue.js";
import { LINKEDIN_JOBS } from "./linkedin.jobs.js";

export function enqueueCheckConnection(account_id) {
  return linkedinQueue.add(
    LINKEDIN_JOBS.CHECK_CONNECTION,
    { account_id },
    { deduplication: { id: `check-connection-${account_id}` } },
  );
}
