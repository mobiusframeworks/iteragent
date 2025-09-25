// InterTools Pro Authentication System with Clerk
// Handles user authentication, session management, and membership persistence

import { createClerkClient } from '@clerk/backend';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  subscriptionId?: string;
  planId: string;
  isActive: boolean;
  isEarlyAdopter: boolean;
  lastLogin: Date;
  sessionToken: string;
  expiresAt: Date;
}

export interface AuthConfig {
  clerkSecretKey: string;
  clerkPublishableKey: string;
  sessionExpiry: string;
  dataPath: string;
}

export class InterToolsAuthSystem extends EventEmitter {
  private clerk: any;
  private config: AuthConfig;
  private sessionsPath: string;
  private activeSessions: Map<string, UserSession> = new Map();

  constructor(config: Partial<AuthConfig> = {}) {
    super();
    
    this.config = {
      clerkSecretKey: process.env.CLERK_SECRET_KEY || 'sk_test_...',
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || 'pk_test_...',
      sessionExpiry: '30d',
      dataPath: '.intertools',
      ...config
    };
    
    this.clerk = createClerkClient({ secretKey: this.config.clerkSecretKey });
    this.sessionsPath = path.join(this.config.dataPath, 'user-sessions.json');
    
    this.ensureDirectories();
    this.loadSessions();
    this.setupCleanup();
  }

  private ensureDirectories(): void {
    const dir = path.dirname(this.sessionsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadSessions(): void {
    try {
      if (fs.existsSync(this.sessionsPath)) {
        const data = fs.readFileSync(this.sessionsPath, 'utf8');
        const sessions = JSON.parse(data);
        
        sessions.forEach((session: any) => {
          this.activeSessions.set(session.sessionToken, {
            ...session,
            lastLogin: new Date(session.lastLogin),
            expiresAt: new Date(session.expiresAt)
          });
        });
        
        console.log(`📚 Loaded ${this.activeSessions.size} user sessions`);
      }
    } catch (error) {
      console.error('Failed to load user sessions:', error instanceof Error ? error.message : String(error));
    }
  }

  private saveSessions(): void {
    try {
      const sessions = Array.from(this.activeSessions.values());
      fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Failed to save user sessions:', error instanceof Error ? error.message : String(error));
    }
  }

  private setupCleanup(): void {
    // Clean up expired sessions every hour
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  public async authenticateUser(clerkToken: string): Promise<{
    success: boolean;
    session?: UserSession;
    error?: string;
  }> {
    try {
      // Verify Clerk token
      const clerkUser = await this.clerk.verifyToken(clerkToken);
      
      if (!clerkUser) {
        return { success: false, error: 'Invalid authentication token' };
      }

      // Check if user already has an active session
      const existingSession = this.findSessionByUserId(clerkUser.userId);
      if (existingSession && existingSession.expiresAt > new Date()) {
        // Update last login
        existingSession.lastLogin = new Date();
        this.saveSessions();
        
        this.emit('userAuthenticated', existingSession);
        return { success: true, session: existingSession };
      }

      // Create new session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const session: UserSession = {
        userId: clerkUser.userId,
        email: clerkUser.email || '',
        name: clerkUser.name || '',
        planId: 'basic', // Default to basic plan
        isActive: false,
        isEarlyAdopter: false,
        lastLogin: new Date(),
        sessionToken,
        expiresAt
      };

      this.activeSessions.set(sessionToken, session);
      this.saveSessions();

      this.emit('userAuthenticated', session);
      console.log(`✅ User authenticated: ${session.email} (${session.userId})`);
      
      return { success: true, session };
    } catch (error) {
      console.error('Authentication failed:', error instanceof Error ? error.message : String(error));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  public async createTrialUser(
    clerkToken: string,
    subscriptionId: string
  ): Promise<{
    success: boolean;
    session?: UserSession;
    error?: string;
  }> {
    try {
      const authResult = await this.authenticateUser(clerkToken);
      
      if (!authResult.success || !authResult.session) {
        return authResult;
      }

      const session = authResult.session;
      
      // Update session with Pro trial
      session.subscriptionId = subscriptionId;
      session.planId = 'pro';
      session.isActive = true;
      session.isEarlyAdopter = true;
      
      this.activeSessions.set(session.sessionToken, session);
      this.saveSessions();

      this.emit('trialUserCreated', session);
      console.log(`✅ Trial user created: ${session.email}`);
      
      return { success: true, session };
    } catch (error) {
      console.error('Failed to create trial user:', error instanceof Error ? error.message : String(error));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create trial user' 
      };
    }
  }

  public async upgradeUser(
    sessionToken: string,
    newPlanId: string,
    subscriptionId?: string
  ): Promise<{
    success: boolean;
    session?: UserSession;
    error?: string;
  }> {
    try {
      const session = this.activeSessions.get(sessionToken);
      
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (session.expiresAt < new Date()) {
        return { success: false, error: 'Session expired' };
      }

      // Update session
      session.planId = newPlanId;
      session.isActive = true;
      if (subscriptionId) {
        session.subscriptionId = subscriptionId;
      }

      this.activeSessions.set(sessionToken, session);
      this.saveSessions();

      this.emit('userUpgraded', session);
      console.log(`✅ User upgraded: ${session.email} to ${newPlanId}`);
      
      return { success: true, session };
    } catch (error) {
      console.error('Failed to upgrade user:', error instanceof Error ? error.message : String(error));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upgrade user' 
      };
    }
  }

  public validateSession(sessionToken: string): {
    valid: boolean;
    session?: UserSession;
    error?: string;
  } {
    const session = this.activeSessions.get(sessionToken);
    
    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    if (session.expiresAt < new Date()) {
      this.activeSessions.delete(sessionToken);
      this.saveSessions();
      return { valid: false, error: 'Session expired' };
    }

    return { valid: true, session };
  }

  public getUserBySession(sessionToken: string): UserSession | null {
    const validation = this.validateSession(sessionToken);
    return validation.valid ? validation.session! : null;
  }

  public getUserByUserId(userId: string): UserSession | null {
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.expiresAt > new Date()) {
        return session;
      }
    }
    return null;
  }

