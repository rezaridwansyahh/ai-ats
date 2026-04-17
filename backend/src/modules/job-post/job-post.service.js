import JobPost from './job-post.model.js';
import Job from '../job/job.model.js';
import JobAccount from '../job-account/job-account.model.js';
import seekProducer from '../../bullmq/seek/seek.producer.js';

const VALID_TYPES = ['Internal', 'Publish'];
const SUPPORTED_PLATFORMS = ['seek'];

class JobPostService {
  async getAll() {
    return await JobPost.getAll();
  }

  async getById(id) {
    const jobPost = await JobPost.getById(id);
    if (!jobPost) throw { status: 404, message: 'Job post not found' };
    return jobPost;
  }

  async getByJobId(job_id) {
    return await JobPost.getByJobId(job_id);
  }

  async create({ job_id, type }) {
    if (!job_id || !type) {
      throw { status: 400, message: 'job_id and type are required' };
    }
    if (!VALID_TYPES.includes(type)) {
      throw { status: 400, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` };
    }

    return await JobPost.create(job_id, type);
  }

  async update(id, fields) {
    const existing = await JobPost.getById(id);
    if (!existing) throw { status: 404, message: 'Job post not found' };

    const allowed = {};
    if (fields.type !== undefined) {
      if (!VALID_TYPES.includes(fields.type)) {
        throw { status: 400, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` };
      }
      allowed.type = fields.type;
    }

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    return await JobPost.update(id, allowed);
  }

  async delete(id) {
    const jobPost = await JobPost.getById(id);
    if (!jobPost) throw { status: 404, message: 'Job post not found' };
    await JobPost.delete(id);
    return jobPost;
  }

  async publish({ job_id, type, user_id, platforms = [] }) {
    if (!job_id || !type) {
      throw { status: 400, message: 'job_id and type are required' };
    }
    if (!VALID_TYPES.includes(type)) {
      throw { status: 400, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` };
    }

    const job = await Job.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };

    if (type === 'Internal') {
      const jobPost = await JobPost.create(job_id, 'Internal');
      return { jobPost, queued: [] };
    }

    if (!user_id) {
      throw { status: 400, message: 'user_id is required for Publish type' };
    }
    if (!Array.isArray(platforms) || platforms.length === 0) {
      throw { status: 400, message: 'At least one platform is required for Publish type' };
    }

    const unknown = platforms.filter(p => !SUPPORTED_PLATFORMS.includes(p));
    if (unknown.length > 0) {
      throw { status: 400, message: `Unsupported platforms: ${unknown.join(', ')}. Supported: ${SUPPORTED_PLATFORMS.join(', ')}` };
    }

    const accounts = {};
    for (const platform of platforms) {
      const account = await JobAccount.getByUserIdAndPortal(user_id, platform);
      if (!account) {
        throw { status: 400, message: `No ${platform} account connected for this user` };
      }
      accounts[platform] = account;
    }

    const jobPost = await JobPost.create(job_id, 'Publish');

    const platformForm = {
      job_title: job.job_title,
      job_desc: job.job_desc,
      job_location: job.job_location,
      work_option: job.work_option,
      work_type: job.work_type,
      pay_type: job.pay_type,
      currency: job.currency,
      pay_min: job.pay_min,
      pay_max: job.pay_max,
      pay_display: job.pay_display,
    };

    const queued = [];
    for (const platform of platforms) {
      const account = accounts[platform];

      if (platform === 'seek') {
        const queuedJob = await seekProducer.createSeekJobPostDraft(
          account.id,
          'seek',
          jobPost.id,
          platformForm
        );
        queued.push({ platform, queue_job_id: queuedJob.id });
      }
    }

    return { jobPost, queued };
  }
}

export default new JobPostService();
