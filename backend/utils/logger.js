import { createLogger, format, transports } from 'winston';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = (() => {
  const ENV = process.env.NODE_ENV || "development";
  const envFile = ENV === "development" ? ".env.dev" : `.env.${ENV}`;

  dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) });

  return { ENV };
})();

const homeDir = os.homedir();
const logDir = path.join(homeDir, 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

if (CONFIG.ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.simple()
    })
  );
}

export default logger;
