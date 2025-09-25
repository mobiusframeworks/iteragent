# InterTools Pro Paywall System

Complete production-ready paywall implementation for InterTools Pro with 7-day free trial and $30/month subscription.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Tool      │    │  License Server │    │     Stripe      │
│                 │    │                 │    │                 │
│ • Activation    │◄──►│ • JWT Signing   │◄──►│ • Payments      │
│ • Status Check  │    │ • Webhooks      │    │ • Subscriptions │
│ • Token Storage │    │ • Rate Limiting │    │ • Trials        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  InterTools     │    │   Extensions    │
│  Runtime        │    │                 │
│                 │    │ • Browser Ext   │
│ • requirePro()  │    │ • Cursor Bridge │
│ • License Check │    │ • IDE Sync      │
│ • Feature Gates │    │                 │
└─────────────────┘    └─────────────────┘
```

## 📦 Components

### 1. License Server (`apps/server/`)
- **Express + TypeScript** server with JWT signing
- **Stripe integration** for payments and webhooks
- **Rate limiting** and abuse prevention
- **RS256 JWT** tokens with offline verification
- **RESTful API** for license management

### 2. CLI Tool (`packages/intertools-cli/`)
- **Interactive activation** flow with Inquirer.js
- **Trial redemption** without payment info
- **Status checking** with online/offline verification
- **Cross-platform** token storage
- **Browser integration** for Stripe checkout

### 3. Runtime Library (`packages/intertools/`)
- **requirePro()** function for feature gating
- **Offline verification** with built-in public key
- **Graceful degradation** when server unavailable
- **Clear error messages** with activation instructions
- **Token caching** and validation

## 🚀 Quick Start

### Development Setup

```bash
# 1. Clone and install
git clone https://github.com/luvs2spluj/iteragent.git
cd iteragent

# 2. Install dependencies
npm install

# 3. Setup license server
cd apps/server
npm install
npm run generate-keys

# 4. Configure environment
cp env.example .env
# Edit .env with your Stripe keys

# 5. Start server
npm run dev
```

### Stripe Setup

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/v1/webhook/stripe

# Create product and price in Stripe Dashboard:
# - Product: InterTools Pro
# - Price: $30/month with 7-day trial
# - Copy price ID to .env file
```

### Testing Flows

#### Trial Flow
```bash
# Install CLI globally
npm install -g @intertools/cli

# Start trial (no payment required)
npx intertools activate --trial

# Check status
npx intertools status

# Use in your code
node -e "
const { requirePro } = require('intertools');
requirePro('ai-chat-orchestrator').then(() => {
  console.log('✅ Pro feature unlocked!');
});
"
```

#### Paid Flow
```bash
# Start subscription activation
npx intertools activate

# Complete Stripe checkout in browser
# Token automatically generated via webhook

# Verify activation
npx intertools status
```

## 🔧 API Endpoints

### License Management
- `POST /v1/license/activate` - Create Stripe checkout session
- `POST /v1/license/redeem-trial` - Get trial token (rate-limited)
- `POST /v1/license/verify` - Verify token online
- `GET /v1/license/public-key` - Get public key for offline verification

### Webhooks
- `POST /v1/webhook/stripe` - Handle Stripe events
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`

### Usage Tracking
- `POST /v1/usage/record` - Record feature usage
- `GET /v1/usage/stats/:userId` - Get usage statistics
- `GET /v1/usage/features` - List available features

### Bridge Integration
- `POST /v1/bridge/start` - Start bridge session for extensions
- `POST /v1/bridge/:sessionId/logs` - Stream logs through bridge
- `GET /v1/bridge/:sessionId/status` - Check bridge status

## 🔐 Security Features

### JWT Token Design
```javascript
{
  "sub": "user_123",           // User ID
  "email": "user@example.com", // User email
  "plan": "pro",               // Subscription plan
  "entitlements": [            // Feature entitlements
    "ai-chat-orchestrator",
    "advanced-analysis",
    "element-extraction",
    "performance-monitoring"
  ],
  "trial": true,               // Trial flag (if applicable)
  "iat": 1703123456,          // Issued at
  "exp": 1703209856,          // Expires at
  "jti": "jti_unique_id",     // JWT ID for revocation
  "iss": "intertools-pro",    // Issuer
  "aud": "intertools-users"   // Audience
}
```

### Anti-Abuse Measures
- **Rate limiting**: 3 trials per email per 24 hours
- **IP tracking**: Combined email + IP rate limiting
- **Token expiry**: 7-day trial tokens, long-lived subscription tokens
- **Online verification**: Daily online checks for active subscriptions
- **Revocation support**: JTI-based token revocation

### Key Management
- **RS256 algorithm** with 2048-bit keys
- **Private key** for server-side signing
- **Public key** embedded in client for offline verification
- **Key rotation** support with multiple `kid` values
- **Secure storage** with proper file permissions

## 💻 Usage Examples

### Basic Feature Gating
```javascript
const { requirePro, InterTools } = require('intertools');

