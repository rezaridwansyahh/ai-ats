import JobPosting from './job-post.model.js';
import JobPostingSeek from '../platform/seek/job-post-seek.model.js';
import JobAccount from '../job-account/job-account.model.js';
import User from '../user/user.model.js';

class JobPostService {
  async getAll() {
    return await JobPosting.getAll();
  }

  async getById(id) {
    const posting = await JobPosting.getById(id);
    if (!posting) throw { status: 404, message: 'Job Posting not found' };
    return posting;
  }

  async getByUserId(user_id) {
    const user = await User.getById(user_id);
    if (!user) throw { status: 404, message: 'User not found' };

    const postings = await JobPosting.getByUserId(user_id);
    return { user, postings };
  }

  async getByUserIdAndStatus(user_id, status) {
    const validStatuses = ['Draft', 'Submitted', 'Running', 'Expired'];
    if (!status) throw { status: 400, message: 'status query param is required' };
    if (!validStatuses.includes(status)) {
      throw { status: 400, message: `status must be one of: ${validStatuses.join(', ')}` };
    }

    const user = await User.getById(user_id);
    if (!user) throw { status: 404, message: 'User not found' };

    const postings = await JobPosting.getByUserIdAndStatus(user_id, status);
    return { user, postings, status };
  }

  async getFullById(id) {
    const posting = await JobPosting.getById(id);
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

    const { jobTitle, jobLocation, workOption, workType, payType, currency, min, max, display } = dataForm;

    if (!jobTitle) {
      throw { status: 400, message: 'jobTitle is required in dataForm' };
    }

    const user = await User.getById(user_id);
    if (!user) throw { status: 404, message: 'User not found' };

    const account = await JobAccount.getByUserIdAndPortal(user_id, 'seek');
    if (!account) throw { status: 404, message: 'No seek account found for this user' };
    if (!account.is_active) throw { status: 403, message: 'Seek account is inactive' };

    const newPosting = await JobPosting.create(
      account.id,
      'seek',
      jobTitle,
      dataForm.jobDesc || null,
      jobLocation  || null,
      workOption   || null,
      workType     || null
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

    const posting = await JobPosting.getById(id);
    if (!posting) throw { status: 404, message: 'Job Posting not found' };

    return await JobPosting.update(id, fields);
  }

  async updateStatus(id, status) {
    if (!status) throw { status: 400, message: 'status is required' };

    const validStatuses = ['Draft', 'Submitted', 'Running', 'Expired'];
    if (!validStatuses.includes(status)) {
      throw { status: 400, message: `status must be one of: ${validStatuses.join(', ')}` };
    }

    const posting = await JobPosting.getById(id);
    if (!posting) throw { status: 404, message: 'Job Posting not found' };

    return await JobPosting.updateStatus(id, status);
  }

  async delete(id) {
    const posting = await JobPosting.getById(id);
    if (!posting) throw { status: 404, message: 'Job Posting not found' };

    await JobPosting.delete(id);
    return posting;
  }
}

export default new JobPostService();
