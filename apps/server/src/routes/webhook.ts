import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { verifyWebhookSignature, findCustomerByEmail } from '../utils/stripe';
import { generateSubscriptionToken } from '../utils/jwt';
import { logger, securityLogger } from '../utils/logger';

const router = Router();

// Store for user/subscription mapping (use database in production)
interface UserSubscription {
  userId: string;
  email: string;
  customerId: string;
  subscriptionId: string;
  status: 'active' | 'past_due' | 'cancelled' | 'unpaid';
  currentPeriodEnd: Date;
  trialEnd?: Date;
  token?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptions = new Map<string, UserSubscription>();
const customerToUser = new Map<string, string>(); // customerId -> userId

/**
 * POST /v1/webhook/stripe
 * Handles Stripe webhook events
 */
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    logger.warn('Webhook missing signature');
    return res.status(400).send('Missing stripe-signature header');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = verifyWebhookSignature(req.body, sig);
    logger.info('Webhook received', { type: event.type, id: event.id });
  } catch (error) {
    logger.error('Webhook signature verification failed', { error });
    return res.status(400).send('Invalid signature');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        logger.info('Unhandled webhook event', { type: event.type });
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Webhook processing error', { error, eventType: event.type, eventId: event.id });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logger.info('Processing checkout completed', { sessionId: session.id });

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (!customerEmail) {
    logger.error('No customer email in checkout session', { sessionId: session.id });
    return;
  }

  // Generate user ID from metadata or create new one
  const userId = session.metadata?.userId || 
    `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  // Store customer mapping
  customerToUser.set(customerId, userId);

  logger.info('Checkout session completed', {
    sessionId: session.id,
    userId,
    customerId,
    subscriptionId,
    email: customerEmail
  });

  // Note: We don't generate token yet - wait for first successful payment or trial activation
}

/**
 * Handle invoice.payment_succeeded
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info('Processing payment succeeded', { invoiceId: invoice.id });

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    logger.warn('No subscription ID in payment succeeded event', { invoiceId: invoice.id });
    return;
  }

  const userId = customerToUser.get(customerId);
  if (!userId) {
    logger.error('No user mapping for customer', { customerId, invoiceId: invoice.id });
    return;
  }

  // Get customer details
  const customer = await findCustomerByEmail(invoice.customer_email || '');
  if (!customer) {
    logger.error('Customer not found', { customerId });
    return;
  }

  // Generate or update subscription token
  const token = generateSubscriptionToken(
    customer.email!,
    userId,
    customerId,
    subscriptionId
  );

  // Store subscription info
  const subscription: UserSubscription = {
    userId,
    email: customer.email!,
    customerId,
    subscriptionId,
    status: 'active',
    currentPeriodEnd: new Date(invoice.period_end * 1000),
    token,
    createdAt: subscriptions.get(subscriptionId)?.createdAt || new Date(),
    updatedAt: new Date()
  };

  subscriptions.set(subscriptionId, subscription);

  securityLogger.tokenGenerated(customer.email!, 'subscription');

  logger.info('Subscription token generated', {
    userId,
    email: customer.email,
    subscriptionId,
    currentPeriodEnd: subscription.currentPeriodEnd
  });
}

/**
 * Handle invoice.payment_failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  logger.info('Processing payment failed', { invoiceId: invoice.id });

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) {
    return;
  }

  const subscription = subscriptions.get(subscriptionId);
  if (!subscription) {
    logger.warn('Subscription not found for payment failure', { subscriptionId });
    return;
  }

  // Mark as past due but don't immediately revoke token (grace period)
  subscription.status = 'past_due';
  subscription.updatedAt = new Date();

  subscriptions.set(subscriptionId, subscription);

  logger.warn('Subscription marked as past due', {
    userId: subscription.userId,
    email: subscription.email,
    subscriptionId
  });

  // TODO: Send email notification about payment failure
  // TODO: Set grace period timer to revoke token if not resolved
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info('Processing subscription deleted', { subscriptionId: subscription.id });

  const subscriptionRecord = subscriptions.get(subscription.id);
  if (!subscriptionRecord) {
    logger.warn('Subscription record not found for deletion', { subscriptionId: subscription.id });
    return;
  }

  // Mark subscription as cancelled and revoke token
  subscriptionRecord.status = 'cancelled';
  subscriptionRecord.token = undefined; // Revoke token
  subscriptionRecord.updatedAt = new Date();

  subscriptions.set(subscription.id, subscriptionRecord);

  logger.info('Subscription cancelled and token revoked', {
    userId: subscriptionRecord.userId,
    email: subscriptionRecord.email,
    subscriptionId: subscription.id
  });
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Processing subscription updated', { subscriptionId: subscription.id });

  const subscriptionRecord = subscriptions.get(subscription.id);
  if (!subscriptionRecord) {
    logger.warn('Subscription record not found for update', { subscriptionId: subscription.id });
    return;
  }

  // Update subscription status
  const statusMap: Record<string, UserSubscription['status']> = {
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'cancelled',
    'unpaid': 'unpaid'
  };

  subscriptionRecord.status = statusMap[subscription.status] || 'cancelled';
  subscriptionRecord.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  subscriptionRecord.trialEnd = subscription.trial_end ? 
    new Date(subscription.trial_end * 1000) : undefined;
  subscriptionRecord.updatedAt = new Date();

  // Revoke token if subscription is not active
  if (subscriptionRecord.status !== 'active') {
    subscriptionRecord.token = undefined;
  }

  subscriptions.set(subscription.id, subscriptionRecord);

  logger.info('Subscription updated', {
    userId: subscriptionRecord.userId,
    email: subscriptionRecord.email,
    subscriptionId: subscription.id,
    status: subscriptionRecord.status
  });
}

/**
 * Handle customer.subscription.trial_will_end
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  logger.info('Processing trial will end', { subscriptionId: subscription.id });

  const subscriptionRecord = subscriptions.get(subscription.id);
  if (!subscriptionRecord) {
    return;
  }

  logger.info('Trial ending soon', {
    userId: subscriptionRecord.userId,
    email: subscriptionRecord.email,
    subscriptionId: subscription.id,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
  });

  // TODO: Send trial ending notification email
}

/**
 * Get subscription info (for admin/debugging)
 */
router.get('/subscriptions/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Find subscription by user ID
  const subscription = Array.from(subscriptions.values()).find(sub => sub.userId === userId);

  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  // Don't expose the actual token
  const { token, ...subscriptionInfo } = subscription;

  res.json({
    ...subscriptionInfo,
    hasActiveToken: !!token
  });
});

/**
 * Get all subscriptions (admin only - add auth in production)
 */
router.get('/subscriptions', async (req: Request, res: Response) => {
  // TODO: Add admin authentication

  const allSubscriptions = Array.from(subscriptions.values()).map(sub => {
    const { token, ...info } = sub;
    return {
      ...info,
      hasActiveToken: !!token
    };
  });

  res.json({
    total: allSubscriptions.length,
    active: allSubscriptions.filter(sub => sub.status === 'active').length,
    subscriptions: allSubscriptions
  });
});

export default router;
