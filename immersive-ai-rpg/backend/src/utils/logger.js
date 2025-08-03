import winston from 'winston';
import path from 'path';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${
      info.stack ? `\n${info.stack}` : ''
    }`
  )
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
  }),
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
  }),
];

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs', { recursive: true });
} catch (error) {
  console.error('Could not create logs directory', error);
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels: logLevels,
  format,
  transports,
});

// Stream for morgan HTTP logging
export const stream = {
  write: (message) => logger.http(message.trim()),
};