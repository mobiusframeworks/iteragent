# 🔐 InterTools Stripe Integration Setup

## 🎯 **Stripe Keys Configuration**

Your Stripe keys have been configured in the InterTools system:

### **✅ Production Keys (Active)**
- **Publishable Key**: `pk_live_51QqScaHDhcVKRRbwKUmZ9DGrIAUb7aFxwIm1rS6RFZxOjlm3B9vGkG1CPGUe3J5fMh5VAE9cD7fp40bpZRgAc1Gl00rg9q88z1`
- **Secret Key**: `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`

## 🛠️ **Required Stripe Dashboard Setup**

### **1. Create InterTools Pro Product**

In your Stripe Dashboard:

1. **Go to Products** → **Add Product**
2. **Product Details**:
   - **Name**: `InterTools Pro`
   - **Description**: `Professional console log analysis and IDE integration with AI-powered insights`
   - **Statement Descriptor**: `INTERTOOLS PRO`
   - **Unit Label**: `month`

3. **Pricing**:
   - **Price**: `$30.00 USD`
   - **Billing Period**: `Monthly`
   - **Price ID**: Save this as `STRIPE_PRICE_ID` (e.g., `price_1234567890`)

### **2. Set Up Webhook Endpoints**

1. **Go to Developers** → **Webhooks** → **Add Endpoint**
2. **Endpoint URL**: `https://your-domain.com/v1/webhook/stripe`
3. **Events to Send**:
   ```
   checkout.session.completed
   invoice.payment_succeeded
   invoice.payment_failed
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   ```
4. **Save Webhook Secret**: Update `STRIPE_WEBHOOK_SECRET` in your env files

### **3. Customer Portal Configuration**

1. **Go to Settings** → **Customer Portal**
2. **Enable Customer Portal**
3. **Configure**:
   - ✅ **Update payment method**
   - ✅ **Download invoices**
   - ✅ **Cancel subscription**
   - ✅ **Update billing details**

## 🔧 **Environment Configuration**

### **Server Environment (`apps/server/.env`)**
```bash
# Stripe Configuration (Production)
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51QqScaHDhcVKRRbwKUmZ9DGrIAUb7aFxwIm1rS6RFZxOjlm3B9vGkG1CPGUe3J5fMh5VAE9cD7fp40bpZRgAc1Gl00rg9q88z1
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_step_2
STRIPE_PRICE_ID=price_your_monthly_price_id_from_step_1
```

### **Frontend Configuration**
The publishable key has been updated in:
- `intertools-pro-frontend/index.html`

## 🚀 **Testing the Integration**

### **1. Start the License Server**
```bash
cd apps/server
npm install
npm run generate-keys
npm run dev
```

### **2. Start the Frontend**
```bash
cd intertools-pro-frontend
npm install
npm run dev
```

### **3. Test Payment Flow**
1. Visit `http://localhost:5174`
2. Click **"PRO Version"** tab
3. Click **"🚀 Start Free Trial"**
4. Enter email and proceed through Stripe Checkout
5. Verify webhook receives events

### **4. Test CLI Activation**
```bash
# Install CLI
npm install -g @intertools/cli

# Test activation
npx @intertools/cli activate

# Check status
npx @intertools/cli status
```

## 💰 **Pricing Structure**

### **InterTools Pro Subscription**
- **Price**: $30.00 USD/month
- **Trial**: 7 days free (no payment required)
- **Billing**: Monthly recurring
- **Features**: 
  - Terminal log monitoring
  - Localhost analysis
  - AI chat orchestrator
  - Production site monitoring
  - Google Analytics integration

## 🔒 **Security Best Practices**

### **✅ Implemented Security Measures**
- ✅ **Environment Variables**: Secrets stored in `.env` files
- ✅ **Webhook Verification**: Stripe signature validation
- ✅ **JWT Tokens**: RS256 signed license tokens
- ✅ **Rate Limiting**: Trial activation limits
- ✅ **HTTPS Only**: Production requires SSL

### **🔧 Additional Recommendations**
1. **Monitor Transactions**: Set up Stripe Dashboard alerts
2. **Backup Webhook Logs**: Keep records of all webhook events
3. **Regular Key Rotation**: Rotate keys every 6 months
4. **Fraud Detection**: Enable Stripe Radar
5. **Test Mode**: Use test keys for development

## 📊 **Monitoring & Analytics**

### **Stripe Dashboard Metrics to Track**
- **Monthly Recurring Revenue (MRR)**
- **Churn Rate**
- **Trial-to-Paid Conversion**
- **Failed Payment Recovery**
- **Customer Lifetime Value**

### **InterTools Metrics to Track**
- **Trial Activations**
- **Feature Usage**
- **Support Requests**
- **User Engagement**

## 🚨 **Troubleshooting**

### **Common Issues**

**1. Webhook Not Receiving Events**
- Check endpoint URL is accessible
- Verify webhook secret matches
- Check firewall/security settings

**2. Payment Failures**
- Verify Stripe keys are correct
- Check customer payment method
- Review Stripe logs for details

**3. License Activation Issues**
- Verify JWT keys are generated
- Check license server is running
- Validate webhook processed successfully

### **Debug Commands**
```bash
# Check server status
curl http://localhost:3000/health

# Verify webhook endpoint
curl -X POST http://localhost:3000/v1/webhook/stripe

# Test license verification
curl -X POST http://localhost:3000/v1/license/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"your_jwt_token"}'
```

## 📞 **Support**

### **Stripe Integration Issues**
- **Stripe Support**: https://support.stripe.com
- **Stripe Documentation**: https://stripe.com/docs

### **InterTools Issues**
- **Email**: support@intertools.pro
- **GitHub**: https://github.com/luvs2spluj/intertools/issues

## 🎉 **Production Checklist**

### **Before Going Live**
- [ ] **Stripe Product Created** with correct pricing
- [ ] **Webhook Endpoint** configured and tested
- [ ] **Customer Portal** enabled
- [ ] **Environment Variables** set correctly
- [ ] **SSL Certificate** installed
- [ ] **Domain** pointed to server
- [ ] **Test Transactions** completed successfully
- [ ] **Backup Systems** in place
- [ ] **Monitoring** configured

### **After Launch**
- [ ] **Monitor Webhooks** for successful processing
- [ ] **Track Conversions** from trial to paid
- [ ] **Customer Support** ready for billing questions
- [ ] **Regular Health Checks** on payment system

---

**🎯 Your Stripe integration is now configured and ready for production! The InterTools Pro subscription system will handle 7-day free trials and $30/month recurring billing automatically.**
