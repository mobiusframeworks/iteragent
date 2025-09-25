import jwt from 'jsonwebtoken';

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

/**
 * Decode token without verification (for display purposes)
 */
export function decodeToken(token: string): TokenClaims | null {
  try {
    const decoded = jwt.decode(token) as TokenClaims;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify token with public key (offline verification)
 */
export function verifyTokenOffline(token: string, publicKey: string): TokenClaims | null {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256']
    }) as TokenClaims;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(claims: TokenClaims): boolean {
  const now = Math.floor(Date.now() / 1000);
  return claims.exp <= now;
}

/**
 * Get token expiry information
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
    daysLeft: Math.floor(timeLeft / (24 * 60 * 60)),
    hoursLeft: Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60)),
    minutesLeft: Math.floor((timeLeft % (60 * 60)) / 60)
  };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(claims: TokenClaims): string {
  const expiry = getTokenExpiry(claims);
  
  if (expiry.isExpired) {
    return 'Expired';
  }
  
  if (expiry.daysLeft > 0) {
    return `${expiry.daysLeft} days, ${expiry.hoursLeft} hours`;
  }
  
  if (expiry.hoursLeft > 0) {
    return `${expiry.hoursLeft} hours, ${expiry.minutesLeft} minutes`;
  }
  
  return `${expiry.minutesLeft} minutes`;
}

/**
 * Check if token is a trial token
 */
export function isTrialToken(claims: TokenClaims): boolean {
  return claims.trial === true;
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: string): string {
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'free':
      return 'Free';
    default:
      return plan;
  }
}
