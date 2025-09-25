// InterTools Pro Payment System
// Handles subscriptions, trials, and payment processing

import Stripe from 'stripe';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  trialDays: number;
  stripePriceId: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'trial' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  isEarlyAdopter: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentEvent {
  type: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' | 'payment_succeeded' | 'payment_failed';
  subscription: UserSubscription;
  timestamp: Date;
}

export class InterToolsProPaymentSystem extends EventEmitter {
  private stripe: Stripe;
  private subscriptionsPath: string;
  private plansPath: string;
  private subscriptions: UserSubscription[] = [];
  private plans: SubscriptionPlan[] = [];

  constructor(stripeSecretKey: string, dataPath: string = '.intertools') {
    super();
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
    
    this.subscriptionsPath = path.join(dataPath, 'subscriptions.json');
    this.plansPath = path.join(dataPath, 'plans.json');
    
    this.ensureDirectories();
    this.loadData();
    this.initializePlans();
    this.setupWebhooks();
  }

  private ensureDirectories(): void {
    const dir = path.dirname(this.subscriptionsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.subscriptionsPath)) {
        const data = fs.readFileSync(this.subscriptionsPath, 'utf8');
        this.subscriptions = JSON.parse(data).map((sub: any) => ({
          ...sub,
          startDate: new Date(sub.startDate),
          endDate: new Date(sub.endDate),
          trialEndDate: sub.trialEndDate ? new Date(sub.trialEndDate) : undefined,
          createdAt: new Date(sub.createdAt),
          updatedAt: new Date(sub.updatedAt)
        }));
      }
      
