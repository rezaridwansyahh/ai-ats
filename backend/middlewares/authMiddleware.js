import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment file based on NODE_ENV
const ENV = process.env.NODE_ENV || "development";
const envFile = ENV === "development" ? ".env.dev" : `.env.${ENV}`;
dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) });

const JWT_SECRET = process.env.JWT_SECRET;

function authToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {

    if (err) return res.sendStatus(403); 

    req.user = user; // Add user data to request
    next();
  });

}

export default authToken;