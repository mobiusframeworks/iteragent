import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

export interface TokenClaims {
  sub: string;
  email: string;
  plan: 'free' | 'pro';
  entitlements: string[];
  iat: number;
  exp: number;
  jti: string;
  iss: string;
  aud: string;
  trial?: boolean;
}

// Built-in public key for offline verification
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z8QX8tBmBP7QJKvZ8lR
3YF9vV7X0mZ5Q3jR8vZ3qF2X9Q7K8mF5vZ3Q2X8tBmBP7QJKvZ8lR3YF9vV7X0m
Z5Q3jR8vZ3qF2X9Q7K8mF5vZ3Q2X8tBmBP7QJKvZ8lR3YF9vV7X0mZ5Q3jR8vZ3
qF2X9Q7K8mF5vZ3Q2X8tBmBP7QJKvZ8lR3YF9vV7X0mZ5Q3jR8vZ3qF2X9Q7K8m
F5vZ3Q2X8tBmBP7QJKvZ8lR3YF9vV7X0mZ5Q3jR8vZ3qF2X9Q7K8mF5vZ3Q2X8t
BmBP7QJKvZ8lR3YF9vV7X0mZ5Q3jR8vZ3qF2X9Q7K8mF5vZ3Q2X8tBmBP7QJKv
Z8lR3YF9vV7X0mZ5Q3jR8vZ3qF2X9Q7K8mF5vZ3QIDAQAB
-----END PUBLIC KEY-----`;

// Configuration
const CONFIG = {
  serverUrl: process.env.INTERTOOLS_SERVER_URL || 'http://localhost:3000',
  configPath: path.join(os.homedir(), '.config', 'intertools', 'config.json'),
  cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
  audience: 'intertools-users',
  issuer: 'intertools-pro'
};

// Cache for online verification
let verificationCache: {
  token?: string;
  verified?: boolean;
  timestamp?: number;
  error?: string;
} = {};

/**
 * Get token from environment or config file
 */
function getToken(): string | null {
  // First check environment variable
  const envToken = process.env.INTERTOOLS_LICENSE;
  if (envToken) {
    return envToken;
  }

  // Then check config file
  try {
    if (fs.existsSync(CONFIG.configPath)) {
      const config = JSON.parse(fs.readFileSync(CONFIG.configPath, 'utf8'));
      return config.token || null;
    }
  } catch (error) {
    // Ignore config file errors
  }

  return null;
}

/**
 * Verify token offline using built-in public key
 */
function verifyTokenOffline(token: string): TokenClaims | null {
  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
      audience: CONFIG.audience,
      issuer: CONFIG.issuer
    }) as TokenClaims;

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify token online (with caching)
 */
async function verifyTokenOnline(token: string): Promise<{ valid: boolean; error?: string }> {
  // Check cache first
  const now = Date.now();
  if (verificationCache.token === token && 
      verificationCache.timestamp && 
      (now - verificationCache.timestamp) < CONFIG.cacheTimeout) {
    return {
      valid: verificationCache.verified || false,
      error: verificationCache.error
    };
  }

  try {
    const response = await fetch(`${CONFIG.serverUrl}/v1/license/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token }),
      timeout: 5000
    });

    const data = await response.json();
    
    // Update cache
    verificationCache = {
      token,
      verified: data.valid,
      timestamp: now,
      error: data.error
    };

    return {
      valid: data.valid,
      error: data.error
    };

  } catch (error) {
    // Online verification failed, but don't cache the failure
    return {
      valid: false,
      error: 'Online verification unavailable'
    };
  }
}

/**
 * Check if token has expired
 */
function isTokenExpired(claims: TokenClaims): boolean {
  const now = Math.floor(Date.now() / 1000);
  return claims.exp <= now;
}

/**
 * Check if user has specific entitlement
 */
function hasEntitlement(claims: TokenClaims, entitlement: string): boolean {
  return claims.entitlements.includes(entitlement);
}

/**
 * Get activation instructions
 */
function getActivationInstructions(): string {
  return `
🔐 InterTools Pro License Required

To use this Pro feature, you need an active license:

📋 Activation Options:
  • Quick Trial: npx intertools activate --trial
  • Subscribe:   npx intertools activate

⚙️  Environment Setup:
  • Set token:   export INTERTOOLS_LICENSE="your_token_here"
  • Config file: ~/.config/intertools/config.json

🔗 More info: https://github.com/luvs2spluj/iteragent/blob/main/ACTIVATION.md
`;
}

/**
 * Main function to check Pro feature access
 */
export async function requirePro(feature: string): Promise<TokenClaims> {
  const token = getToken();

  if (!token) {
    throw new Error(getActivationInstructions());
  }

  // Verify token offline first
  const claims = verifyTokenOffline(token);
  
  if (!claims) {
    throw new Error(`
❌ Invalid License Token

Your InterTools Pro license token is invalid or corrupted.

💡 Solutions:
  • Get a new license: npx intertools activate
  • Check token format: npx intertools status
  • Clear and reactivate: npx intertools clear && npx intertools activate

${getActivationInstructions()}
`);
  }

  // Check if token is expired
  if (isTokenExpired(claims)) {
    const expiredDate = new Date(claims.exp * 1000).toLocaleString();
    throw new Error(`
⏰ License Expired

Your InterTools Pro license expired on ${expiredDate}.

💡 To renew:
  • Reactivate: npx intertools activate
  • Check status: npx intertools status

${getActivationInstructions()}
`);
  }

  // Check if user has the required entitlement
  if (!hasEntitlement(claims, feature)) {
    throw new Error(`
🔒 Feature Not Available

The feature '${feature}' is not included in your current plan.

📋 Your Plan: ${claims.plan}
🛠️  Available Features: ${claims.entitlements.join(', ')}

💡 To upgrade:
  • Subscribe to Pro: npx intertools activate

${getActivationInstructions()}
`);
  }

  // Perform online verification on first use of the day
  try {
    const onlineVerification = await verifyTokenOnline(token);
    if (!onlineVerification.valid && onlineVerification.error !== 'Online verification unavailable') {
      console.warn(`⚠️  License verification warning: ${onlineVerification.error}`);
      console.warn('   Continuing with offline verification...');
    }
  } catch (error) {
    // Online verification failed, but we continue with offline verification
    // This ensures the system works offline during trial period
  }

  return claims;
}

/**
 * Check if Pro features are available (non-throwing version)
 */
export async function hasProAccess(feature?: string): Promise<boolean> {
  try {
    const claims = await requirePro(feature || 'ai-chat-orchestrator');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current license status
 */
export async function getLicenseStatus(): Promise<{
  hasLicense: boolean;
  plan?: string;
  email?: string;
  expiresAt?: Date;
  isExpired?: boolean;
  isTrial?: boolean;
  entitlements?: string[];
}> {
  const token = getToken();
  
  if (!token) {
    return { hasLicense: false };
  }

  const claims = verifyTokenOffline(token);
  
  if (!claims) {
    return { hasLicense: false };
  }

  return {
    hasLicense: true,
    plan: claims.plan,
    email: claims.email,
    expiresAt: new Date(claims.exp * 1000),
    isExpired: isTokenExpired(claims),
    isTrial: claims.trial === true,
    entitlements: claims.entitlements
  };
}

/**
 * Wrapper for Pro-only functions
 */
export function proOnly<T extends (...args: any[]) => any>(
  feature: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    await requirePro(feature);
    return fn(...args);
  }) as T;
}

// Export types and utilities
export { getActivationInstructions, hasEntitlement, isTokenExpired };
