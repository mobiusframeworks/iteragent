// InterTools Pro Protected Script System
// Prevents script theft and requires authentication

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface ProtectedScriptConfig {
  secretKey: string;
  tokenExpiry: string;
  domainWhitelist: string[];
  userAgentWhitelist: string[];
}

export interface ScriptToken {
  userId: string;
  subscriptionId: string;
  planId: string;
  features: string[];
  expiresAt: number;
  domain: string;
  userAgent: string;
}

export class InterToolsProtectedScripts {
  private config: ProtectedScriptConfig;
  private activeTokens: Map<string, ScriptToken> = new Map();

  constructor(config: Partial<ProtectedScriptConfig> = {}) {
    this.config = {
      secretKey: process.env.INTERTOOLS_SECRET_KEY || 'default-secret-key',
      tokenExpiry: '24h',
      domainWhitelist: ['localhost', 'intertools.pro', 'intertools.dev'],
      userAgentWhitelist: [],
      ...config
    };
  }

  public generateScriptToken(
    userId: string,
    subscriptionId: string,
    planId: string,
    features: string[],
    domain: string,
    userAgent: string
  ): string {
    const tokenData: ScriptToken = {
      userId,
      subscriptionId,
      planId,
      features,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      domain,
      userAgent
    };

    const token = jwt.sign(tokenData, this.config.secretKey, {
      expiresIn: this.config.tokenExpiry
    } as any);

    this.activeTokens.set(token, tokenData);
    return token;
  }

