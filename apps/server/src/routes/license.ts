import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { 
  generateTrialToken, 
  generateSubscriptionToken, 
  verifyToken, 
  getTokenExpiry,
  getPublicKey 
} from '../utils/jwt';
import { createCheckoutSession, findCustomerByEmail } from '../utils/stripe';
import { trialRateLimit, apiRateLimit } from '../utils/rate-limiter';
import { logger, securityLogger } from '../utils/logger';
import { config } from '../config';

const router = Router();

// Apply API rate limiting to all routes
router.use(apiRateLimit);

/**
 * POST /v1/license/activate
 * Creates Stripe Checkout Session for billing subscription with 7-day trial
 */
router.post('/activate',
  body('email').isEmail().normalizeEmail(),
  body('product').equals('intertools'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, product } = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      // Generate user ID (in production, this would come from your user system)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Create checkout session
      const successUrl = `${req.protocol}://${req.get('host')}/v1/license/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${req.protocol}://${req.get('host')}/v1/license/cancel`;

      const session = await createCheckoutSession(
        email,
        successUrl,
        cancelUrl,
        { userId, ip }
      );

      logger.info('License activation initiated', { 
        email, 
        userId, 
        sessionId: session.id,
        ip
      });

      res.json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        message: 'Visit the checkout URL to complete subscription with 7-day free trial'
      });

    } catch (error) {
      logger.error('License activation failed', { error, body: req.body });
      res.status(500).json({
        error: 'Activation failed',
        message: 'Unable to create checkout session. Please try again.'
      });
    }
  }
);

/**
 * POST /v1/license/redeem-trial  
 * Alternative flow to get a 7-day trial token without billing info
 */
router.post('/redeem-trial',
  trialRateLimit, // Apply trial-specific rate limiting
  body('email').isEmail().normalizeEmail(),
  body('product').equals('intertools'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed', 
          details: errors.array()
        });
      }

      const { email, product } = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      // Generate user ID
      const userId = `trial_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Generate trial token
      const token = generateTrialToken(email, userId);
      const expiresAt = new Date(Date.now() + (config.trial.durationDays * 24 * 60 * 60 * 1000));

      securityLogger.tokenGenerated(email, 'trial', expiresAt);

      logger.info('Trial token issued', { email, userId, expiresAt, ip });

      res.json({
        success: true,
        token,
        tokenType: 'trial',
        expiresAt: expiresAt.toISOString(),
        durationDays: config.trial.durationDays,
        message: `Trial token valid for ${config.trial.durationDays} days. Save this token securely.`,
        instructions: {
          cli: 'Set INTERTOOLS_LICENSE environment variable or save to ~/.config/intertools/config.json',
          upgrade: 'Use "npx intertools activate" to upgrade to paid subscription'
        }
      });

    } catch (error) {
      logger.error('Trial redemption failed', { error, body: req.body });
      res.status(500).json({
        error: 'Trial redemption failed',
        message: 'Unable to generate trial token. Please try again.'
      });
    }
  }
);

/**
 * POST /v1/license/verify
 * Verifies token signature and returns validity info
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    let token: string;

    // Get token from body or Authorization header
    if (req.body.token) {
      token = req.body.token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    } else {
      return res.status(400).json({
        error: 'Token required',
        message: 'Provide token in request body or Authorization header'
      });
    }

    const claims = verifyToken(token);
    
    if (!claims) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid or expired token',
        message: 'Token verification failed. Please activate or renew your license.'
      });
    }

    const expiry = getTokenExpiry(claims);
    
    securityLogger.tokenVerified(claims.email, true);

    res.json({
      valid: true,
      plan: claims.plan,
      entitlements: claims.entitlements,
      email: claims.email,
      expiresAt: expiry.expiresAt.toISOString(),
      isExpired: expiry.isExpired,
      isExpiringSoon: expiry.isExpiringSoon,
      timeLeftSeconds: expiry.timeLeftSeconds,
      trial: 'trial' in claims ? claims.trial : false
    });

  } catch (error) {
    logger.error('Token verification error', { error });
    res.status(500).json({
      valid: false,
      error: 'Verification failed',
      message: 'Unable to verify token. Please try again.'
    });
  }
});

/**
 * GET /v1/license/verify (query parameter version for extensions)
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.query.offlineToken as string;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Provide offlineToken query parameter'
      });
    }

    const claims = verifyToken(token);
    
    if (!claims) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid or expired token'
      });
    }

    const expiry = getTokenExpiry(claims);

    res.json({
      valid: true,
      plan: claims.plan,
      entitlements: claims.entitlements,
      expiresAt: expiry.expiresAt.toISOString(),
      isExpired: expiry.isExpired,
      trial: 'trial' in claims ? claims.trial : false
    });

  } catch (error) {
    logger.error('Token verification error', { error });
    res.status(500).json({
      valid: false,
      error: 'Verification failed'
    });
  }
});

/**
 * GET /v1/license/public-key
 * Returns public key for offline token verification
 */
router.get('/public-key', (req: Request, res: Response) => {
  try {
    const publicKey = getPublicKey();
    
    res.json({
      publicKey,
      algorithm: 'RS256',
      usage: 'JWT signature verification',
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });

  } catch (error) {
    logger.error('Public key retrieval error', { error });
    res.status(500).json({
      error: 'Unable to retrieve public key'
    });
  }
});

/**
 * GET /v1/license/success
 * Checkout success page (redirect from Stripe)
 */
router.get('/success', async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string;
  
  if (!sessionId) {
    return res.status(400).send('Missing session ID');
  }

  // In a real app, you'd verify the session and show a success page
  // For now, just show a simple success message
  res.send(`
    <html>
      <head><title>InterTools Pro - Subscription Successful</title></head>
      <body>
        <h1>🎉 Welcome to InterTools Pro!</h1>
        <p>Your subscription has been activated successfully.</p>
        <p>Session ID: ${sessionId}</p>
        <p>You will receive your license token via webhook processing.</p>
        <p>You can close this window and return to your CLI.</p>
      </body>
    </html>
  `);
});

/**
 * GET /v1/license/cancel
 * Checkout cancel page
 */
router.get('/cancel', (req: Request, res: Response) => {
  res.send(`
    <html>
      <head><title>InterTools Pro - Subscription Cancelled</title></head>
      <body>
        <h1>Subscription Cancelled</h1>
        <p>You can try the free trial instead:</p>
        <p><code>npx intertools activate --trial</code></p>
        <p>You can close this window and return to your CLI.</p>
      </body>
    </html>
  `);
});

export default router;
