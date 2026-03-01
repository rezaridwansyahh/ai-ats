import JobAccount from '../model/JobAccountModel.js';
import User from '../model/UserModel.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
}

class JobAccountController {
  static async getAll(req, res) {
    try {
      const accounts = await JobAccount.getAll();

      res.status(200).json({
        message: 'List all Job Accounts',
        accounts
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getById(req, res) {
    const { id } = req.params;

    try {
      const account = await JobAccount.getById(id);

      if (!account) {
        return res.status(404).json({ message: 'Job Account not found' });
      }

      res.status(200).json({
        message: 'Job Account found',
        account
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getByUserId(req, res) {
    const { user_id } = req.params;

    try {
      const user = await User.getById(user_id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const accounts = await JobAccount.getByUserId(user_id);

      res.status(200).json({
        message: 'List of Job Accounts for this User',
        user,
        accounts
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async create(req, res) {
    const { user_id, portal_name, email, password } = req.body;

    try {
      if (!user_id || !portal_name || !email || !password) {
        return res.status(400).json({ message: 'user_id, portal_name, email, and password are required' });
      }

      const user = await User.getById(user_id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existing = await JobAccount.getByUserIdAndPortal(user_id, portal_name);
      if (existing) {
        return res.status(409).json({ message: `User already has a ${portal_name} account registered` });
      }

      const encryptedPassword = encrypt(password);
      const newAccount = await JobAccount.create(user_id, portal_name, email, encryptedPassword);

      res.status(201).json({
        message: 'Job Account created',
        newAccount
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const { email, password } = req.body;

    const fields = {};
    if (email) fields.email = email;
    if (password) fields.password = encrypt(password);

    try {
      const account = await JobAccount.getById(id);
      if (!account) {
        return res.status(404).json({ message: 'Job Account not found' });
      }

      const updatedAccount = await JobAccount.update(id, fields);

      res.status(200).json({
        message: 'Job Account updated',
        updatedAccount
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async delete(req, res) {
    const { id } = req.params;

    try {
      const account = await JobAccount.getById(id);
      if (!account) {
        return res.status(404).json({ message: 'Job Account not found' });
      }

      await JobAccount.delete(id);

      res.status(200).json({
        message: 'Job Account deleted',
        account
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }


}

export default JobAccountController;