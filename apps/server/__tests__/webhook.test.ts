import request from 'supertest';
import Stripe from 'stripe';
import app from '../src/index';

// Mock Stripe
jest.mock('stripe');
jest.mock('../src/utils/stripe');
jest.mock('../src/config', () => ({
  config: {
    nodeEnv: 'test',
    stripe: {
      webhookSecret: 'whsec_test_123'
    }
  },
  validateConfig: jest.fn(),
  loadJWTKeys: () => ({
    privateKey: 'test-private-key',
    publicKey: 'test-public-key'
  })
}));

describe('Webhook API', () => {
  const mockVerifyWebhookSignature = jest.fn();
  const mockFindCustomerByEmail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    require('../src/utils/stripe').verifyWebhookSignature = mockVerifyWebhookSignature;
    require('../src/utils/stripe').findCustomerByEmail = mockFindCustomerByEmail;
  });

  describe('POST /v1/webhook/stripe', () => {
    it('should process checkout.session.completed event', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            customer_email: 'test@example.com',
            metadata: {
              userId: 'user_123'
            }
          } as Stripe.Checkout.Session
        },
        api_version: '2023-10-16',
        created: Date.now(),
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null }
      };

      mockVerifyWebhookSignature.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/v1/webhook/stripe')
        .set('stripe-signature', 't=123,v1=signature')
        .send('webhook payload')
        .expect(200);

      expect(response.body.received).toBe(true);
      expect(mockVerifyWebhookSignature).toHaveBeenCalledWith(
        'webhook payload',
        't=123,v1=signature'
      );
    });

    it('should process invoice.payment_succeeded event', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            customer_email: 'test@example.com',
            period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
          } as Stripe.Invoice
        },
        api_version: '2023-10-16',
        created: Date.now(),
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null }
      };

      mockVerifyWebhookSignature.mockReturnValue(mockEvent);
      mockFindCustomerByEmail.mockResolvedValue({
        id: 'cus_test_123',
        email: 'test@example.com'
      });

      const response = await request(app)
        .post('/v1/webhook/stripe')
        .set('stripe-signature', 't=123,v1=signature')
        .send('webhook payload')
        .expect(200);

      expect(response.body.received).toBe(true);
      expect(mockFindCustomerByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should process customer.subscription.deleted event', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'canceled'
          } as Stripe.Subscription
        },
        api_version: '2023-10-16',
        created: Date.now(),
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null }
      };

      mockVerifyWebhookSignature.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/v1/webhook/stripe')
        .set('stripe-signature', 't=123,v1=signature')
        .send('webhook payload')
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should handle unhandled event types', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'customer.created',
        data: { object: {} as any },
        api_version: '2023-10-16',
        created: Date.now(),
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null }
      };

      mockVerifyWebhookSignature.mockReturnValue(mockEvent);

      const response = await request(app)
        .post('/v1/webhook/stripe')
        .set('stripe-signature', 't=123,v1=signature')
        .send('webhook payload')
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should reject webhook without signature', async () => {
      const response = await request(app)
        .post('/v1/webhook/stripe')
        .send('webhook payload')
        .expect(400);

      expect(response.text).toContain('Missing stripe-signature header');
    });

    it('should reject webhook with invalid signature', async () => {
      mockVerifyWebhookSignature.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/v1/webhook/stripe')
        .set('stripe-signature', 't=123,v1=invalid')
        .send('webhook payload')
        .expect(400);

      expect(response.text).toContain('Invalid signature');
    });

    it('should handle webhook processing errors', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            customer_email: 'test@example.com'
          } as Stripe.Invoice
        },
        api_version: '2023-10-16',
        created: Date.now(),
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null }
      };

      mockVerifyWebhookSignature.mockReturnValue(mockEvent);
      mockFindCustomerByEmail.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/v1/webhook/stripe')
        .set('stripe-signature', 't=123,v1=signature')
        .send('webhook payload')
        .expect(500);

      expect(response.body.error).toBe('Webhook processing failed');
    });
  });

  describe('GET /v1/webhook/subscriptions/:userId', () => {
    it('should return subscription info for valid user', async () => {
      // First, simulate a webhook that creates a subscription
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            customer_email: 'test@example.com',
            metadata: {
              userId: 'user_123'
            }
          } as Stripe.Checkout.Session
        },
        api_version: '2023-10-16',
        created: Date.now(),
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null }
      };

      mockVerifyWebhookSignature.mockReturnValue(mockEvent);

      // Process webhook first
      await request(app)
        .post('/v1/webhook/stripe')
        .set('stripe-signature', 't=123,v1=signature')
        .send('webhook payload');

      // Now check subscription
      const response = await request(app)
        .get('/v1/webhook/subscriptions/user_123')
        .expect(200);

      expect(response.body.userId).toBe('user_123');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.hasActiveToken).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/v1/webhook/subscriptions/non_existent_user')
        .expect(404);

      expect(response.body.error).toBe('Subscription not found');
    });
  });

  describe('GET /v1/webhook/subscriptions', () => {
    it('should return all subscriptions', async () => {
      const response = await request(app)
        .get('/v1/webhook/subscriptions')
        .expect(200);

      expect(response.body.total).toBeDefined();
      expect(response.body.active).toBeDefined();
      expect(response.body.subscriptions).toBeInstanceOf(Array);
    });
  });
});
