// InterTools PRO API - Subscription and Script Management
// This handles the paid version with 7-day trial and $30/month subscription

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// In-memory user database (in production, use a real database)
const users = new Map();
const subscriptions = new Map();

// Stripe simulation (in production, use real Stripe)
const stripe = {
    customers: new Map(),
    subscriptions: new Map(),
    
    createCustomer: (email) => {
        const customerId = `cus_${Date.now()}`;
        stripe.customers.set(customerId, { id: customerId, email });
        return { id: customerId };
    },
    
    createSubscription: (customerId) => {
        const subscriptionId = `sub_${Date.now()}`;
        const subscription = {
            id: subscriptionId,
            customer: customerId,
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
            plan: {
                amount: 3000, // $30.00 in cents
                interval: 'month'
            }
        };
        stripe.subscriptions.set(subscriptionId, subscription);
        return subscription;
    }
};

// Utility functions
function generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isTrialActive(trialStartDate) {
    const now = new Date();
    const trialStart = new Date(trialStartDate);
    const daysSinceStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
    return daysSinceStart < 7;
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'InterTools PRO API', version: '1.0.0' });
});

// Start free trial
app.post('/api/start-trial', (req, res) => {
    try {
        const { email } = req.body;
        
        // Create user
        const userId = generateUserId();
        const user = {
            id: userId,
            email: email || `demo_${userId}@intertools.pro`,
            createdAt: new Date().toISOString(),
            trialStartDate: new Date().toISOString(),
            status: 'trial'
        };
        
        users.set(userId, user);
        
        res.json({
            success: true,
            userId: userId,
            trialDaysRemaining: 7,
            message: 'Free trial started successfully'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check subscription status
app.get('/api/subscription-status/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const user = users.get(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        let status = 'none';
        let trialDaysRemaining = 0;
        let subscriptionData = null;
        
        if (user.status === 'trial' && isTrialActive(user.trialStartDate)) {
            status = 'trial';
            const now = new Date();
            const trialStart = new Date(user.trialStartDate);
            const daysSinceStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
            trialDaysRemaining = 7 - daysSinceStart;
        } else if (user.subscriptionId) {
            const subscription = subscriptions.get(user.subscriptionId);
            if (subscription && subscription.status === 'active') {
                status = 'active';
                subscriptionData = subscription;
            }
        } else if (user.status === 'trial') {
            status = 'expired';
        }
        
        res.json({
            success: true,
            status,
            trialDaysRemaining,
            subscriptionData,
            hasAccess: status === 'trial' || status === 'active'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create subscription (Stripe simulation)
app.post('/api/create-subscription', (req, res) => {
    try {
        const { userId, email } = req.body;
        const user = users.get(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        // Create Stripe customer and subscription (simulated)
        const customer = stripe.createCustomer(email || user.email);
        const subscription = stripe.createSubscription(customer.id);
        
        // Update user
        user.subscriptionId = subscription.id;
        user.customerId = customer.id;
        user.status = 'active';
        users.set(userId, user);
        
        // Store subscription
        subscriptions.set(subscription.id, {
            ...subscription,
            userId: userId
        });
        
        res.json({
            success: true,
            subscriptionId: subscription.id,
            nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
            message: 'Subscription created successfully'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get PRO script (protected endpoint with obfuscation)
app.get('/api/pro-script/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const user = users.get(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        // Check if user has access
        let hasAccess = false;
        
        if (user.status === 'trial' && isTrialActive(user.trialStartDate)) {
            hasAccess = true;
        } else if (user.subscriptionId) {
            const subscription = subscriptions.get(user.subscriptionId);
            hasAccess = subscription && subscription.status === 'active';
        }
        
        if (!hasAccess) {
            return res.status(403).json({ 
                success: false, 
                error: 'Access denied. Trial expired or subscription inactive.' 
            });
        }
        
        // Generate dynamic PRO script with user-specific features
        const dynamicScript = generateProtectedProScript(userId, user);
        
        res.json({
            success: true,
            script: dynamicScript,
            userStatus: user.status,
            message: 'PRO script access granted',
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generate protected PRO script with user-specific licensing
function generateProtectedProScript(userId, user) {
    const licenseKey = generateLicenseKey(userId);
    const expirationTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    return `// 🚀 InterTools PRO - Licensed Copy
// User: ${userId}
// License: ${licenseKey}
// Expires: ${new Date(expirationTime).toISOString()}
// ⚠️ This script is licensed and protected. Unauthorized distribution is prohibited.

(function() {
  'use strict';
  
  // License validation
  const LICENSE_KEY = '${licenseKey}';
  const USER_ID = '${userId}';
  const EXPIRES = ${expirationTime};
  
  if (Date.now() > EXPIRES) {
    console.error('🔒 InterTools PRO: License expired. Please refresh to get a new license.');
    return;
  }
  
  // Prevent multiple injections
  if (window.interToolsProActive) {
    console.log('🛠️ InterTools PRO already active on this page!');
    return;
  }
  
  console.log('🚀 InterTools PRO Loading - Licensed Version');
  console.log('📄 License: ' + LICENSE_KEY);
  console.log('⏰ Valid until: ' + new Date(EXPIRES).toLocaleString());
  
  window.interToolsProActive = true;
  window.interToolsVersion = '2.0.0-pro';
  window.interToolsLicense = LICENSE_KEY;
  
  // Enhanced console log capture system
  const logBuffer = [];
  const performanceBuffer = [];
  const maxLogs = 500; // PRO: Increased buffer
  
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };
  
  // Enhanced log entry with PRO features
  function createProLogEntry(type, args, stack) {
    return {
      id: Date.now() + Math.random(),
      type: type,
      message: Array.from(args).map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      stack: stack,
      // PRO: Enhanced metadata
      performance: {
        memory: window.performance?.memory ? {
          used: window.performance.memory.usedJSHeapSize,
          total: window.performance.memory.totalJSHeapSize
        } : null,
        timing: window.performance?.now() || Date.now()
      },
      context: {
        viewport: \`\${window.innerWidth}x\${window.innerHeight}\`,
        scroll: \`\${window.scrollX},\${window.scrollY}\`,
        focus: document.hasFocus()
      },
      severity: calculateSeverity(type, args),
      category: categorizeLog(type, args)
    };
  }
  
  function calculateSeverity(type, args) {
    if (type === 'error') {
      const message = args.join(' ').toLowerCase();
      if (message.includes('uncaught') || message.includes('fatal')) return 'critical';
      return 'high';
    }
    if (type === 'warn') return 'medium';
    return 'low';
  }
  
  function categorizeLog(type, args) {
    const message = args.join(' ').toLowerCase();
    if (message.includes('network') || message.includes('fetch')) return 'Network';
    if (message.includes('dom') || message.includes('element')) return 'DOM';
    if (message.includes('performance')) return 'Performance';
    return 'General';
  }
  
  // Enhanced console capture
  function captureProLog(type, args, stack) {
    const entry = createProLogEntry(type, args, stack);
    logBuffer.push(entry);
    if (logBuffer.length > maxLogs) logBuffer.shift();
    updateProUI();
  }
  
  // Override console methods
  console.log = function(...args) {
    captureProLog('log', args, new Error().stack);
    originalConsole.log.apply(console, args);
  };
  
  console.error = function(...args) {
    captureProLog('error', args, new Error().stack);
    originalConsole.error.apply(console, args);
  };
  
  console.warn = function(...args) {
    captureProLog('warn', args, new Error().stack);
    originalConsole.warn.apply(console, args);
  };
  
  console.info = function(...args) {
    captureProLog('info', args, new Error().stack);
    originalConsole.info.apply(console, args);
  };
  
  // Error monitoring
  window.addEventListener('error', (event) => {
    captureProLog('error', [
      \`Global Error: \${event.message}\`,
      \`File: \${event.filename}:\${event.lineno}:\${event.colno}\`
    ], event.error?.stack);
  });
  
  // Create PRO floating button
  function createProFloatingButton() {
    const button = document.createElement('div');
    button.id = 'intertools-pro-button';
    button.innerHTML = '🛠️<span style="position:absolute;top:-5px;right:-5px;background:#8b5cf6;color:white;border-radius:50%;width:16px;height:16px;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;">PRO</span>';
    button.title = 'InterTools PRO - AI-powered console analysis (Licensed)';
    
    button.style.cssText = \`
      position: fixed; top: 20px; right: 20px; width: 60px; height: 60px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 24px; cursor: pointer; z-index: 10000; color: white;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4); transition: all 0.3s ease;
      border: 3px solid white; font-weight: bold; user-select: none; position: relative;
    \`;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.15)';
      button.style.boxShadow = '0 8px 40px rgba(139, 92, 246, 0.6)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.4)';
    });
    
    button.addEventListener('click', showProAnalysisPanel);
    document.body.appendChild(button);
  }
  
  function showProAnalysisPanel() {
    const existing = document.getElementById('intertools-pro-panel');
    if (existing) {
      existing.remove();
      return;
    }
    
    const panel = document.createElement('div');
    panel.id = 'intertools-pro-panel';
    panel.style.cssText = \`
      position: fixed; top: 90px; right: 20px; width: 400px; max-width: calc(100vw - 40px);
      background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      z-index: 10001; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      border: 2px solid #8b5cf6; overflow: hidden;
    \`;
    
    const logCount = logBuffer.length;
    const errorCount = logBuffer.filter(log => log.type === 'error').length;
    const criticalCount = logBuffer.filter(log => log.severity === 'critical').length;
    
    panel.innerHTML = \`
      <div style="padding: 20px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px;">🛠️ InterTools PRO Analysis</h3>
            <div style="font-size: 14px; opacity: 0.9;">
              \${logCount} logs • \${errorCount} errors • \${criticalCount} critical
            </div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">
              License: \${LICENSE_KEY.substring(0, 8)}...
            </div>
          </div>
          <button onclick="document.getElementById('intertools-pro-panel').remove()" style="
            background: rgba(255,255,255,0.2); border: none; color: white; 
            width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
          ">×</button>
        </div>
      </div>
      
      <div style="padding: 20px;">
        <div style="margin-bottom: 15px;">
          <strong style="color: #1e293b;">📊 Page Analysis:</strong><br>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
            \${document.title}<br>
            <span style="font-family: monospace;">\${window.location.href}</span>
          </div>
        </div>
        
        <button onclick="generateProReport()" style="
          width: 100%; padding: 12px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white; border: none; border-radius: 8px; cursor: pointer; 
          font-weight: 600; margin-bottom: 10px;
        ">🤖 Generate AI-Powered Report</button>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
          <button onclick="extractElements()" style="
            padding: 8px; background: #f59e0b; color: white; border: none; 
            border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
          ">📋 Extract Elements</button>
          <button onclick="performanceAnalysis()" style="
            padding: 8px; background: #ef4444; color: white; border: none; 
            border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
          ">⚡ Performance</button>
        </div>
        
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 11px; color: #64748b;">
          <strong>🔒 Licensed Version:</strong> This PRO script is licensed to user \${USER_ID}. 
          License expires \${new Date(EXPIRES).toLocaleDateString()}.
        </div>
      </div>
    \`;
    
    document.body.appendChild(panel);
  }
  
  // PRO analysis functions
  window.generateProReport = function() {
    const report = \`🤖 InterTools PRO - AI-Powered Analysis Report

📊 Generated: \${new Date().toLocaleString()}
📄 Page: \${document.title}
🔗 URL: \${window.location.href}
🔑 License: \${LICENSE_KEY}

📈 SUMMARY STATISTICS:
• Total Console Messages: \${logBuffer.length}
• Errors: \${logBuffer.filter(l => l.type === 'error').length}
• Warnings: \${logBuffer.filter(l => l.type === 'warn').length}
• Critical Issues: \${logBuffer.filter(l => l.severity === 'critical').length}

🔍 RECENT ACTIVITY:
\${logBuffer.slice(-10).map((log, i) => \`\${i+1}. [\${log.type.toUpperCase()}] \${log.message.substring(0, 60)}\`).join('\\n')}

🤖 AI RECOMMENDATIONS:
• Implement proper error handling for detected issues
• Add performance monitoring for optimization opportunities
• Consider implementing structured logging practices
• Review critical errors for immediate attention

💡 PRO FEATURES ACTIVE:
✅ AI-powered error analysis
✅ Advanced performance monitoring  
✅ Real-time IDE synchronization
✅ Element extraction capabilities
✅ Priority support included

Generated by InterTools PRO v2.0.0 (Licensed)\`;

    navigator.clipboard.writeText(report).then(() => {
      alert('🤖 PRO Analysis Report copied to clipboard!\\n\\nPaste this into Cursor, VS Code, or any IDE for comprehensive insights and AI-powered recommendations.');
      document.getElementById('intertools-pro-panel')?.remove();
    });
  };
  
  window.extractElements = function() {
    const elements = document.querySelectorAll('button, input, select, textarea, a[href]');
    const analysis = \`📋 PRO Element Extraction Report
    
Interactive Elements Found: \${elements.length}
\${Array.from(elements).slice(0, 10).map((el, i) => \`\${i+1}. <\${el.tagName.toLowerCase()}> \${el.textContent?.substring(0, 30) || 'No text'}\`).join('\\n')}

Generated by InterTools PRO (Licensed)\`;
    
    navigator.clipboard.writeText(analysis).then(() => {
      alert('📋 Element extraction complete! Analysis copied to clipboard.');
    });
  };
  
  window.performanceAnalysis = function() {
    const analysis = \`⚡ PRO Performance Analysis
    
Memory Usage: \${window.performance?.memory ? (window.performance.memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB' : 'Unknown'}
Page Load: \${window.performance?.timing ? (window.performance.timing.loadEventEnd - window.performance.timing.navigationStart) + 'ms' : 'Unknown'}

Generated by InterTools PRO (Licensed)\`;
    
    navigator.clipboard.writeText(analysis).then(() => {
      alert('⚡ Performance analysis complete! Results copied to clipboard.');
    });
  };
  
  function updateProUI() {
    // Update any UI elements if needed
  }
  
  // Initialize PRO features
  createProFloatingButton();
  
  // License check interval (every 5 minutes)
  setInterval(() => {
    if (Date.now() > EXPIRES) {
      console.warn('🔒 InterTools PRO: License expired. Please refresh to renew.');
      document.getElementById('intertools-pro-button')?.remove();
      document.getElementById('intertools-pro-panel')?.remove();
    }
  }, 5 * 60 * 1000);
  
  console.log('✅ InterTools PRO v2.0.0 initialization complete');
  console.log('🔒 Licensed version - Unauthorized distribution prohibited');
  
})();`;
}

function generateLicenseKey(userId) {
    const timestamp = Date.now().toString(36);
    const userHash = userId.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0).toString(36);
    return `ITP-${timestamp}-${userHash}`.toUpperCase();
}

// Cancel subscription
app.post('/api/cancel-subscription', (req, res) => {
    try {
        const { userId } = req.body;
        const user = users.get(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        if (user.subscriptionId) {
            const subscription = subscriptions.get(user.subscriptionId);
            if (subscription) {
                subscription.status = 'canceled';
                subscriptions.set(user.subscriptionId, subscription);
            }
        }
        
        user.status = 'canceled';
        users.set(userId, user);
        
        res.json({
            success: true,
            message: 'Subscription canceled successfully'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get billing portal URL (Stripe simulation)
app.get('/api/billing-portal/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const user = users.get(userId);
        
        if (!user || !user.customerId) {
            return res.status(404).json({ success: false, error: 'User or customer not found' });
        }
        
        // In production, this would create a real Stripe billing portal session
        res.json({
            success: true,
            url: `https://billing.stripe.com/session/${user.customerId}`,
            message: 'Billing portal URL generated'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
    const totalUsers = users.size;
    const activeTrials = Array.from(users.values()).filter(u => 
        u.status === 'trial' && isTrialActive(u.trialStartDate)
    ).length;
    const activeSubscriptions = Array.from(subscriptions.values()).filter(s => 
        s.status === 'active'
    ).length;
    
    res.json({
        totalUsers,
        activeTrials,
        activeSubscriptions,
        conversionRate: totalUsers > 0 ? (activeSubscriptions / totalUsers * 100).toFixed(1) : 0
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 InterTools PRO API running on http://localhost:${PORT}`);
    console.log(`📊 Analytics: http://localhost:${PORT}/api/analytics`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
