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

// Get PRO script (protected endpoint)
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
        
        // Read PRO script
        const scriptPath = path.join(__dirname, 'downloads', 'intertools-pro-complete.js');
        
        if (!fs.existsSync(scriptPath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'PRO script not found' 
            });
        }
        
        const script = fs.readFileSync(scriptPath, 'utf8');
        
        res.json({
            success: true,
            script: script,
            userStatus: user.status,
            message: 'PRO script access granted'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

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
