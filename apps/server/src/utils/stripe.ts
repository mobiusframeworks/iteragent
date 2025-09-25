import Stripe from 'stripe';
import { config } from '../config';
import { logger } from './logger';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * Create a Stripe customer
 */
export async function createCustomer(email: string, metadata?: Record<string, string>) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        product: 'intertools',
        ...metadata
      }
    });

    logger.info('Stripe customer created', { customerId: customer.id, email });
    return customer;
  } catch (error) {
    logger.error('Failed to create Stripe customer', { error, email });
    throw error;
  }
}

/**
 * Create a checkout session for subscription with trial
 */
export async function createCheckoutSession(
  customerEmail: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: config.stripe.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: config.trial.durationDays,
        metadata: {
          product: 'intertools',
          ...metadata
        }
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        product: 'intertools',
        ...metadata
      },
      allow_promotion_codes: true,
    });

    logger.info('Checkout session created', { 
      sessionId: session.id, 
      customerEmail,
      trialDays: config.trial.durationDays
    });

    return session;
  } catch (error) {
    logger.error('Failed to create checkout session', { error, customerEmail });
    throw error;
  }
}

/**
 * Retrieve a customer by email
 */
export async function findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
  try {
    const customers = await stripe.customers.list({
      email,
      limit: 1
    });

    return customers.data[0] || null;
  } catch (error) {
    logger.error('Failed to find customer by email', { error, email });
    return null;
  }
}

/**
 * Get customer's active subscriptions
 */
export async function getCustomerSubscriptions(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    return subscriptions.data;
  } catch (error) {
    logger.error('Failed to get customer subscriptions', { error, customerId });
    return [];
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    logger.info('Subscription cancelled', { subscriptionId });
    return subscription;
  } catch (error) {
    logger.error('Failed to cancel subscription', { error, subscriptionId });
    throw error;
  }
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    logger.info('Billing portal session created', { customerId, sessionId: session.id });
    return session;
  } catch (error) {
    logger.error('Failed to create billing portal session', { error, customerId });
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
  } catch (error) {
    logger.error('Webhook signature verification failed', { error });
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return {
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    };
  } catch (error) {
    logger.error('Failed to get subscription status', { error, subscriptionId });
    return null;
  }
}
