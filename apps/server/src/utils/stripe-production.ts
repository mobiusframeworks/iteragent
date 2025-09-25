import Stripe from 'stripe';
import { config } from '../config';
import { logger } from './logger';

// Initialize Stripe with production configuration
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export interface CreateCheckoutSessionOptions {
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}

export interface CustomerSubscription {
  customerId: string;
  subscriptionId: string;
  status: string;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  priceId: string;
  metadata: Record<string, string>;
}

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = stripe;
    logger.info('Stripe service initialized', {
      environment: config.stripe.secretKey.startsWith('sk_live') ? 'production' : 'test'
    });
  }

  /**
   * Create a Stripe Checkout Session for InterTools Pro subscription
   */
  async createCheckoutSession(options: CreateCheckoutSessionOptions): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: options.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer_email: options.email,
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        subscription_data: {
          trial_period_days: options.trialPeriodDays || 7,
          metadata: {
            product: 'intertools-pro',
            source: 'cli-activation',
            ...options.metadata
          }
        },
        metadata: {
          product: 'intertools-pro',
          email: options.email,
          ...options.metadata
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        customer_creation: 'always',
      });

      logger.info('Checkout session created', {
        sessionId: session.id,
        email: options.email,
        priceId: options.priceId
      });

      return session;
    } catch (error) {
      logger.error('Failed to create checkout session', { error, options });
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Create a trial-only subscription (no payment required)
   */
  async createTrialSubscription(email: string, priceId: string): Promise<CustomerSubscription> {
    try {
      // First, create or find customer
      const customer = await this.findOrCreateCustomer(email);

      // Create subscription with trial
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: 7,
        metadata: {
          product: 'intertools-pro',
          source: 'trial-activation',
          email: email
        }
      });

      logger.info('Trial subscription created', {
        customerId: customer.id,
        subscriptionId: subscription.id,
        email
      });

      return {
        customerId: customer.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        priceId: subscription.items.data[0].price.id,
        metadata: subscription.metadata
      };
    } catch (error) {
      logger.error('Failed to create trial subscription', { error, email });
      throw new Error(`Failed to create trial subscription: ${error.message}`);
    }
  }

  /**
   * Find or create a Stripe customer
   */
  async findOrCreateCustomer(email: string): Promise<Stripe.Customer> {
    try {
      // Search for existing customer
      const customers = await this.stripe.customers.list({
        email: email,
        limit: 1
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: email,
        metadata: {
          product: 'intertools-pro',
          source: 'api'
        }
      });

      logger.info('New customer created', {
        customerId: customer.id,
        email
      });

      return customer;
    } catch (error) {
      logger.error('Failed to find or create customer', { error, email });
      throw new Error(`Failed to find or create customer: ${error.message}`);
    }
  }

  /**
   * Get customer subscription details
   */
  async getCustomerSubscription(customerId: string): Promise<CustomerSubscription | null> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        return null;
      }

      const subscription = subscriptions.data[0];
      
      return {
        customerId,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        priceId: subscription.items.data[0].price.id,
        metadata: subscription.metadata
      };
    } catch (error) {
      logger.error('Failed to get customer subscription', { error, customerId });
      throw new Error(`Failed to get customer subscription: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      
      logger.info('Subscription cancelled', {
        subscriptionId,
        status: subscription.status
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, subscriptionId });
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info('Portal session created', {
        customerId,
        sessionId: session.id
      });

      return session;
    } catch (error) {
      logger.error('Failed to create portal session', { error, customerId });
      throw new Error(`Failed to create portal session: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error) {
      logger.error('Webhook signature verification failed', { error });
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  /**
   * Handle successful checkout session
   */
  async handleCheckoutSuccess(session: Stripe.Checkout.Session): Promise<void> {
    try {
      logger.info('Processing successful checkout', {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription
      });

      // Here you would:
      // 1. Create user account if needed
      // 2. Generate JWT license token
      // 3. Send welcome email
      // 4. Update user status in database

      // For now, just log the success
      logger.info('Checkout processed successfully', {
        sessionId: session.id,
        email: session.customer_email
      });
    } catch (error) {
      logger.error('Failed to handle checkout success', { error, sessionId: session.id });
      throw error;
    }
  }

  /**
   * Handle subscription updates
   */
  async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    try {
      logger.info('Processing subscription update', {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer
      });

      // Here you would:
      // 1. Update user license status
      // 2. Revoke tokens if cancelled
      // 3. Send notification emails
      // 4. Update database records

      logger.info('Subscription update processed', {
        subscriptionId: subscription.id,
        status: subscription.status
      });
    } catch (error) {
      logger.error('Failed to handle subscription update', { error, subscriptionId: subscription.id });
      throw error;
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(): Promise<{
    activeSubscriptions: number;
    trialSubscriptions: number;
    cancelledSubscriptions: number;
    monthlyRevenue: number;
  }> {
    try {
      const [active, trial, cancelled] = await Promise.all([
        this.stripe.subscriptions.list({ status: 'active', limit: 100 }),
        this.stripe.subscriptions.list({ status: 'trialing', limit: 100 }),
        this.stripe.subscriptions.list({ status: 'canceled', limit: 100 })
      ]);

      const monthlyRevenue = active.data.reduce((total, sub) => {
        const price = sub.items.data[0]?.price;
        if (price && price.recurring?.interval === 'month') {
          return total + (price.unit_amount || 0);
        }
        return total;
      }, 0) / 100; // Convert from cents to dollars

      return {
        activeSubscriptions: active.data.length,
        trialSubscriptions: trial.data.length,
        cancelledSubscriptions: cancelled.data.length,
        monthlyRevenue
      };
    } catch (error) {
      logger.error('Failed to get subscription analytics', { error });
      throw new Error(`Failed to get subscription analytics: ${error.message}`);
    }
  }

  /**
   * Get Stripe instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;
