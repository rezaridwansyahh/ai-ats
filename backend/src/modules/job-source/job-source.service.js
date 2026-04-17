import JobSource from './job-source.model.js';
import JobPostingSeek from '../platform/seek/job-post-seek.model.js';
import JobPost from '../job-post/job-post.model.js'
import JobAccount from '../job-account/job-account.model.js';
import User from '../user/user.model.js';
import Job from '../job/job.model.js';

class JobSourceService {
  async getAll() {
    return await JobSource.getAll();
  }

  async getById(id) {
    const posting = await JobSource.getById(id);
    if (!posting) throw { status: 404, message: 'Job Posting not found' };
    return posting;
  }

  async getByUserId(user_id) {
    const user = await User.getById(user_id);
    if (!user) throw { status: 404, message: 'User not found' };

    const postings = await JobSource.getByUserId(user_id);
    return { user, postings };
  }

  async getByJobId(job_id) {
    const job = await Job.getById(job_id);
    if (!job) throw { status: 404, message: 'Job not found' };

    const postings = await JobSource.getByJobId(job_id);
    return { job, postings };
  }

  async getByJobPostId(job_post_id) {
    const jobPost = await JobPost.getById(job_post_id);
    if(!jobPost) throw { status: 404, message: 'Job Post not found' };
    
    const postings = await JobSource.getByJobPostId(job_post_id);
    return { jobPost, postings }
  }

  async getByUserIdAndStatus(user_id, status) {
    const validStatuses = ['Draft', 'Submitted', 'Running', 'Expired'];
    if (!status) throw { status: 400, message: 'status query param is required' };
    if (!validStatuses.includes(status)) {
      throw { status: 400, message: `status must be one of: ${validStatuses.join(', ')}` };
    }

    const user = await User.getById(user_id);
    if (!user) throw { status: 404, message: 'User not found' };

    const postings = await JobSource.getByUserIdAndStatus(user_id, status);
    return { user, postings, status };
  }

  async getFullById(id) {
    const posting = await JobSource.getById(id);
    if (!posting) throw { status: 404, message: 'Job Posting not found' };

    let fullPosting;
    if (posting.platform === 'seek') {
      fullPosting = await JobPostingSeek.getSeek(id);
    } else if (posting.platform === 'linkedin') {
      // TODO: add linkedin model when it exists
      throw { status: 400, message: 'LinkedIn full details not yet implemented' };
    } else {
      throw { status: 400, message: `Unknown platform: ${posting.platform}` };
    }

    return fullPosting;
  }

  async getSeekByUserId(user_id) {
    const user = await User.getById(user_id);
    if (!user) throw { status: 404, message: 'User not found' };

    const postings = await JobPostingSeek.getSeekByUserId(user_id);
    return { user, postings };
  }

  async submitSeek(user_id, service, dataForm) {
    if (!user_id || !service || !dataForm) {
      throw { status: 400, message: 'user_id, service, and dataForm are required' };
    }

    if (service !== 'seek') {
      throw { status: 400, message: 'This endpoint only handles seek postings' };
    }

    const { jobTitle, payType, currency, min, max, display } = dataForm;

    if (!jobTitle) {
      throw { status: 400, message: 'jobTitle is required in dataForm' };
    }

    const user = await User.getById(user_id);
    if (!user) throw { status: 404, message: 'User not found' };

    const account = await JobAccount.getByUserIdAndPortal(user_id, 'seek');
    if (!account) throw { status: 404, message: 'No seek account found for this user' };
    if (!account.is_active) throw { status: 403, message: 'Seek account is inactive' };

    const newPosting = await JobSource.create(
      account.id,
      null,
      'seek',
      jobTitle
    );

    const seekDetails = await JobPostingSeek.create(
      newPosting.id,
      currency || null,
      payType  || null,
      min      || null,
      max      || null,
      display  || null
    );

    return { posting: newPosting, seekDetails };
  }

  async update(id, fields) {
    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: 'No fields provided for update' };
    }

    const posting = await JobSource.getById(id);
    if (!posting) throw { status: 404, message: 'Job Posting not found' };

    return await JobSource.update(id, fields);
  }

  async updateStatus(id, status) {
    if (!status) throw { status: 400, message: 'status is required' };

    const validStatuses = ['Draft', 'Submitted', 'Running', 'Expired'];
    if (!validStatuses.includes(status)) {
      throw { status: 400, message: `status must be one of: ${validStatuses.join(', ')}` };
    }

    const posting = await JobSource.getById(id);
    if (!posting) throw { status: 404, message: 'Job Posting not found' };

    return await JobSource.updateStatus(id, status);
  }

  async delete(id) {
    const posting = await JobSource.getById(id);
    if (!posting) throw { status: 404, message: 'Job Posting not found' };

    await JobSource.delete(id);
    return posting;
  }
}

export default new JobSourceService();
