import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserModel from '../user/user.model.js';

class AuthService {
  async login(email, password) {
    if (!email || !password) throw { status: 400, message: 'Email and Password are required' };

    const user = await UserModel.getByEmail(email);
    if (!user) throw { status: 401, message: 'Invalid email or password' };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw { status: 401, message: 'Invalid email or password' };

    const payload = {
      user_id: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    };
  }
}

export default new AuthService();
