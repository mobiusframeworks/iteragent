# 🚀 InterTools - Download Files

Welcome to InterTools! Choose your integration method below.

## 🔌 Browser Extensions

### Chrome Extension
- **File**: `intertools-chrome-extension.zip`
- **Installation**:
  1. Extract the ZIP file
  2. Open Chrome → Extensions → Developer mode ON
  3. Click "Load unpacked"
  4. Select the extracted folder
  5. InterTools will auto-inject on all websites!

### Firefox Extension
- **File**: `intertools-firefox-extension.xpi` (coming soon)
- **Installation**:
  1. Open Firefox → Add-ons → Debug Add-ons
  2. Click "Load Temporary Add-on"
  3. Select the .xpi file
  4. InterTools will auto-inject on all websites!

## 📋 Manual Script

### Free Script
- **File**: `intertools-free.js`
- **Usage**:
  1. Copy the contents of the file
  2. Open any website
  3. Press F12 (Developer Tools)
  4. Go to Console tab
  5. Paste and press Enter
  6. InterTools will appear as a floating chat button (💬)

## 🔗 API Integration

### For Developers
- **Base URL**: `https://your-app.railway.app` (update after Railway deployment)
- **Endpoints**:
  - `GET /api/health` - Health check
  - `POST /api/session/create` - Create session
  - `POST /api/messages` - Send analysis request
  - `GET /free-script.js` - Get latest script

### Example Usage
```javascript
// Create session
const session = await fetch('https://your-app.railway.app/api/session/create', {
  method: 'POST'
}).then(r => r.json());

// Send message
const response = await fetch('https://your-app.railway.app/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: session.sessionId,
    message: 'Analyze this page',
    pageUrl: window.location.href,
    consoleData: []
  })
});
```

## 🚀 Railway Deployment

To deploy your own InterTools backend:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy InterTools to Railway"
   git push origin main
   ```

2. **Deploy to Railway**:
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the Dockerfile

3. **Update URLs**:
   - Replace `https://your-app.railway.app` with your Railway URL
   - Update browser extension `background.js`
   - Update free script endpoints

## 💰 Monetization

### Stripe Integration
- Update `STRIPE_SECRET_KEY` in Railway environment variables
- Update `STRIPE_PUBLISHABLE_KEY` in frontend
- Pro features are automatically protected

### Free vs Pro Features
- **Free**: Basic console analysis, manual script
- **Pro**: Browser extensions, advanced AI, priority support

## 📞 Support

- **Website**: https://intertools.pro
- **GitHub**: https://github.com/your-repo/intertools
- **Email**: support@intertools.pro
- **Documentation**: https://docs.intertools.pro

## 🎉 Success!

Your InterTools integration is ready! Users can now:
- ✅ Install browser extensions for auto-injection
- ✅ Use free scripts on any website
- ✅ Subscribe to Pro features with Stripe
- ✅ Get instant AI assistance and Cursor integration

---

**Made with ❤️ by the InterTools Team**
