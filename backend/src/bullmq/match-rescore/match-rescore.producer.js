import matchRescoreQueue from './match-rescore.queue.js';

class MatchRescoreProducer {
  async rerunAll({ job_id }) {
    const job = await matchRescoreQueue.add('match-rescore-all', { job_id });
    return job;
  }
}

export default new MatchRescoreProducer();
