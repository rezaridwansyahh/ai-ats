import jobAccountModel from './job-account.model.js';
import userModel from '../user/user.model.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 
const IV_LENGTH = 16;

class JobAccountController {
  encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf-8"), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(text) {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
  }

  async getAll() {
    const accounts = await jobAccountModel.getAll();

    return {
      message: 'List all Job Accounts',
      accounts
    };
  }

  async getById(id) {
    const account = await jobAccountModel.getById(id);

    if (!account) throw { status: 404, message: 'Job Account not found' };

    return{
      message: 'Job Account found',
      account
    };
  }

  async getByUserId(user_id) {
    const user = await userModel.getById(user_id);

    if (!user) throw { status: 404, message: 'User not found'}

    const accounts = await jobAccountModel.getByUserId(user_id);

    return{
      message: 'List of Job Accounts for this User',
      user,
      accounts
    };
  }

  async create(user_id, portal_name, email, password) {
    if (!user_id || !portal_name || !email || !password) {
      throw { status: 400, message: 'user_id, portal_name, email, and password are required'};
    }

    const user = await userModel.getById(user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const encryptedPassword = this.encrypt(password);
    const newAccount = await jobAccountModel.create(user_id, portal_name, email, encryptedPassword);

    return {
      message: 'Job Account created',
      newAccount
    };
  }

  async update(id, email, password) {
    const fields = {};
    if (email) fields.email = email;
    if (password) fields.password = this.encrypt(password);

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

export default new JobAccountController();