import winston from 'winston';
import path from 'path';
import { config } from '../config';

// Ensure logs directory exists
import fs from 'fs';
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'intertools-license-server' },
  transports: [
    // Write all logs to file
    new winston.transports.File({ 
      filename: config.logging.file,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
  ],
});

// In development, also log to console
if (config.nodeEnv === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export { logger };

// Security logging helpers
export const securityLogger = {
  suspiciousActivity: (email: string, ip: string, reason: string, metadata?: any) => {
    logger.warn('Suspicious activity detected', {
      type: 'security',
      email,
      ip,
      reason,
      metadata,
      timestamp: new Date().toISOString()
    });
  },

  trialAbuse: (email: string, ip: string, attempts: number) => {
    logger.warn('Trial abuse detected', {
      type: 'trial_abuse',
      email,
      ip,
      attempts,
      timestamp: new Date().toISOString()
    });
  },

  tokenGenerated: (email: string, tokenType: 'trial' | 'subscription', expiresAt?: Date) => {
    logger.info('Token generated', {
      type: 'token_generated',
      email,
      tokenType,
      expiresAt: expiresAt?.toISOString(),
      timestamp: new Date().toISOString()
    });
  },

  tokenVerified: (email: string, success: boolean, reason?: string) => {
    logger.info('Token verification', {
      type: 'token_verification',
      email,
      success,
      reason,
      timestamp: new Date().toISOString()
    });
  }
};
