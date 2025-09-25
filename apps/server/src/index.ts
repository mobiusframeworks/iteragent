import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';

// Import routes
import licenseRoutes from './routes/license';
import webhookRoutes from './routes/webhook';
import usageRoutes from './routes/usage';
import bridgeRoutes from './routes/bridge';

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow for checkout redirects
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
}));

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Body parsing middleware
// Note: Stripe webhooks need raw body, so we handle that specially
app.use('/v1/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv
  });
});

// API routes
app.use('/v1/license', licenseRoutes);
app.use('/v1/webhook', webhookRoutes);
app.use('/v1/usage', usageRoutes);
app.use('/v1/bridge', bridgeRoutes);

// API documentation endpoint
app.get('/v1', (req, res) => {
  res.json({
    name: 'InterTools Pro License Server',
    version: '1.0.0',
    description: 'License management and subscription service for InterTools Pro',
    endpoints: {
      license: {
        activate: 'POST /v1/license/activate',
        redeemTrial: 'POST /v1/license/redeem-trial',
        verify: 'POST /v1/license/verify',
        verifyOffline: 'GET /v1/license/verify?offlineToken=...',
        publicKey: 'GET /v1/license/public-key'
      },
      webhook: {
        stripe: 'POST /v1/webhook/stripe'
      },
      usage: {
        record: 'POST /v1/usage/record',
        stats: 'GET /v1/usage/stats/:userId',
        features: 'GET /v1/usage/features'
      },
      bridge: {
        start: 'POST /v1/bridge/start',
        logs: 'POST /v1/bridge/:sessionId/logs',
        status: 'GET /v1/bridge/:sessionId/status',
        close: 'DELETE /v1/bridge/:sessionId/close'
      }
    },
    documentation: 'https://github.com/luvs2spluj/iteragent/blob/main/apps/server/README.md'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: '/v1'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// Start server
const server = app.listen(config.port, config.host, () => {
  logger.info('InterTools Pro License Server started', {
    host: config.host,
    port: config.port,
    environment: config.nodeEnv,
    cors: config.corsOrigins
  });

  console.log('🚀 InterTools Pro License Server');
  console.log(`   ➜ Local:   http://${config.host}:${config.port}`);
  console.log(`   ➜ Health:  http://${config.host}:${config.port}/health`);
  console.log(`   ➜ API:     http://${config.host}:${config.port}/v1`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('   • POST /v1/license/activate - Create Stripe checkout');
  console.log('   • POST /v1/license/redeem-trial - Get trial token');
  console.log('   • POST /v1/license/verify - Verify token');
  console.log('   • POST /v1/webhook/stripe - Stripe webhooks');
  console.log('   • POST /v1/usage/record - Record feature usage');
  console.log('   • POST /v1/bridge/start - Start bridge session');
  console.log('');
  console.log('🔧 Setup instructions:');
  console.log('   1. Configure Stripe keys in .env');
  console.log('   2. Run: npm run generate-keys');
  console.log('   3. Setup webhook: stripe listen --forward-to localhost:3000/v1/webhook/stripe');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
