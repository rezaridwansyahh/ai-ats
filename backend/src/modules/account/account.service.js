import jobAccountModel from './account.model.js';
import userModel from '../user/user.model.js';
import { encrypt } from '../../shared/utils/encrypt.js';

class JobAccountService {
  async getByUserId(user_id) {
    const accounts = await jobAccountModel.findByUserId(user_id);

    return accounts
  }

  async checkConnection(user_id, account_id) {
    
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
    // Inherit company_id from the creating user — without this, every job
    // account has company_id=NULL, which cascades into every applicant synced
    // through it also having company_id=NULL (invisible in Talent Pool) and
    // resume PDFs landing in an "unassigned_unknown" storage folder.
    const newAccount = await jobAccountModel.create(user_id, portal_name, email, encryptedPassword, user.company_id ?? null);

    return {
      message: 'Job Account created',
      newAccount
    };
  }

  async update(id, email, password) {
    const fields = {};
    if (email) fields.email = email;
    if (password) fields.password = encrypt(password);

    const account = await jobAccountModel.getById(id);
    if (!account) throw { status: 404, message: 'Job Account not found' };

    const updatedAccount = await jobAccountModel.update(id, fields);

    return {
      message: 'Job Account updated',
      updatedAccount
    };
  }

  async delete(id) {
    const account = await jobAccountModel.getById(id);

    if (!account) throw { status: 404, message: 'Job Account not found' };

    await jobAccountModel.delete(id);

    return {
      message: 'Job Account deleted',
      account
    };
  }
}

export default new JobAccountService();