# InterTools Pro Activation Guide

Complete guide for activating and managing your InterTools Pro license.

## 🚀 Quick Activation

### Option 1: Free Trial (Recommended)
```bash
# Start 7-day free trial (no payment required)
npx intertools activate --trial

# Check your license status
npx intertools status
```

### Option 2: Direct Subscription
```bash
# Subscribe with Stripe checkout
npx intertools activate

# Complete payment in browser
# License automatically activated via webhook
```

## 📋 Step-by-Step Instructions

### 1. Install InterTools CLI
```bash
# Install globally
npm install -g @intertools/cli

# Or use npx (no installation required)
npx intertools --help
```

### 2. Choose Activation Method

#### Free Trial Activation
1. Run activation command:
   ```bash
   npx intertools activate --trial
   ```

2. Enter your email address when prompted

3. Your trial token will be generated immediately:
   ```
   🎉 Trial Activated Successfully!
   
   📋 Trial Details:
      Email: your@email.com
      Plan: Pro (Trial)
      Duration: 7 days
      Expires: Dec 25, 2024 at 3:00 PM
   
   🛠️ Pro Features Unlocked:
      ✅ AI Chat Orchestrator
      ✅ Advanced Code Analysis
      ✅ Element Extraction
      ✅ Performance Monitoring
      ✅ Multi-Agent Coordination
      ✅ Real-time IDE Sync
   ```

#### Subscription Activation
1. Run activation command:
   ```bash
   npx intertools activate
   ```

2. Enter your email address

3. Choose "Subscribe now via Stripe Checkout"

4. Complete payment in browser (opens automatically)

5. Your license will be activated via webhook after payment

### 3. Verify Activation
```bash
npx intertools status
```

Expected output:
```
📊 InterTools Pro License Status

📋 License Information:
   Email: your@email.com
   Plan: Pro
   Status: ACTIVE
   Expires: Jan 25, 2025 at 3:00 PM
   Time Remaining: 29 days, 15 hours

✅ License verified online

🛠️ Available Features:
   AVAILABLE AI Chat Orchestrator
   AVAILABLE Advanced Code Analysis
   AVAILABLE Element Extraction
   AVAILABLE Performance Monitoring
   AVAILABLE Multi-Agent Coordination
   AVAILABLE Real-time IDE Sync
```

## 🔧 Configuration Options

### Environment Variable Setup
```bash
# Set license token as environment variable
export INTERTOOLS_LICENSE="your_jwt_token_here"

# Add to your shell profile for persistence
echo 'export INTERTOOLS_LICENSE="your_token"' >> ~/.bashrc
```

### Project-Specific Setup
```bash
# Add to project .env file
echo "INTERTOOLS_LICENSE=your_token_here" >> .env
```

### Config File Location
Your license is automatically stored at:
- **Linux/macOS**: `~/.config/intertools/config.json`
- **Windows**: `%USERPROFILE%\.config\intertools\config.json`

## 💻 Using Pro Features

### In Your Code
```javascript
const { requirePro, InterTools } = require('intertools');

// Method 1: Direct feature check
async function useAiChat() {
  try {
    await requirePro('ai-chat-orchestrator');
    console.log('🤖 AI Chat Orchestrator available!');
    // Use Pro feature
  } catch (error) {
    console.log('❌ Pro license required');
    console.log(error.message); // Shows activation instructions
  }
}

// Method 2: Check access first
async function conditionalFeature() {
  const intertools = new InterTools();
  
  if (await intertools.hasAccess('advanced-analysis')) {
    // Use Pro feature
    const result = await intertools.analyzeCode(logs);
    return result;
  } else {
    // Fallback to free features
    return basicAnalysis(logs);
  }
}
```

### Available Pro Features
- `ai-chat-orchestrator` - Advanced multi-agent system
- `advanced-analysis` - Deep code analysis and insights
- `element-extraction` - HTML component extraction
- `performance-monitoring` - Advanced metrics and optimization
- `multi-agent-coordination` - Specialized agent coordination
- `real-time-ide-sync` - Auto-sync to Cursor, VS Code, etc.
- `priority-support` - Priority customer support
- `custom-integrations` - Enterprise integrations