      if (fs.existsSync(this.plansPath)) {
        const data = fs.readFileSync(this.plansPath, 'utf8');
        this.plans = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load payment data:', error instanceof Error ? error.message : String(error));
    }
  }

  private saveData(): void {
    try {
      fs.writeFileSync(this.subscriptionsPath, JSON.stringify(this.subscriptions, null, 2));
      fs.writeFileSync(this.plansPath, JSON.stringify(this.plans, null, 2));
    } catch (error) {
      console.error('Failed to save payment data:', error instanceof Error ? error.message : String(error));
    }
  }

  private initializePlans(): void {
    if (this.plans.length === 0) {
      this.plans = [
        {
          id: 'basic',
          name: 'Basic',
          price: 0,
          currency: 'usd',
          interval: 'month',
          features: [
            'Basic log reading',
            'Simple error detection',
            'Community support',
            'Basic web chat'
          ],
          trialDays: 0,
          stripePriceId: ''
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 3000, // $30.00 in cents
          currency: 'usd',
          interval: 'month',
          features: [
            'AI Agent Orchestration',
            'Advanced Log Analysis',
            'Cursor Integration',
            'Universal Web Chat',
            'Performance Monitoring',
            'Security Analysis',
            'Priority Support',
            'Lifetime Updates',
            '7-Day Free Trial'
          ],
          trialDays: 7,
          stripePriceId: 'price_pro_monthly' // This would be created in Stripe
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 0, // Custom pricing
          currency: 'usd',
          interval: 'month',
          features: [
            'Everything in Pro',
            'Custom AI Models',
            'On-premise Deployment',
            'Dedicated Support',
            'SLA Guarantee',
            'Custom Integrations'
          ],
          trialDays: 14,
          stripePriceId: ''
        }
      ];
      this.saveData();
    }
  }

  private setupWebhooks(): void {
    // In a real implementation, you'd set up Stripe webhooks here
    // For now, we'll simulate the webhook handling
    console.log('🔗 Payment webhooks initialized');
  }

  public async createCustomer(email: string, name: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          source: 'intertools-pro'
        }
      });
      
      console.log(`✅ Created Stripe customer: ${customer.id}`);
      return customer.id;
    } catch (error) {
      console.error('Failed to create Stripe customer:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  public async createSubscription(
    userId: string,
    planId: string,
    customerId: string,
    isEarlyAdopter: boolean = false
  ): Promise<UserSubscription> {
    try {
      const plan = this.plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      let stripeSubscriptionId = '';
      let trialEndDate: Date | undefined;

      if (plan.price > 0) {
        // Create Stripe subscription
        const subscription = await this.stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: plan.stripePriceId }],
          trial_period_days: plan.trialDays,
          metadata: {
            userId,
            planId,
            isEarlyAdopter: isEarlyAdopter.toString()
          }
        });
        
        stripeSubscriptionId = subscription.id;
        trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined;
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      const userSubscription: UserSubscription = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        planId,
        status: plan.trialDays > 0 ? 'trial' : 'active',
        startDate: now,
        endDate,
        trialEndDate,
        stripeCustomerId: customerId,
        stripeSubscriptionId,
        isEarlyAdopter,
        createdAt: now,
        updatedAt: now
      };

      this.subscriptions.push(userSubscription);
      this.saveData();

      this.emit('subscription_created', {
        type: 'subscription_created',
        subscription: userSubscription,
        timestamp: new Date()
      });

      console.log(`✅ Created subscription for user ${userId}: ${userSubscription.id}`);
      return userSubscription;
    } catch (error) {
      console.error('Failed to create subscription:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  public async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const subscription = this.subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      if (subscription.stripeSubscriptionId) {
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      }

      subscription.status = 'cancelled';
      subscription.updatedAt = new Date();
      this.saveData();

      this.emit('subscription_cancelled', {
        type: 'subscription_cancelled',
        subscription,
        timestamp: new Date()
      });

      console.log(`✅ Cancelled subscription: ${subscriptionId}`);
    } catch (error) {
      console.error('Failed to cancel subscription:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  public async createCheckoutSession(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    try {
      const plan = this.plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      if (plan.price === 0) {
        // Free plan - no checkout needed
        throw new Error('Cannot create checkout session for free plan');
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planId
        },
        subscription_data: {
          trial_period_days: plan.trialDays,
          metadata: {
            userId,
            planId
          }
        }
      });

      console.log(`✅ Created checkout session: ${session.id}`);
      return session.url || '';
    } catch (error) {
      console.error('Failed to create checkout session:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  public getUserSubscription(userId: string): UserSubscription | null {
    return this.subscriptions.find(s => s.userId === userId && s.status !== 'cancelled') || null;
  }

  public isUserActive(userId: string): boolean {
    const subscription = this.getUserSubscription(userId);
    if (!subscription) return false;

    const now = new Date();
    
    if (subscription.status === 'trial') {
      return subscription.trialEndDate ? subscription.trialEndDate > now : false;
    }
    
    if (subscription.status === 'active') {
      return subscription.endDate > now;
    }
    
    return false;
  }

  public isUserEarlyAdopter(userId: string): boolean {
    const subscription = this.getUserSubscription(userId);
    return subscription?.isEarlyAdopter || false;
  }

  public getPlanFeatures(planId: string): string[] {
    const plan = this.plans.find(p => p.id === planId);
    return plan?.features || [];
  }

  public getAllPlans(): SubscriptionPlan[] {
    return [...this.plans];
  }

  public async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
      }
    } catch (error) {
      console.error('Failed to handle webhook event:', error instanceof Error ? error.message : String(error));
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log(`✅ Checkout completed: ${session.id}`);
    // Handle checkout completion logic
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log(`✅ Subscription created: ${subscription.id}`);
    // Handle subscription creation logic
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log(`✅ Subscription updated: ${subscription.id}`);
    // Handle subscription update logic
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log(`✅ Subscription deleted: ${subscription.id}`);
    // Handle subscription deletion logic
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`✅ Payment succeeded: ${invoice.id}`);
    // Handle successful payment logic
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log(`❌ Payment failed: ${invoice.id}`);
    // Handle failed payment logic
  }

  public getStats(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    earlyAdopters: number;
    monthlyRevenue: number;
  } {
    const now = new Date();
    const activeSubs = this.subscriptions.filter(s => 
      s.status === 'active' && s.endDate > now
    );
    const trialSubs = this.subscriptions.filter(s => 
      s.status === 'trial' && s.trialEndDate && s.trialEndDate > now
    );
    const earlyAdopters = this.subscriptions.filter(s => s.isEarlyAdopter);
    
    const monthlyRevenue = activeSubs.reduce((total, sub) => {
      const plan = this.plans.find(p => p.id === sub.planId);
      return total + (plan?.price || 0);
    }, 0);

    return {
      totalSubscriptions: this.subscriptions.length,
      activeSubscriptions: activeSubs.length,
      trialSubscriptions: trialSubs.length,
      earlyAdopters: earlyAdopters.length,
      monthlyRevenue
    };
  }
}
