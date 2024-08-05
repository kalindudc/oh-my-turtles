import { createLogger, format, transports, config as winstonConfig } from 'winston';
import { redactionFormat } from './redactionFormat';
import { config } from '../config';

const { combine, timestamp, printf, colorize, label } = format;

const myFormat = printf(({ level, message, timestamp, label }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const createTaggedLogger = (tag: string) => {
  return createLogger({
    levels: winstonConfig.syslog.levels,
    format: combine(
      colorize(),
      label({ label: tag }),
      redactionFormat,
      timestamp(),
      myFormat
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: `logs/${tag}.log`, level: 'error' }),
      new transports.File({ filename: 'logs/combined.log', level: config.logger.level }),
    ]
  });
};

export default createTaggedLogger;
