// src/logger.ts
import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, label } = format;

const myFormat = printf(({ level, message, timestamp, label }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const createTaggedLogger = (tag: string) => {
  return createLogger({
    level: 'info',
    format: combine(
      colorize(),
      label({ label: tag }),
      timestamp(),
      myFormat
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: `logs/${tag}.log`, level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' })
    ]
  });
};

export default createTaggedLogger;
