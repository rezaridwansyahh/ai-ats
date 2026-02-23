import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key in .env

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encrypted_password: encrypted,
    encryption_iv: iv.toString('hex')
  };
}

export function decrypt(encrypted_password, encryption_iv) {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encryption_iv, 'hex')
  );

  let decrypted = decipher.update(encrypted_password, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
