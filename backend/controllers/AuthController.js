import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

import User from '../model/UserModel.js';
import Role from '../model/RoleModel.js';
import logger from '../utils/logger.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = (() => {
  const ENV = process.env.NODE_ENV || "development";
  const envFile = ENV === "development" ? ".env.dev" : `.env.${ENV}`;

  dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) });

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return {
    JWT_SECRET: process.env.JWT_SECRET,
    ENV
  };
})();


class AuthController {

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
      }

      logger.info(`Login attempt: ${email}`);

      const user = await User.getByEmail(email);
      if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
      }

      const roles = await Role.getByUserId(user.id);
      const role_id = roles.length > 0 ? roles[0].role_id : null;

      const payload = {
        user_id: user.id,
        email: user.email,
        role_id: role_id
      };

      const token = jwt.sign(payload, CONFIG.JWT_SECRET, {
      expiresIn: '1h'
      });

      logger.info(`Login success: ${email}`);

      return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email
        }
      });

    } catch (err) {
      logger.error(`Login failed: ${err.message}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }


  static async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password ) {
        return res.status(400).json({
          message: 'Email and password are required'
        });
      }

      const existingUser = await User.getByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await User.create(email, hashedPassword);
      if (!newUser) {
        return res.status(500).json({ message: 'Failed to create user' });
      }

      logger.info(`User registered: ${email}`);

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email
        }
      });

    } catch (err) {
      logger.error(`Register failed: ${err.message}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default AuthController;