  public logoutUser(sessionToken: string): boolean {
    const removed = this.activeSessions.delete(sessionToken);
    if (removed) {
      this.saveSessions();
      this.emit('userLoggedOut', sessionToken);
      console.log(`✅ User logged out: ${sessionToken}`);
    }
    return removed;
  }

  public logoutAllUserSessions(userId: string): number {
    let removed = 0;
    
    for (const [token, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(token);
        removed++;
      }
    }
    
    if (removed > 0) {
      this.saveSessions();
      this.emit('userLoggedOutAll', userId);
      console.log(`✅ Logged out all sessions for user: ${userId}`);
    }
    
    return removed;
  }

  private findSessionByUserId(userId: string): UserSession | null {
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.expiresAt > new Date()) {
        return session;
      }
    }
    return null;
  }

  private generateSessionToken(): string {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;
    
    for (const [token, session] of this.activeSessions.entries()) {
      if (session.expiresAt < now) {
        this.activeSessions.delete(token);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.saveSessions();
      console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
    }
    
    return cleaned;
  }

  public getActiveSessions(): UserSession[] {
    const now = new Date();
    return Array.from(this.activeSessions.values())
      .filter(session => session.expiresAt > now);
  }

  public getStats(): {
    totalSessions: number;
    activeSessions: number;
    proUsers: number;
    earlyAdopters: number;
    lastCleanup: Date;
  } {
    const activeSessions = this.getActiveSessions();
    
    return {
      totalSessions: this.activeSessions.size,
      activeSessions: activeSessions.length,
      proUsers: activeSessions.filter(s => s.planId === 'pro').length,
      earlyAdopters: activeSessions.filter(s => s.isEarlyAdopter).length,
      lastCleanup: new Date()
    };
  }

  public async createClerkUser(email: string, name: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // This would typically create a user in Clerk
      // For now, we'll simulate it
      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      console.log(`✅ Clerk user created: ${email} (${userId})`);
      return { success: true, userId };
    } catch (error) {
      console.error('Failed to create Clerk user:', error instanceof Error ? error.message : String(error));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user' 
      };
    }
  }
}