## 🔍 Troubleshooting

### Common Issues

#### "No license found"
**Problem**: InterTools can't find your license token

**Solutions**:
```bash
# Check if you have a license
npx intertools status

# Activate if needed
npx intertools activate --trial

# Check environment variable
echo $INTERTOOLS_LICENSE

# Check config file
cat ~/.config/intertools/config.json
```

#### "License expired"
**Problem**: Your trial or subscription has expired

**Solutions**:
```bash
# Check expiry date
npx intertools status

# Reactivate for subscription
npx intertools activate

# Clear old config if needed
npx intertools clear
npx intertools activate
```

#### "Token verification failed"
**Problem**: Token is invalid or server unreachable

**Solutions**:
```bash
# Check server connectivity
curl http://localhost:3000/health

# Verify token format
npx intertools status

# Get new token
npx intertools clear
npx intertools activate --trial
```

#### "Rate limit exceeded"
**Problem**: Too many trial requests from same email

**Solutions**:
- Wait 24 hours before requesting new trial
- Use different email address
- Contact support for legitimate use cases

#### "Feature not available"
**Problem**: Trying to use feature not in your plan

**Solutions**:
```bash
# Check your current plan and features
npx intertools status

# Upgrade to Pro if on free plan
npx intertools activate
```

### Debug Commands
```bash
# Clear all configuration
npx intertools clear

# Check license status with detailed info
npx intertools status

# Test server connection
curl http://localhost:3000/health

# Verify specific token
curl -X POST http://localhost:3000/v1/license/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"your_token_here"}'
```

## 🔄 Managing Your Subscription

### Check Status
```bash
npx intertools status
```

### Upgrade Trial to Paid
```bash
# During or after trial
npx intertools activate
# Choose "Subscribe now"
```

### Cancel Subscription
1. Visit your Stripe billing portal (link provided in confirmation email)
2. Or contact support with your email address
3. Your Pro features will remain active until current period ends

### Update Payment Method
1. Visit Stripe billing portal
2. Update card information
3. No action needed in CLI

## 🌐 Browser Extension Integration

### Chrome Extension Setup
1. Download extension from InterTools Pro dashboard
2. Install in Chrome (Developer mode for now)
3. Extension automatically detects your license
4. Pro features enabled in browser

### Manual Token Setup (if needed)
```javascript
// In browser console on extension popup
chrome.storage.local.set({
  'intertools_token': 'your_jwt_token_here'
});
```

## 📞 Support

### Self-Help Resources
- **Status Check**: `npx intertools status`
- **Documentation**: https://github.com/luvs2spluj/iteragent
- **Troubleshooting**: See sections above

### Contact Support
- **Email**: support@intertools.com
- **GitHub Issues**: https://github.com/luvs2spluj/iteragent/issues
- **Discord**: [InterTools Community](https://discord.gg/intertools)

### Include This Info When Contacting Support
```bash
# Run this and include output
npx intertools status
```

## 💡 Tips & Best Practices

### Development Workflow
1. **Start with trial**: Test all Pro features risk-free
2. **Environment setup**: Use environment variables for CI/CD
3. **Error handling**: Always wrap `requirePro()` in try-catch
4. **Graceful degradation**: Provide fallbacks for free users

### Team Usage
```bash
# Each team member needs their own license
npx intertools activate --trial

# For CI/CD, use service account token
export INTERTOOLS_LICENSE="service_account_token"
```

### Security
- **Never commit tokens** to version control
- **Use environment variables** in production
- **Rotate tokens** if compromised
- **Monitor usage** for unusual activity

---

## 🎉 Success!

You're now ready to use InterTools Pro! Your license gives you access to:

- ✅ **AI Chat Orchestrator** - Advanced multi-agent system
- ✅ **Advanced Analysis** - Deep code insights
- ✅ **Performance Monitoring** - Optimization recommendations
- ✅ **Real-time IDE Sync** - Auto-push to your favorite IDE
- ✅ **Priority Support** - Get help when you need it

**Happy coding with InterTools Pro!** 🚀
