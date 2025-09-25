# InterTools Pro - Demo Mode Setup

## 🎭 Demo Mode (Currently Active)

Your InterTools Pro frontend is now running in **Demo Mode** at `http://localhost:5174`. This allows you to test all features without setting up Clerk or Stripe accounts.

### ✅ What Works in Demo Mode

- **Sign In Demo**: Simulates user authentication
- **Start Demo Trial**: Simulates 7-day trial with countdown
- **Trial Management**: Full trial countdown and upgrade prompts
- **Pro Script Access**: Demo Pro script (shows what real script would do)
- **Free Script**: Always available (real script)
- **Upgrade Flow**: Shows what Stripe checkout would look like

### 🧪 Test the Demo

1. **Visit**: `http://localhost:5174`
2. **Click**: "Start Demo Trial" or "Sign In Demo"
3. **See**: Trial countdown, Pro features, upgrade prompts
4. **Test**: All buttons and features work

---

## 🚀 Switch to Production Mode

When you're ready to use real authentication and payments:

### 1. Set up Clerk Authentication

1. Go to [clerk.com](https://clerk.com)
2. Create a new application
3. Get your **Publishable Key** from API Keys
4. Update `index.html` line 643:
   ```javascript
   this.PUBLISHABLE_KEY = 'pk_test_your_actual_clerk_key_here';
   ```

### 2. Set up Stripe Payments

1. Go to [stripe.com](https://stripe.com)
2. Get your **Publishable Key** from Developers > API Keys
3. Update `index.html` line 644:
   ```javascript
   this.STRIPE_PUBLISHABLE_KEY = 'pk_test_your_actual_stripe_key_here';
   ```

### 3. Configure Backend

1. Set your Stripe Secret Key:
   ```bash
   export STRIPE_SECRET_KEY="sk_test_your_actual_stripe_secret_key"
   ```

2. Set your Clerk Secret Key:
   ```bash
   export CLERK_SECRET_KEY="sk_test_your_actual_clerk_secret_key"
   ```

### 4. Disable Demo Mode

Update `index.html` line 651:
```javascript
this.isDemoMode = false; // Change to false
```

### 5. Create Stripe Product

In Stripe dashboard:
- **Product**: InterTools Pro
- **Price**: $30.00 USD monthly
- **Price ID**: `price_pro_monthly`

---

## 🎯 Demo Features Explained

### Trial System
- **7-day countdown**: Shows days/hours/minutes remaining
- **Trial banner**: Appears when trial is active
- **Upgrade prompts**: Automatic prompts when trial expires
- **Feature access**: Full Pro features during trial

### Script Protection
- **Free script**: Always available (real script)
- **Pro script**: Demo version shows what real protected script would do
- **Authentication**: Demo simulates real authentication flow

### Payment Flow
- **Upgrade button**: Shows what Stripe checkout would look like
- **Trial expiration**: Automatic upgrade prompts
- **Subscription management**: Simulated subscription handling

---

## 📊 What You Can Test

### ✅ User Flows
1. **Sign up** → Trial starts
2. **Use Pro features** during trial
3. **See countdown** timer
4. **Get upgrade prompts** when trial expires
5. **Test payment flow** (demo)

### ✅ UI/UX
1. **Responsive design** on all devices
2. **Professional styling** with gradients and animations
3. **Clear value proposition** for each plan
4. **Smooth transitions** between states

### ✅ Business Logic
1. **Trial management** with proper timing
2. **Feature gating** based on subscription
3. **Upgrade prompts** at the right moments
4. **Script protection** concepts

---

## 🔄 Next Steps

1. **Test the demo** thoroughly at `http://localhost:5174`
2. **Verify all features** work as expected
3. **Set up real accounts** when ready for production
4. **Deploy to production** with real authentication

The demo gives you a complete preview of how your SaaS product will work with real users and payments!

