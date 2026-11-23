import jobAccountModel from './account.model.js';
import userModel from '../user/user.model.js';
import registry from '../platform/shared/platform.registry.js';
import jobSourceModel from '../job-source/job-source.model.js';

import { encrypt, decrypt } from '../../shared/utils/encrypt.js';

class JobAccountService {
  async getByUserId(user_id, { platform } = {}) {
    const accounts = await jobAccountModel.findByUserId(user_id, { platform });

    return accounts
  }

  async getById(account_id) {
    const account = await jobAccountModel.findById(account_id);
    if (!account) throw { status: 404, message: 'Job Account not found' };

    account.password = decrypt(account.password);

    return account;
  }

  async checkConnection(account_id) {
    const account = await jobAccountModel.findById(account_id);
    if (!account) throw { status: 404, message: 'Job Account not found' };

    const adapter = registry[account.portal_name];
    if (!adapter?.checkConnection) {
      throw { status: 400, message: `check-connection not supported for ${account.portal_name}` };
    }

    return await adapter.checkConnection(account_id);
  }

  async syncJobSource(account_id) {
    const account = await jobAccountModel.findById(account_id);
    if (!account) throw { status: 404, message: 'Job Account not found' };

    const adapter = registry[account.portal_name];
    if (!adapter?.syncJobSource) {
      throw { status: 400, message: `sync-job-source not supported for ${account.portal_name}` };
    }

    return await adapter.syncJobSource(account_id);
  }

  async extractCandidates(account_id, job_sourcing_id) {
    if (!job_sourcing_id) throw { status: 400, message: 'job_sourcing_id is required' };

    const account = await jobAccountModel.findById(account_id);
    if (!account) throw { status: 404, message: 'Job Account not found' };

    const adapter = registry[account.portal_name];
    if (!adapter?.extractCandidate) {
      throw { status: 400, message: `candidate extraction not supported for ${account.portal_name}` };
    }

    const result = await adapter.extractCandidate(account_id, job_sourcing_id);
    await jobSourceModel.markSyncing(job_sourcing_id);
    return result;
  }

  async openDebugSession(account_id) {
    const account = await jobAccountModel.findById(account_id);
    if (!account) throw { status: 404, message: 'Job Account not found' };

    const adapter = registry[account.portal_name];
    if (!adapter?.debugSession) {
      throw { status: 400, message: `debug session not supported for ${account.portal_name}` };
    }

    return await adapter.debugSession(account_id);
  }

  async create(user_id, portal_name, email, password) {
    if (!user_id || !portal_name || !email || !password) {
      throw { status: 400, message: 'user_id, portal_name, email, and password are required'};
    }

    const user = await userModel.getById(user_id);

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const encryptedPassword = encrypt(password);

    const newAccount = await jobAccountModel.create(user_id, portal_name, email, encryptedPassword, user.company_id ?? null);

    return {
      message: 'Job Account created',
      newAccount
    };
  }

  async update(id, field) {
    const account = await jobAccountModel.findById(id);

    if (!account) throw { status: 404, message: 'Job Account not found' };

    if (field.password) field.password = encrypt(field.password);
    const updatedAccount = await jobAccountModel.update(id, field);

    return {
      message: 'Job Account updated',
      updatedAccount
    };
  }

  async delete(id) {
    const account = await jobAccountModel.findById(id);

    if (!account) throw { status: 404, message: 'Job Account not found' };

    await jobAccountModel.delete(id);

    return {
      message: 'Job Account deleted',
      account
    };
  }
}

export default new JobAccountService();
