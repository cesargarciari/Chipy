import { pino, type LoggerOptions } from 'pino';
import type { AppConfig } from '../config.js';

/**
 * Structured JSON logs in every environment (that is what CloudWatch Logs
 * Insights wants). Pretty-print only for local development.
 */
export function loggerOptions(config: AppConfig): LoggerOptions {
  const redact = ['req.headers.authorization', 'req.headers.cookie'];

  if (config.isProduction || config.isTest) {
    return { level: config.isTest ? 'silent' : config.logLevel, redact };
  }

  return {
    level: config.logLevel,
    redact,
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  };
}

export function createLogger(config: AppConfig) {
  return pino(loggerOptions(config));
}