// Method 1: Direct feature check
async function useAiChat() {
  try {
    await requirePro('ai-chat-orchestrator');
    console.log('🤖 Starting AI Chat...');
    // Pro feature implementation
  } catch (error) {
    console.error(error.message);
    // Shows activation instructions
  }
}

// Method 2: Using InterTools class
const intertools = new InterTools();

async function analyzeCode(logs) {
  if (await intertools.hasAccess('advanced-analysis')) {
    return await intertools.analyzeCode(logs);
  } else {
    // Fallback to basic analysis
    return basicAnalysis(logs);
  }
}

// Method 3: Wrapper function
const aiChatOrchestrator = proOnly('ai-chat-orchestrator', (options) => {
  // This function only runs if user has Pro access
  return startAdvancedAiChat(options);
});
```

### Environment Setup
```bash
# Option 1: Environment variable
export INTERTOOLS_LICENSE="eyJhbGciOiJSUzI1NiIs..."

# Option 2: Config file (automatic)
npx intertools activate

# Option 3: Project .env file
echo "INTERTOOLS_LICENSE=your_token_here" >> .env
```

### Browser Extension Integration
```javascript
// Extension checks token before enabling Pro features
chrome.storage.local.get(['intertools_token'], (result) => {
  if (result.intertools_token) {
    // Verify token and enable Pro features
    fetch('http://localhost:3000/v1/license/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: result.intertools_token })
    }).then(response => response.json())
      .then(data => {
        if (data.valid) {
          enableProFeatures(data.entitlements);
        }
      });
  }
});
```

## 🧪 Testing

### Unit Tests
```bash
# Test server components
cd apps/server
npm test

# Test CLI components  
cd packages/intertools-cli
npm test

# Test runtime library
cd packages/intertools
npm test
```

### Integration Tests
```bash
# Test with Stripe mock
cd apps/server
npm run stripe-mock &
npm test -- --testNamePattern="stripe"

# Test full flow
npm run test:integration
```

### Manual Testing Checklist
- [ ] Trial activation works without payment
- [ ] Stripe checkout creates subscription
- [ ] Webhooks generate valid tokens
- [ ] Token verification works offline
- [ ] Feature gating enforces entitlements
- [ ] Rate limiting prevents abuse
- [ ] CLI provides clear error messages
- [ ] Browser extension integration works

## 🚀 Production Deployment

### Server Deployment
```bash
# Build for production
npm run build

# Set production environment
export NODE_ENV=production
export STRIPE_SECRET_KEY=sk_live_...
export STRIPE_WEBHOOK_SECRET=whsec_...

# Start server
npm start
```

### Database Migration
For production, replace in-memory stores with persistent storage:

```javascript
// Replace maps with database
const subscriptions = new Map(); // → PostgreSQL/MongoDB
const trialLimitStore = new Map(); // → Redis
```

### Monitoring
- **Health checks**: `/health` endpoint
- **Logging**: Winston with log rotation
- **Metrics**: Usage tracking and analytics
- **Alerts**: Failed payments and suspicious activity

## 📋 Business Rules

### Trial Management
- **Duration**: 7 days from activation
- **Limitations**: 3 trials per email per 24 hours
- **Features**: Full Pro access during trial
- **Expiry**: Graceful degradation to free features

### Subscription Lifecycle
- **Trial**: 7 days free, then $30/month
- **Active**: Full Pro feature access
- **Past Due**: 5-day grace period before revocation
- **Cancelled**: Immediate feature revocation

### Feature Entitlements
- **Free**: Console log capture, basic Cursor integration
- **Pro**: AI chat, advanced analysis, performance monitoring, IDE sync

## 🔍 Troubleshooting

### Common Issues
1. **"No license found"**
   - Run `npx intertools activate`
   - Check `~/.config/intertools/config.json`
   - Verify `INTERTOOLS_LICENSE` environment variable

2. **"Token verification failed"**
   - Check server connectivity
   - Verify token hasn't expired
   - Try `npx intertools status`

3. **"Rate limit exceeded"**
   - Wait 24 hours before requesting new trial
   - Use different email address
   - Contact support for legitimate use cases

4. **Stripe webhook failures**
   - Verify webhook secret in `.env`
   - Check webhook endpoint URL
   - Review Stripe dashboard logs

### Debug Commands
```bash
# Check license status
npx intertools status

# Clear configuration
npx intertools clear

# Test server connection
curl http://localhost:3000/health

# Verify token manually
curl -X POST http://localhost:3000/v1/license/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"your_token_here"}'
```

## 📄 License

MIT License - See LICENSE file for details.

---

**Built with ❤️ for the Cursor community**

This paywall system provides a complete, production-ready solution for monetizing InterTools Pro while maintaining an excellent developer experience.
