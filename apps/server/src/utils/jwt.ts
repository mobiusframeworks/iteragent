import jwt from 'jsonwebtoken';
import { config, loadJWTKeys } from '../config';
import { logger } from './logger';

export interface TokenClaims {
  sub: string;         // user ID
  email: string;       // user email
  plan: 'free' | 'pro'; // subscription plan
  entitlements: string[]; // feature entitlements
  iat: number;         // issued at
  exp: number;         // expires at
  jti: string;         // JWT ID (for revocation)
  iss: string;         // issuer
  aud: string;         // audience
}

export interface TrialTokenClaims extends TokenClaims {
  trial: true;
  trialStarted: number;
}

const keys = loadJWTKeys();

/**
 * Generate a trial token (7-day expiry)
 */
export function generateTrialToken(email: string, userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + (config.trial.durationDays * 24 * 60 * 60); // 7 days

  const claims: TrialTokenClaims = {
    sub: userId,
    email,
    plan: 'pro',
    entitlements: [
      'ai-chat-orchestrator',
      'advanced-analysis', 
      'element-extraction',
      'performance-monitoring',
      'multi-agent-coordination',
      'real-time-ide-sync'
    ],
    trial: true,
    trialStarted: now,
    iat: now,
    exp: expiry,
    jti: generateJTI(),
    iss: config.jwt.issuer,
    aud: config.jwt.audience,
  };

  const token = jwt.sign(claims, keys.privateKey, {
    algorithm: config.jwt.algorithm,
    keyid: 'default' // For key rotation support
  });

  logger.info('Trial token generated', { email, userId, expiresAt: new Date(expiry * 1000) });
  return token;
}

/**
 * Generate a subscription token (long-lived or no expiry)
 */
export function generateSubscriptionToken(
  email: string, 
  userId: string, 
  customerId: string,
  subscriptionId: string,
  expiresAt?: Date
): string {
  const now = Math.floor(Date.now() / 1000);
  const expiry = expiresAt ? Math.floor(expiresAt.getTime() / 1000) : undefined;

  const claims: TokenClaims = {
    sub: userId,
    email,
    plan: 'pro',
    entitlements: [
      'ai-chat-orchestrator',
      'advanced-analysis',
      'element-extraction', 
      'performance-monitoring',
      'multi-agent-coordination',
      'real-time-ide-sync',
      'priority-support',
      'custom-integrations'
    ],
    iat: now,
    exp: expiry || (now + (365 * 24 * 60 * 60)), // 1 year if no expiry specified
    jti: generateJTI(),
    iss: config.jwt.issuer,
    aud: config.jwt.audience,
  };

  const signOptions: jwt.SignOptions = {
    algorithm: config.jwt.algorithm,
    keyid: 'default'
  };

  if (!expiry) {
    // For active subscriptions, use a long expiry but rely on online verification
    signOptions.expiresIn = '1y';
  }

  const token = jwt.sign(claims, keys.privateKey, signOptions);

  logger.info('Subscription token generated', { 
    email, 
    userId, 
    customerId, 
    subscriptionId,
    expiresAt: expiry ? new Date(expiry * 1000) : 'long-lived'
  });

  return token;
}

/**
 * Verify a token and return claims
 */
export function verifyToken(token: string): TokenClaims | null {
  try {
    const decoded = jwt.verify(token, keys.publicKey, {
      algorithms: [config.jwt.algorithm],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as TokenClaims;

    // Additional validation
    if (!decoded.sub || !decoded.email || !decoded.plan) {
      logger.warn('Token missing required claims', { decoded });
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.info('Token expired', { error: error.message });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', { error: error.message });
    } else {
      logger.error('Token verification error', { error });
    }
    return null;
  }
}

/**
 * Generate a unique JWT ID for revocation tracking
 */
function generateJTI(): string {
  return `jti_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Extract public key for client-side verification
 */
export function getPublicKey(): string {
  return keys.publicKey;
}

/**
 * Check if token has specific entitlement
 */
export function hasEntitlement(claims: TokenClaims, entitlement: string): boolean {
  return claims.entitlements.includes(entitlement);
}

/**
 * Check if token is a trial token
 */
export function isTrialToken(claims: TokenClaims): claims is TrialTokenClaims {
  return 'trial' in claims && claims.trial === true;
}

/**
 * Get token expiry info
 */
export function getTokenExpiry(claims: TokenClaims) {
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = claims.exp - now;
  const expiresAt = new Date(claims.exp * 1000);
  
  return {
    expiresAt,
    timeLeftSeconds: timeLeft,
    isExpired: timeLeft <= 0,
    isExpiringSoon: timeLeft <= (24 * 60 * 60), // 24 hours
  };
}
