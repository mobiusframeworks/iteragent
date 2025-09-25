// InterTools Pro Paywall System
// Manages access control and feature restrictions

import { EventEmitter } from 'events';
import { InterToolsProFeatures } from './pro-features';
import { InterToolsProPaymentSystem } from './payment-system';

export interface PaywallConfig {
  enablePaywall: boolean;
  trialDays: number;
  gracePeriodDays: number;
  showUpgradePrompts: boolean;
  restrictBasicFeatures: boolean;
}

export interface AccessCheck {
  hasAccess: boolean;
  reason: 'active_subscription' | 'trial_active' | 'grace_period' | 'no_access';
  expiresAt?: Date;
  upgradeRequired: boolean;
  planId: string;
  isEarlyAdopter: boolean;
}

export class InterToolsProPaywall extends EventEmitter {
  private proFeatures: InterToolsProFeatures;
  private paymentSystem: InterToolsProPaymentSystem;
  private config: PaywallConfig;

  constructor(
    proFeatures: InterToolsProFeatures,
    paymentSystem: InterToolsProPaymentSystem,
    config: Partial<PaywallConfig> = {}
  ) {
    super();
    
    this.proFeatures = proFeatures;
    this.paymentSystem = paymentSystem;
    this.config = {
      enablePaywall: true,
      trialDays: 7,
      gracePeriodDays: 3,
      showUpgradePrompts: true,
      restrictBasicFeatures: false,
      ...config
    };
  }

  public checkAccess(userId: string): AccessCheck {
    if (!this.config.enablePaywall) {
      return {
        hasAccess: true,
        reason: 'active_subscription',
        upgradeRequired: false,
        planId: 'basic',
        isEarlyAdopter: false
      };
    }

    const subscription = this.paymentSystem.getUserSubscription(userId);
    const isActive = this.paymentSystem.isUserActive(userId);
    const isEarlyAdopter = this.paymentSystem.isUserEarlyAdopter(userId);

    if (!subscription) {
      return {
        hasAccess: false,
        reason: 'no_access',
        upgradeRequired: true,
        planId: 'basic',
        isEarlyAdopter: false
      };
    }

    if (subscription.status === 'active' && isActive) {
      return {
        hasAccess: true,
        reason: 'active_subscription',
        upgradeRequired: false,
        planId: subscription.planId,
        isEarlyAdopter
      };
    }

    if (subscription.status === 'trial' && subscription.trialEndDate) {
      const now = new Date();
      if (subscription.trialEndDate > now) {
        return {
          hasAccess: true,
          reason: 'trial_active',
          expiresAt: subscription.trialEndDate,
          upgradeRequired: true,
          planId: subscription.planId,
          isEarlyAdopter
        };
      }
    }

    // Check grace period
    if (subscription.endDate) {
      const gracePeriodEnd = new Date(subscription.endDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.config.gracePeriodDays);
      
      if (gracePeriodEnd > new Date()) {
        return {
          hasAccess: true,
          reason: 'grace_period',
          expiresAt: gracePeriodEnd,
          upgradeRequired: true,
          planId: subscription.planId,
          isEarlyAdopter
        };
      }
    }

    return {
      hasAccess: false,
      reason: 'no_access',
      upgradeRequired: true,
      planId: subscription.planId,
      isEarlyAdopter
    };
  }

  public async canUseFeature(userId: string, featureId: string): Promise<boolean> {
    const access = this.checkAccess(userId);
    
    if (!access.hasAccess) {
      if (this.config.showUpgradePrompts) {
        this.showUpgradePrompt(userId, featureId, access);
      }
      return false;
    }

    // Check if feature is available for the user's plan
    const planFeatures = this.paymentSystem.getPlanFeatures(access.planId);
    const feature = this.proFeatures['features'].find(f => f.id === featureId);
    
    if (!feature) {
      return false;
    }

    // Basic plan has limited features
    if (access.planId === 'basic' && this.isProFeature(featureId)) {
      if (this.config.showUpgradePrompts) {
        this.showUpgradePrompt(userId, featureId, access);
      }
      return false;
    }

    return true;
  }

  private isProFeature(featureId: string): boolean {
    const proFeatures = [
      'ai-agent-orchestration',
      'advanced-log-analysis',
      'cursor-integration',
      'universal-web-chat',
      'performance-monitoring',
      'security-analysis'
    ];
    
    return proFeatures.includes(featureId);
  }

  private showUpgradePrompt(userId: string, featureId: string, access: AccessCheck): void {
    const prompt = this.generateUpgradePrompt(featureId, access);
    
    this.emit('upgradePrompt', {
      userId,
      featureId,
      prompt,
      access
    });
    
    console.log(`🔒 Paywall: User ${userId} needs upgrade for feature ${featureId}`);
  }

