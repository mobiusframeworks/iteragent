import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { verifyToken } from '../utils/jwt';
import { apiRateLimit } from '../utils/rate-limiter';
import { logger } from '../utils/logger';

const router = Router();

// Apply API rate limiting
router.use(apiRateLimit);

// Usage tracking store (use database in production)
interface UsageRecord {
  userId: string;
  email: string;
  runId: string;
  feature: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const usageRecords: UsageRecord[] = [];

/**
 * POST /v1/usage/record
 * Record feature usage for metering and analytics
 */
router.post('/record',
  body('token').notEmpty().withMessage('Token is required'),
  body('runId').notEmpty().withMessage('Run ID is required'),  
  body('feature').notEmpty().withMessage('Feature is required'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { token, runId, feature, metadata } = req.body;

      // Verify token
      const claims = verifyToken(token);
      if (!claims) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Token verification failed'
        });
      }

      // Check if user has access to the feature
      if (!claims.entitlements.includes(feature)) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `Feature '${feature}' is not included in your plan`,
          plan: claims.plan,
          availableFeatures: claims.entitlements
        });
      }

      // Record usage
      const usageRecord: UsageRecord = {
        userId: claims.sub,
        email: claims.email,
        runId,
        feature,
        timestamp: new Date(),
        metadata
      };

      usageRecords.push(usageRecord);

      // Keep only last 10000 records in memory (use proper database in production)
      if (usageRecords.length > 10000) {
        usageRecords.splice(0, usageRecords.length - 10000);
      }

      logger.info('Usage recorded', {
        userId: claims.sub,
        email: claims.email,
        feature,
        runId,
        plan: claims.plan
      });

      res.json({
        success: true,
        recorded: {
          feature,
          runId,
          timestamp: usageRecord.timestamp.toISOString()
        },
        message: 'Usage recorded successfully'
      });

    } catch (error) {
      logger.error('Usage recording failed', { error, body: req.body });
      res.status(500).json({
        error: 'Usage recording failed',
        message: 'Unable to record usage. Please try again.'
      });
    }
  }
);

/**
 * GET /v1/usage/stats/:userId
 * Get usage statistics for a user
 */
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = '30' } = req.query;

    const daysNum = parseInt(days as string, 10);
    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    // Filter records for user and time period
    const userRecords = usageRecords.filter(record => 
      record.userId === userId && record.timestamp >= since
    );

    // Aggregate by feature
    const featureStats = userRecords.reduce((acc, record) => {
      acc[record.feature] = (acc[record.feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Aggregate by date
    const dailyStats = userRecords.reduce((acc, record) => {
      const date = record.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      userId,
      period: {
        days: daysNum,
        since: since.toISOString(),
        until: new Date().toISOString()
      },
      totalUsage: userRecords.length,
      featureBreakdown: featureStats,
      dailyBreakdown: dailyStats,
      lastActivity: userRecords.length > 0 ? 
        Math.max(...userRecords.map(r => r.timestamp.getTime())) : null
    });

  } catch (error) {
    logger.error('Usage stats retrieval failed', { error, userId: req.params.userId });
    res.status(500).json({
      error: 'Stats retrieval failed',
      message: 'Unable to retrieve usage statistics'
    });
  }
});

/**
 * GET /v1/usage/features
 * Get list of available features and their requirements
 */
router.get('/features', (req: Request, res: Response) => {
  const features = {
    'ai-chat-orchestrator': {
      name: 'AI Chat Orchestrator',
      description: 'Advanced multi-agent system with GPT integration',
      plan: 'pro',
      category: 'ai'
    },
    'advanced-analysis': {
      name: 'Advanced Analysis',
      description: 'Deep code analysis and intelligent insights',
      plan: 'pro',
      category: 'analysis'
    },
    'element-extraction': {
      name: 'Element Extraction',
      description: 'Extract and analyze HTML page components',
      plan: 'pro',
      category: 'extraction'
    },
    'performance-monitoring': {
      name: 'Performance Monitoring',
      description: 'Advanced metrics, memory usage, and optimization insights',
      plan: 'pro',
      category: 'monitoring'
    },
    'multi-agent-coordination': {
      name: 'Multi-Agent Coordination',
      description: 'Coordinated workflow enhancement with specialized agents',
      plan: 'pro',
      category: 'coordination'
    },
    'real-time-ide-sync': {
      name: 'Real-time IDE Sync',
      description: 'Auto-push insights to Cursor, VS Code, and other IDEs',
      plan: 'pro',
      category: 'integration'
    },
    'priority-support': {
      name: 'Priority Support',
      description: 'Priority customer support and updates',
      plan: 'pro',
      category: 'support'
    },
    'custom-integrations': {
      name: 'Custom Integrations',
      description: 'Custom API integrations and enterprise features',
      plan: 'pro',
      category: 'enterprise'
    }
  };

  res.json({
    features,
    plans: {
      free: {
        features: [],
        description: 'Basic console log capture and Cursor integration'
      },
      pro: {
        features: Object.keys(features),
        description: 'All advanced features included',
        price: '$30/month',
        trial: '7 days free'
      }
    }
  });
});

export default router;
