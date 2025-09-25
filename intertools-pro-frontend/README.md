# InterTools Pro Frontend v2.0.0

A modern, ES6+ frontend for InterTools Pro with comprehensive trial management, Stripe integration, and Clerk authentication. Built with the latest JavaScript features and designed to work with your current Node.js version.

## 🚀 Features

- ✅ **Modern ES6+ JavaScript**: Uses latest JavaScript features (classes, async/await, modules)
- ✅ **Try Free for 1 Week**: No payment upfront - users can try InterTools free for 1 week
- ✅ **Stripe Integration**: Secure payment processing with $30/month pricing after trial
- ✅ **Clerk Authentication**: Professional user authentication and session management
- ✅ **Protected Scripts**: Pro scripts require authentication to prevent theft
- ✅ **Responsive Design**: Beautiful UI that works on all devices
- ✅ **Node.js Compatible**: Works with Node.js 18+ (including your current version)
- ✅ **No Build Process**: Pure HTML/JS - no compilation needed

## 🎯 Trial System

### Free Trial Features
- **1 week duration** - No payment upfront
- **Full Pro access** during trial period
- **Real-time countdown** showing days/hours/minutes remaining
- **Automatic upgrade prompts** when trial expires
- **Seamless transition** to paid subscription

### Pricing
- **Free**: Basic console log analysis (always available)
- **Pro**: Try free for 1 week, then $30/month to continue
- **Enterprise**: Custom pricing with 14-day trial

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Go to **API Keys** and copy your **Publishable Key**
4. Update `index.html` line 2:
   ```javascript
   this.PUBLISHABLE_KEY = 'pk_test_your_actual_publishable_key_here';
   ```

### 3. Configure Stripe Payments

1. Go to [stripe.com](https://stripe.com) and create an account
2. Go to **Developers > API Keys**
3. Copy your **Publishable Key**
4. Update `index.html` line 3:
   ```javascript
   this.STRIPE_PUBLISHABLE_KEY = 'pk_test_your_actual_stripe_key_here';
   ```

### 4. Configure Backend Stripe

1. Copy your **Secret Key** from Stripe
2. Set environment variable:
   ```bash
   export STRIPE_SECRET_KEY="sk_test_your_actual_secret_key_here"
   ```

### 5. Create Stripe Products

In your Stripe dashboard, create:

**Product**: InterTools Pro
- **Price**: $30.00 USD
- **Billing**: Monthly
- **Price ID**: `price_pro_monthly` (or update the plans.json file)

### 6. Start Both Servers

```bash
# Terminal 1: Backend
cd /Users/alexhorton/iteragent/packages/iteragent-cli
node dist/index.js web-chat --start

# Terminal 2: Frontend
cd /Users/alexhorton/iteragent/intertools-pro-frontend
npm start
```

## 🧪 Testing the Trial System

### 1. Test Free Trial Flow
1. Visit `http://localhost:5173`
2. Click "Start Free Trial" to sign up
3. Verify trial banner appears
4. Check countdown timer
5. Test Pro script access

### 2. Test Upgrade Flow
1. Click "Upgrade Now" during trial
2. Verify Stripe checkout opens
3. Complete test payment
4. Verify Pro access continues

### 3. Test Trial Expiration
1. Manually expire trial in backend
2. Verify upgrade prompt appears
3. Test that Pro features are locked

## 📁 Project Structure

```
intertools-pro-frontend/
├── index.html          # Complete modern application
├── server.js          # ES6+ Express server
├── package.json        # Modern dependencies
└── README.md          # This file
```

## 🔧 Technical Details

### Modern JavaScript Features Used
- **ES6 Classes**: `class InterToolsProApp`
- **Async/Await**: All API calls use modern async patterns
- **Arrow Functions**: Consistent modern syntax
- **Template Literals**: Clean string interpolation
- **Destructuring**: Modern object/array handling
- **Modules**: ES6 import/export syntax
- **Const/Let**: Proper variable scoping

### API Integration
- **Clerk**: User authentication and session management
- **Stripe**: Payment processing and subscription management
- **InterTools Backend**: Trial management and script generation

### Security Features
- ✅ JWT token validation
- ✅ Domain whitelisting
- ✅ User agent validation
- ✅ Session expiration
- ✅ Server-side script generation
- ✅ Protected API endpoints

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Set production environment variables
export NODE_ENV=production
export STRIPE_SECRET_KEY="sk_live_your_live_secret_key"
export CLERK_SECRET_KEY="sk_live_your_live_clerk_key"
```

### 2. Deploy Frontend
- Upload `index.html` to any static hosting service
- Update API endpoints to point to production backend
- Configure CORS settings

### 3. Deploy Backend
- Set up production database
- Configure webhook endpoints
- Set up monitoring and logging

## 📊 Analytics & Monitoring

### Trial Metrics to Track
- Trial sign-up rate
- Trial-to-paid conversion rate
- Average trial duration
- Feature usage during trial
- Churn rate after trial

### Key Performance Indicators
- **Conversion Rate**: Trial → Paid
- **Trial Completion Rate**: Users who use full 7 days
- **Feature Adoption**: Which Pro features drive conversions
- **Customer Lifetime Value**: Revenue per user

## 🔄 Updates & Maintenance

### Regular Tasks
- Monitor trial conversion rates
- Update Stripe webhook handlers
- Review and update feature limits
- Monitor for script theft attempts
- Update pricing as needed

### Version History
- **v2.0.0**: Modern ES6+, comprehensive trial system, Stripe integration
- **v1.0.0**: Basic HTML/JS frontend

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify API keys are correctly configured
3. Ensure both servers are running
4. Check network connectivity

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using the latest JavaScript features and modern web standards.**