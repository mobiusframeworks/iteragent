# InterTools Pro License Server

Production-ready license management server for InterTools Pro with Stripe integration, JWT tokens, and comprehensive API.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate RSA keys for JWT signing
npm run generate-keys

# Configure environment
cp env.example .env
# Edit .env with your Stripe keys

# Start development server
npm run dev
```

Server will be available at `http://localhost:3000`

## 📋 API Documentation

### Health Check
```bash
GET /health
```

### License Management

#### Activate License (Stripe Checkout)
```bash
POST /v1/license/activate
Content-Type: application/json

{
  "email": "user@example.com",
  "product": "intertools"
}
```

Response:
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_...",
  "message": "Visit the checkout URL to complete subscription with 7-day free trial"
}
```

#### Redeem Trial Token
```bash
POST /v1/license/redeem-trial
Content-Type: application/json

{
  "email": "user@example.com",
  "product": "intertools"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "tokenType": "trial",
  "expiresAt": "2024-01-01T00:00:00.000Z",
  "durationDays": 7,
  "message": "Trial token valid for 7 days. Save this token securely."
}
```

#### Verify Token
```bash
POST /v1/license/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJSUzI1NiIs..."
}
```

Or with Authorization header:
```bash
POST /v1/license/verify
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

Response:
```json
{
  "valid": true,
  "plan": "pro",
  "entitlements": [
    "ai-chat-orchestrator",
    "advanced-analysis",
    "element-extraction"
  ],
  "email": "user@example.com",
  "expiresAt": "2024-01-01T00:00:00.000Z",
  "isExpired": false,
  "trial": true
}
```

#### Get Public Key
```bash
GET /v1/license/public-key
```

Response:
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
  "algorithm": "RS256",
  "usage": "JWT signature verification",
  "issuer": "intertools-pro",
  "audience": "intertools-users"
}
```

### Stripe Webhooks

#### Webhook Endpoint
```bash
POST /v1/webhook/stripe
Content-Type: application/json
Stripe-Signature: t=1703123456,v1=...

# Stripe webhook payload
```

Supported events:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `customer.subscription.updated`

### Usage Tracking

#### Record Usage
```bash
POST /v1/usage/record
Content-Type: application/json

{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "runId": "run_123",
  "feature": "ai-chat-orchestrator",
  "metadata": {
    "duration": 1500,
    "success": true
  }
}
```

#### Get Usage Stats
```bash
GET /v1/usage/stats/user_123?days=30
```

#### List Features
```bash
GET /v1/usage/features
```

### Bridge Integration

#### Start Bridge Session
```bash
POST /v1/bridge/start
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json

{
  "metadata": {
    "source": "chrome-extension",
    "version": "1.0.0"
  }
}
```

#### Stream Logs
```bash
POST /v1/bridge/bridge_123/logs
Content-Type: application/json

{
  "runId": "run_456",
  "logs": [
    {
      "level": "error",
      "message": "API call failed",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## ⚙️ Configuration

### Environment Variables

Create `.env` file:
```env
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
STRIPE_PRICE_ID=price_your_monthly_price_id

# JWT
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ISSUER=intertools-pro
JWT_AUDIENCE=intertools-users

# Rate Limiting
TRIAL_RATE_LIMIT_PER_EMAIL=3
TRIAL_RATE_LIMIT_WINDOW_HOURS=24
API_RATE_LIMIT_PER_MINUTE=100

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5174,chrome-extension://
```

### Stripe Setup

1. **Create Stripe Account**: https://stripe.com
2. **Get API Keys**: Dashboard → Developers → API Keys
3. **Create Product**: 
   - Name: InterTools Pro
   - Price: $30/month
   - Trial: 7 days
4. **Setup Webhooks**: Dashboard → Developers → Webhooks
   - URL: `https://your-domain.com/v1/webhook/stripe`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, etc.

### Development with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/v1/webhook/stripe

# Test webhook
stripe trigger checkout.session.completed
```

## 🔐 Security

### JWT Token Security
- **RS256 algorithm** with 2048-bit keys
- **Private key** for signing (server-side only)
- **Public key** for verification (embedded in clients)
- **Token expiry** enforced
- **JTI claims** for revocation support

### Rate Limiting
- **Trial requests**: 3 per email per 24 hours
- **API requests**: 100 per minute per IP
- **Suspicious activity** logging
- **Abuse detection** and blocking

### Key Management
```bash
# Generate new keys
npm run generate-keys

# Keys are stored in ./keys/
# private.pem - Keep secure, never commit
# public.pem - Safe to distribute

# Set secure permissions
chmod 600 keys/private.pem
chmod 644 keys/public.pem
```

### Production Security Checklist
- [ ] Use HTTPS in production
- [ ] Set secure CORS origins
- [ ] Use production Stripe keys
- [ ] Enable request logging
- [ ] Set up monitoring and alerts
- [ ] Use database instead of in-memory stores
- [ ] Implement proper session management
- [ ] Add admin authentication

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests with Stripe Mock
```bash
# Terminal 1: Start Stripe mock
npm run stripe-mock

# Terminal 2: Run tests
npm test -- --testNamePattern="stripe"
```

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test trial redemption
curl -X POST http://localhost:3000/v1/license/redeem-trial \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","product":"intertools"}'

# Test token verification
curl -X POST http://localhost:3000/v1/license/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"your_token_here"}'

# Test webhook (with Stripe CLI)
stripe trigger checkout.session.completed
```

## 📊 Monitoring

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

### Logging
Logs are written to:
- **Console**: Development mode
- **File**: `./logs/server.log` (rotated)
- **Format**: Structured JSON with timestamps

### Metrics to Monitor
- **Trial redemption rate**
- **Subscription conversion rate**
- **Token verification requests**
- **Failed payment attempts**
- **API response times**
- **Error rates**

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Setup
```bash
export NODE_ENV=production
export PORT=3000
export STRIPE_SECRET_KEY=sk_live_...
export STRIPE_WEBHOOK_SECRET=whsec_...
```

### Database Migration
Replace in-memory stores with persistent storage:

```javascript
// Current (development)
const subscriptions = new Map();
const trialLimitStore = new Map();

// Production (recommended)
const subscriptions = new PostgreSQLStore();
const trialLimitStore = new RedisStore();
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY keys ./keys

EXPOSE 3000
CMD ["npm", "start"]
```

### Health Checks
```bash
# Docker health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## 🔄 Key Rotation

### Generate New Keys
```bash
npm run generate-keys
```

### Rotation Process
1. Generate new key pair
2. Update `JWT_PRIVATE_KEY_PATH` to new private key
3. Keep old public key available for existing tokens
4. Update client applications with new public key
5. Phase out old tokens over 30 days

### Multiple Key Support
```javascript
// JWT header with key ID
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "2024-01-01" // Key ID for rotation
}
```

## 📞 Support

### Debug Information
```bash
# Check server status
curl http://localhost:3000/health

# View logs
tail -f logs/server.log

# Check JWT keys
ls -la keys/

# Test webhook endpoint
curl -X POST http://localhost:3000/v1/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Common Issues

1. **Keys not found**: Run `npm run generate-keys`
2. **Webhook failures**: Check `STRIPE_WEBHOOK_SECRET`
3. **Rate limiting**: Check IP and email limits
4. **CORS errors**: Verify `CORS_ORIGINS` setting

### Contact
- **GitHub Issues**: https://github.com/luvs2spluj/iteragent/issues
- **Email**: support@intertools.com

---

**Built with Express, TypeScript, and Stripe for production reliability.**
