import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger, securityLogger } from './logger';

// In-memory store for rate limiting (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstAttempt: number;
}

const trialLimitStore = new Map<string, RateLimitEntry>();
const apiLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiter for trial token generation
 */
export function trialRateLimit(req: Request, res: Response, next: NextFunction) {
  const email = req.body.email?.toLowerCase();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Create composite key (email + IP for additional security)
  const key = `${email}:${ip}`;
  const now = Date.now();
  const windowMs = config.rateLimiting.trialWindowHours * 60 * 60 * 1000;

  let entry = trialLimitStore.get(key);

  if (!entry) {
    // First attempt
    entry = {
      count: 1,
      resetTime: now + windowMs,
      firstAttempt: now
    };
    trialLimitStore.set(key, entry);
    return next();
  }

  // Check if window has expired
  if (now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
      firstAttempt: now
    };
    trialLimitStore.set(key, entry);
    return next();
  }

  // Increment count
  entry.count++;

  if (entry.count > config.rateLimiting.trialPerEmail) {
    // Rate limit exceeded
    const timeLeft = Math.ceil((entry.resetTime - now) / 1000 / 60); // minutes
    
    securityLogger.trialAbuse(email, ip, entry.count);
    
    return res.status(429).json({
      error: 'Too many trial requests',
      message: `You have exceeded the trial limit. Please try again in ${timeLeft} minutes.`,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    });
  }

  // Log suspicious activity if many attempts
  if (entry.count >= config.rateLimiting.trialPerEmail - 1) {
    securityLogger.suspiciousActivity(
      email, 
      ip, 
      'Approaching trial rate limit',
      { attempts: entry.count, timeWindow: config.rateLimiting.trialWindowHours }
    );
  }

  next();
}

/**
 * General API rate limiter
 */
export function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  let entry = apiLimitStore.get(ip);

  if (!entry) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
      firstAttempt: now
    };
    apiLimitStore.set(ip, entry);
    return next();
  }

  if (now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
      firstAttempt: now
    };
    apiLimitStore.set(ip, entry);
    return next();
  }

  entry.count++;

  if (entry.count > config.rateLimiting.apiPerMinute) {
    const timeLeft = Math.ceil((entry.resetTime - now) / 1000);
    
    logger.warn('API rate limit exceeded', { ip, attempts: entry.count });
    
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: timeLeft
    });
  }

  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': config.rateLimiting.apiPerMinute.toString(),
    'X-RateLimit-Remaining': Math.max(0, config.rateLimiting.apiPerMinute - entry.count).toString(),
    'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
  });

  next();
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  
  // Clean trial store
  for (const [key, entry] of trialLimitStore.entries()) {
    if (now > entry.resetTime) {
      trialLimitStore.delete(key);
    }
  }
  
  // Clean API store
  for (const [key, entry] of apiLimitStore.entries()) {
    if (now > entry.resetTime) {
      apiLimitStore.delete(key);
    }
  }
  
  logger.debug('Rate limit store cleaned up', {
    trialEntries: trialLimitStore.size,
    apiEntries: apiLimitStore.size
  });
}

// Clean up every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