  private generateUpgradePrompt(featureId: string, access: AccessCheck): string {
    const featureNames: Record<string, string> = {
      'ai-agent-orchestration': 'AI Agent Orchestration',
      'advanced-log-analysis': 'Advanced Log Analysis',
      'cursor-integration': 'Cursor Integration',
      'universal-web-chat': 'Universal Web Chat',
      'performance-monitoring': 'Performance Monitoring',
      'security-analysis': 'Security Analysis'
    };

    const featureName = featureNames[featureId] || featureId;
    
    if (access.reason === 'trial_active' && access.expiresAt) {
      const daysLeft = Math.ceil((access.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return `🚀 Upgrade to InterTools Pro to continue using ${featureName}. Your trial expires in ${daysLeft} days.`;
    }
    
    if (access.reason === 'grace_period' && access.expiresAt) {
      const daysLeft = Math.ceil((access.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return `⚠️ Your InterTools Pro subscription has expired. Upgrade now to continue using ${featureName}. Grace period ends in ${daysLeft} days.`;
    }
    
    return `🔒 ${featureName} is a Pro feature. Upgrade to InterTools Pro to unlock this powerful capability.`;
  }

  public async useFeatureWithPaywall(
    userId: string,
    featureId: string,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; message?: string; requiresUpgrade?: boolean }> {
    const canUse = await this.canUseFeature(userId, featureId);
    
    if (!canUse) {
      return {
        success: false,
        requiresUpgrade: true,
        message: this.generateUpgradePrompt(featureId, this.checkAccess(userId))
      };
    }

    try {
      const success = await this.proFeatures.useFeature(userId, featureId, action, metadata);
      
      if (success) {
        this.emit('featureUsed', { userId, featureId, action, metadata });
        return { success: true };
      } else {
        return {
          success: false,
          message: 'Feature usage failed. Please try again.'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public getUpgradeUrl(userId: string, featureId?: string): string {
    const access = this.checkAccess(userId);
    const baseUrl = process.env.INTERTOOLS_PRO_URL || 'https://intertools.pro';
    
    let url = `${baseUrl}/upgrade?user=${userId}`;
    
    if (featureId) {
      url += `&feature=${featureId}`;
    }
    
    if (access.isEarlyAdopter) {
      url += '&early-adopter=true';
    }
    
    return url;
  }

  public async createTrialUser(userId: string, email: string, name: string): Promise<boolean> {
    try {
      // Create Stripe customer
      const customerId = await this.paymentSystem.createCustomer(email, name);
      
      // Create Pro subscription with trial
      const subscription = await this.paymentSystem.createSubscription(
        userId,
        'pro',
        customerId,
        true // Early adopter
      );
      
      // Create Pro user
      await this.proFeatures.createProUser(
        userId,
        subscription.id,
        'pro',
        true
      );
      
      this.emit('trialUserCreated', { userId, subscription });
      console.log(`✅ Created trial user: ${userId}`);
      
      return true;
    } catch (error) {
      console.error('Failed to create trial user:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  public async upgradeUser(userId: string, newPlanId: string): Promise<boolean> {
    try {
      const user = this.proFeatures.getProUser(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Update subscription in payment system
      // This would typically involve updating the Stripe subscription
      
      // Update Pro user
      user.planId = newPlanId;
      user.limits = this.getDefaultLimits(newPlanId) as any;
      
      this.emit('userUpgraded', { userId, newPlanId });
      console.log(`✅ Upgraded user ${userId} to ${newPlanId}`);
      
      return true;
    } catch (error) {
      console.error('Failed to upgrade user:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  public getPaywallStats(): {
    totalUsers: number;
    activeSubscriptions: number;
    trialUsers: number;
    blockedRequests: number;
    upgradePrompts: number;
  } {
    const paymentStats = this.paymentSystem.getStats();
    const proStats = this.proFeatures.getStats();
    
    return {
      totalUsers: proStats.totalUsers,
      activeSubscriptions: paymentStats.activeSubscriptions,
      trialUsers: paymentStats.trialSubscriptions,
      blockedRequests: 0, // This would be tracked in a real implementation
      upgradePrompts: 0 // This would be tracked in a real implementation
    };
  }

  public updateConfig(config: Partial<PaywallConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('✅ Paywall config updated');
  }

  public getConfig(): PaywallConfig {
    return { ...this.config };
  }

  private getDefaultLimits(planId: string): Record<string, number> {
    const limits: Record<string, Record<string, number>> = {
      basic: {
        maxAiRequests: 10,
        maxLogAnalysis: 100,
        maxWebChatMessages: 50,
        maxCursorIntegrations: 5
      },
      pro: {
        maxAiRequests: 1000,
        maxLogAnalysis: 10000,
        maxWebChatMessages: 1000,
        maxCursorIntegrations: 100
      },
      enterprise: {
        maxAiRequests: -1, // Unlimited
        maxLogAnalysis: -1,
        maxWebChatMessages: -1,
        maxCursorIntegrations: -1
      }
    };
    
    return limits[planId] || limits.basic;
  }
}
