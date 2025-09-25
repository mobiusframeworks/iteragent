import request from 'supertest';
import app from '../src/index';
import { generateTrialToken } from '../src/utils/jwt';

// Mock external dependencies
jest.mock('../src/utils/stripe');
jest.mock('../src/config', () => ({
  config: {
    nodeEnv: 'test',
    port: 3000,
    host: 'localhost',
    stripe: {
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
      webhookSecret: 'whsec_test_123',
      priceId: 'price_test_123'
    },
    jwt: {
      privateKeyPath: './keys/private.pem',
      publicKeyPath: './keys/public.pem',
      issuer: 'intertools-pro',
      audience: 'intertools-users',
      algorithm: 'RS256'
    },
    rateLimiting: {
      trialPerEmail: 3,
      trialWindowHours: 24,
      apiPerMinute: 100
    },
    corsOrigins: ['http://localhost:3000'],
    logging: { level: 'error', file: './logs/test.log' },
    trial: { durationDays: 7, gracePeriodDays: 5 }
  },
  validateConfig: jest.fn(),
  loadJWTKeys: () => ({
    privateKey: 'test-private-key',
    publicKey: 'test-public-key'
  })
}));

describe('License API', () => {
  describe('POST /v1/license/activate', () => {
    it('should create checkout session for valid request', async () => {
      const mockCreateCheckoutSession = jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      });
      
      require('../src/utils/stripe').createCheckoutSession = mockCreateCheckoutSession;

      const response = await request(app)
        .post('/v1/license/activate')
        .send({
          email: 'test@example.com',
          product: 'intertools'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.checkoutUrl).toBeDefined();
      expect(response.body.sessionId).toBe('cs_test_123');
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('/v1/license/success'),
        expect.stringContaining('/v1/license/cancel'),
        expect.any(Object)
      );
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/v1/license/activate')
        .send({
          email: 'invalid-email',
          product: 'intertools'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate product field', async () => {
      const response = await request(app)
        .post('/v1/license/activate')
        .send({
          email: 'test@example.com',
          product: 'invalid-product'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle Stripe errors', async () => {
      const mockCreateCheckoutSession = jest.fn().mockRejectedValue(
        new Error('Stripe error')
      );
      
      require('../src/utils/stripe').createCheckoutSession = mockCreateCheckoutSession;

      const response = await request(app)
        .post('/v1/license/activate')
        .send({
          email: 'test@example.com',
          product: 'intertools'
        })
        .expect(500);

      expect(response.body.error).toBe('Activation failed');
    });
  });

  describe('POST /v1/license/redeem-trial', () => {
    it('should generate trial token for valid request', async () => {
      const response = await request(app)
        .post('/v1/license/redeem-trial')
        .send({
          email: 'test@example.com',
          product: 'intertools'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.tokenType).toBe('trial');
      expect(response.body.durationDays).toBe(7);
      expect(response.body.expiresAt).toBeDefined();
    });

    it('should enforce rate limiting', async () => {
      // Make multiple requests quickly
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post('/v1/license/redeem-trial')
          .send({
            email: 'ratelimit@example.com',
            product: 'intertools'
          })
      );

      const responses = await Promise.all(requests);
      
      // First 3 should succeed, rest should be rate limited
      const successful = responses.filter(r => r.status === 200);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(successful.length).toBe(3);
      expect(rateLimited.length).toBe(2);
      expect(rateLimited[0].body.error).toBe('Too many trial requests');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/v1/license/redeem-trial')
        .send({
          email: 'invalid-email',
          product: 'intertools'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /v1/license/verify', () => {
    it('should verify valid token', async () => {
      const token = generateTrialToken('test@example.com', 'user_123');

      const response = await request(app)
        .post('/v1/license/verify')
        .send({ token })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.plan).toBe('pro');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.entitlements).toContain('ai-chat-orchestrator');
    });

    it('should verify token from Authorization header', async () => {
      const token = generateTrialToken('test@example.com', 'user_123');

      const response = await request(app)
        .post('/v1/license/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/v1/license/verify')
        .send({ token: 'invalid.token.here' })
        .expect(401);

      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should require token', async () => {
      const response = await request(app)
        .post('/v1/license/verify')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Token required');
    });
  });

  describe('GET /v1/license/verify', () => {
    it('should verify token from query parameter', async () => {
      const token = generateTrialToken('test@example.com', 'user_123');

      const response = await request(app)
        .get('/v1/license/verify')
        .query({ offlineToken: token })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.plan).toBe('pro');
    });

    it('should require offlineToken parameter', async () => {
      const response = await request(app)
        .get('/v1/license/verify')
        .expect(400);

      expect(response.body.error).toBe('Token required');
    });
  });

  describe('GET /v1/license/public-key', () => {
    it('should return public key', async () => {
      const response = await request(app)
        .get('/v1/license/public-key')
        .expect(200);

      expect(response.body.publicKey).toBeDefined();
      expect(response.body.algorithm).toBe('RS256');
      expect(response.body.issuer).toBe('intertools-pro');
      expect(response.body.audience).toBe('intertools-users');
    });
  });

  describe('GET /v1/license/success', () => {
    it('should show success page', async () => {
      const response = await request(app)
        .get('/v1/license/success')
        .query({ session_id: 'cs_test_123' })
        .expect(200);

      expect(response.text).toContain('Subscription Successful');
      expect(response.text).toContain('cs_test_123');
    });

    it('should require session ID', async () => {
      const response = await request(app)
        .get('/v1/license/success')
        .expect(400);

      expect(response.text).toContain('Missing session ID');
    });
  });

  describe('GET /v1/license/cancel', () => {
    it('should show cancel page', async () => {
      const response = await request(app)
        .get('/v1/license/cancel')
        .expect(200);

      expect(response.text).toContain('Subscription Cancelled');
    });
  });
});