  public validateScriptToken(token: string, domain: string, userAgent: string): {
    valid: boolean;
    tokenData?: ScriptToken;
    error?: string;
  } {
    try {
      const decoded = jwt.verify(token, this.config.secretKey) as ScriptToken;
      
      // Check if token is in active tokens
      if (!this.activeTokens.has(token)) {
        return { valid: false, error: 'Token not found in active sessions' };
      }

      // Check domain whitelist
      if (this.config.domainWhitelist.length > 0 && 
          !this.config.domainWhitelist.some(allowed => domain.includes(allowed))) {
        return { valid: false, error: 'Domain not whitelisted' };
      }

      // Check if domain matches token domain
      if (decoded.domain !== domain) {
        return { valid: false, error: 'Domain mismatch' };
      }

      // Check if user agent matches (optional)
      if (this.config.userAgentWhitelist.length > 0 && 
          !this.config.userAgentWhitelist.some(allowed => userAgent.includes(allowed))) {
        return { valid: false, error: 'User agent not whitelisted' };
      }

      return { valid: true, tokenData: decoded };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid token' 
      };
    }
  }

  public generateProtectedScript(token: string, domain: string): string {
    return `
// InterTools Pro Protected Script
// This script is protected and requires authentication
(function() {
  'use strict';
  
  const SCRIPT_TOKEN = '${token}';
  const DOMAIN = '${domain}';
  const SERVER_URL = '${process.env.INTERTOOLS_SERVER_URL || 'http://localhost:3001'}';
  
  // Validate token before loading features
  async function validateToken() {
    try {
      const response = await fetch(SERVER_URL + '/api/pro/validate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: SCRIPT_TOKEN,
          domain: DOMAIN,
          userAgent: navigator.userAgent
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Token validation failed');
      }
      
      return result.tokenData;
    } catch (error) {
      console.error('InterTools Pro: Token validation failed:', error);
      showUpgradePrompt('Authentication failed. Please log in to InterTools Pro.');
      return null;
    }
  }
  
  // Show upgrade prompt
  function showUpgradePrompt(message) {
    const overlay = document.createElement('div');
    overlay.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    \`;
    
    overlay.innerHTML = \`
      <div style="
        background: white;
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
        <h2 style="color: #333; margin-bottom: 15px;">InterTools Pro Required</h2>
        <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">\${message}</p>
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button onclick="window.open('https://intertools.pro/login', '_blank')" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
          ">Login to Pro</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: #f1f5f9;
            color: #64748b;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
          ">Close</button>
        </div>
      </div>
    \`;
    
    document.body.appendChild(overlay);
  }
  
  // Load Pro features after validation
  async function loadProFeatures(tokenData) {
    try {
      // Fetch the actual Pro script from server
      const response = await fetch(SERVER_URL + '/api/pro/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SCRIPT_TOKEN
        },
        body: JSON.stringify({
          features: tokenData.features,
          planId: tokenData.planId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to load Pro features');
      }
      
      const proScript = await response.text();
      
      // Execute the Pro script
      eval(proScript);
      
      console.log('🚀 InterTools Pro features loaded successfully!');
      
    } catch (error) {
      console.error('InterTools Pro: Failed to load features:', error);
      showUpgradePrompt('Failed to load Pro features. Please check your subscription.');
    }
  }
  
  // Initialize
  async function init() {
    console.log('🔐 InterTools Pro: Validating access...');
    
    const tokenData = await validateToken();
    if (tokenData) {
      await loadProFeatures(tokenData);
    }
  }
  
  // Start initialization
  init();
})();
    `;
  }

  public generateFreeScript(): string {
    return `
// InterTools Free - Basic Console Log Analysis
// This is the free version that analyzes console logs and sends to Cursor
(function() {
  'use strict';
  
  console.log('🚀 InterTools Free loaded - Basic console log analysis');
  
  // Basic console log capture
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const logs = [];
  
  function captureLog(type, args) {
    const logEntry = {
      type: type,
      message: Array.from(args).join(' '),
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    };
    
    logs.push(logEntry);
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
  }
  
  // Override console methods
  console.log = function(...args) {
    captureLog('log', args);
    originalLog.apply(console, args);
  };
  
  console.error = function(...args) {
    captureLog('error', args);
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    captureLog('warn', args);
    originalWarn.apply(console, args);
  };
  
  // Create simple chat interface
  function createFreeChatInterface() {
    const chatButton = document.createElement('div');
    chatButton.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      transition: all 0.3s ease;
      user-select: none;
    \`;
    
    chatButton.innerHTML = '💬';
    chatButton.title = 'InterTools Free - Send console logs to Cursor';
    
    chatButton.addEventListener('click', () => {
      showFreeChatInterface();
    });
    
    document.body.appendChild(chatButton);
  }
  
  function showFreeChatInterface() {
    const overlay = document.createElement('div');
    overlay.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    \`;
    
    overlay.innerHTML = \`
      <div style="
        background: white;
        border-radius: 20px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">🚀 InterTools Free</h2>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
          ">×</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #667eea; margin-bottom: 10px;">📊 Console Logs Captured</h3>
          <div id="logs-display" style="
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
            white-space: pre-wrap;
          ">\${logs.slice(-20).map(log => \`[\${log.type.toUpperCase()}] \${log.message}\`).join('\\n')}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">💬 Message for Cursor:</label>
          <textarea id="cursor-message" placeholder="Describe what you want to analyze or improve..." style="
            width: 100%;
            height: 80px;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
            resize: none;
            font-family: inherit;
          "></textarea>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button id="send-to-cursor" style="
            flex: 1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
          ">🤖 Send to Cursor</button>
          <button onclick="window.open('https://intertools.pro', '_blank')" style="
            background: #f1f5f9;
            color: #667eea;
            border: 2px solid #667eea;
            padding: 12px 20px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
          ">🚀 Upgrade to Pro</button>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 8px; font-size: 12px; color: #2e7d32;">
          💡 <strong>Free Version:</strong> Analyzes console logs and sends to Cursor. 
          <a href="https://intertools.pro" target="_blank" style="color: #667eea;">Upgrade to Pro</a> for click-to-chat and advanced features.
        </div>
      </div>
    \`;
    
    document.body.appendChild(overlay);
    
    // Handle send to cursor
    document.getElementById('send-to-cursor').addEventListener('click', () => {
      const message = document.getElementById('cursor-message').value.trim();
      if (!message) {
        alert('Please enter a message');
        return;
      }
      
      const cursorMessage = \`🤖 InterTools Free - Console Log Analysis

📄 Page: \${document.title}
🔗 URL: \${window.location.href}
⏰ Time: \${new Date().toLocaleString()}

💬 Analysis Request:
\${message}

📊 Recent Console Logs:
\`\`\`
\${logs.slice(-20).map(log => \`[\${log.type.toUpperCase()}] \${log.message}\`).join('\\n')}
\`\`\`

🎯 Action Required: Please analyze these console logs and provide suggestions for improvement, error fixes, or optimization opportunities.

💡 Upgrade to InterTools Pro for advanced features like click-to-chat, AI agents, and real-time monitoring.\`;
      
      navigator.clipboard.writeText(cursorMessage).then(() => {
        alert('✅ Message copied to clipboard! Paste it into Cursor chat.');
        overlay.remove();
      }).catch(() => {
        alert('❌ Failed to copy to clipboard. Please copy manually.');
      });
    });
  }
  
  // Initialize free version
  createFreeChatInterface();
  
  console.log('✅ InterTools Free initialized - Console log analysis ready');
})();
    `;
  }

  public revokeToken(token: string): boolean {
    return this.activeTokens.delete(token);
  }

  public cleanupExpiredTokens(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [token, tokenData] of this.activeTokens.entries()) {
      if (tokenData.expiresAt < now) {
        this.activeTokens.delete(token);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  public getActiveTokens(): Map<string, ScriptToken> {
    return new Map(this.activeTokens);
  }
}
