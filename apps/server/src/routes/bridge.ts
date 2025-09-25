import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { verifyToken, hasEntitlement } from '../utils/jwt';
import { apiRateLimit } from '../utils/rate-limiter';
import { logger } from '../utils/logger';

const router = Router();

// Apply API rate limiting
router.use(apiRateLimit);

// Active bridge sessions (use Redis in production)
interface BridgeSession {
  sessionId: string;
  userId: string;
  email: string;
  plan: string;
  entitlements: string[];
  createdAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

const bridgeSessions = new Map<string, BridgeSession>();

/**
 * POST /v1/bridge/start
 * Start a bridge session for extension/Cursor integration
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization required',
        message: 'Provide valid Bearer token in Authorization header'
      });
    }

    const token = authHeader.substring(7);
    const claims = verifyToken(token);

    if (!claims) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed. Please activate your license.'
      });
    }

    // Check if user has bridge access
    if (!hasEntitlement(claims, 'real-time-ide-sync')) {
      return res.status(403).json({
        error: 'Feature not available',
        message: 'Bridge functionality requires Pro plan',
        plan: claims.plan,
        upgradeUrl: '/v1/license/activate'
      });
    }

    // Generate session ID
    const sessionId = `bridge_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Create bridge session
    const session: BridgeSession = {
      sessionId,
      userId: claims.sub,
      email: claims.email,
      plan: claims.plan,
      entitlements: claims.entitlements,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: req.body.metadata
    };

    bridgeSessions.set(sessionId, session);

    logger.info('Bridge session started', {
      sessionId,
      userId: claims.sub,
      email: claims.email,
      plan: claims.plan
    });

    res.json({
      success: true,
      sessionId,
      message: 'Bridge session started successfully',
      session: {
        sessionId,
        plan: claims.plan,
        entitlements: claims.entitlements,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString() // 24 hours
      },
      endpoints: {
        logs: `/v1/bridge/${sessionId}/logs`,
        status: `/v1/bridge/${sessionId}/status`,
        close: `/v1/bridge/${sessionId}/close`
      }
    });

  } catch (error) {
    logger.error('Bridge session start failed', { error });
    res.status(500).json({
      error: 'Bridge session failed',
      message: 'Unable to start bridge session. Please try again.'
    });
  }
});

/**
 * POST /v1/bridge/:sessionId/logs
 * Stream logs through bridge session
 */
router.post('/:sessionId/logs',
  body('logs').isArray().withMessage('Logs must be an array'),
  body('runId').notEmpty().withMessage('Run ID is required'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { sessionId } = req.params;
      const { logs, runId, metadata } = req.body;

      // Verify session exists and is valid
      const session = bridgeSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Bridge session expired or invalid'
        });
      }

      // Update last activity
      session.lastActivity = new Date();
      bridgeSessions.set(sessionId, session);

      // Process logs (in production, you might send these to a queue or stream)
      const processedLogs = logs.map((log: any, index: number) => ({
        id: `${runId}_${index}`,
        timestamp: new Date().toISOString(),
        sessionId,
        userId: session.userId,
        ...log
      }));

      logger.info('Bridge logs received', {
        sessionId,
        userId: session.userId,
        runId,
        logCount: logs.length
      });

      res.json({
        success: true,
        processed: processedLogs.length,
        runId,
        sessionId,
        message: 'Logs processed successfully'
      });

    } catch (error) {
      logger.error('Bridge log processing failed', { error, sessionId: req.params.sessionId });
      res.status(500).json({
        error: 'Log processing failed',
        message: 'Unable to process logs through bridge'
      });
    }
  }
);

/**
 * GET /v1/bridge/:sessionId/status
 * Get bridge session status
 */
router.get('/:sessionId/status', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  const session = bridgeSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      error: 'Session not found',
      active: false
    });
  }

  // Check if session is still valid (24 hour expiry)
  const age = Date.now() - session.createdAt.getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  if (age > maxAge) {
    bridgeSessions.delete(sessionId);
    return res.status(410).json({
      error: 'Session expired',
      active: false
    });
  }

  res.json({
    active: true,
    sessionId,
    userId: session.userId,
    plan: session.plan,
    entitlements: session.entitlements,
    createdAt: session.createdAt.toISOString(),
    lastActivity: session.lastActivity.toISOString(),
    ageMinutes: Math.floor(age / (60 * 1000))
  });
});

/**
 * DELETE /v1/bridge/:sessionId/close
 * Close bridge session
 */
router.delete('/:sessionId/close', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  const session = bridgeSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      error: 'Session not found'
    });
  }

  bridgeSessions.delete(sessionId);

  logger.info('Bridge session closed', {
    sessionId,
    userId: session.userId
  });

  res.json({
    success: true,
    message: 'Bridge session closed successfully'
  });
});

/**
 * GET /v1/bridge/sessions
 * List active bridge sessions (admin only)
 */
router.get('/sessions', (req: Request, res: Response) => {
  // TODO: Add admin authentication

  const activeSessions = Array.from(bridgeSessions.values()).map(session => ({
    sessionId: session.sessionId,
    userId: session.userId,
    email: session.email,
    plan: session.plan,
    createdAt: session.createdAt.toISOString(),
    lastActivity: session.lastActivity.toISOString(),
    ageMinutes: Math.floor((Date.now() - session.createdAt.getTime()) / (60 * 1000))
  }));

  res.json({
    total: activeSessions.length,
    sessions: activeSessions
  });
});

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [sessionId, session] of bridgeSessions.entries()) {
    const age = now - session.createdAt.getTime();
    if (age > maxAge) {
      bridgeSessions.delete(sessionId);
      logger.info('Bridge session expired and cleaned up', { sessionId, userId: session.userId });
    }
  }
}, 5 * 60 * 1000);

export default router;
