# 🚀 InterTools Railway Deployment Guide

This guide shows how to deploy InterTools to Railway for automatic cloud hosting with browser extension support.

## 🎯 Overview

- **Backend**: Node.js/Express API server with Socket.IO
- **Database**: In-memory (can be upgraded to PostgreSQL)
- **Frontend**: Chrome/Firefox browser extensions
- **Deployment**: Railway with Docker
- **Features**: Auto-scaling, HTTPS, custom domains

## 📋 Prerequisites

1. [Railway account](https://railway.app) (free tier available)
2. [GitHub account](https://github.com) for repository
3. [Node.js 18+](https://nodejs.org) for local development

## 🔧 Railway Deployment Steps

### 1. Push to GitHub

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial InterTools Railway deployment"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/intertools-railway
git push -u origin main
```

### 2. Deploy to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your InterTools repository
5. Railway will automatically detect the Dockerfile

### 3. Configure Environment Variables

In Railway dashboard, go to your project → Variables:

```env
NODE_ENV=production
PORT=3001
```

Optional variables:
```env
# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db

# Stripe (for Pro features)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Custom Domain (Optional)

1. In Railway dashboard: Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate is automatically provided

## 🌐 Browser Extension Setup

### Chrome Extension

1. Open Chrome → Extensions → Developer mode
2. Click "Load unpacked"
3. Select `browser-extensions/chrome/` folder
4. Update `background.js` with your Railway URL:

```javascript
const INTERTOOLS_API = 'https://your-app.railway.app';
```

### Firefox Extension

1. Open Firefox → Add-ons → Debug Add-ons
2. Click "Load Temporary Add-on"
3. Select `browser-extensions/firefox/manifest.json`
4. Update API endpoint in background script

## 🔄 Automatic Updates

Railway automatically redeploys when you push to your GitHub repository:

```bash
# Make changes to your code
git add .
git commit -m "Update InterTools features"
git push origin main
# Railway will automatically redeploy
```

## 📊 Monitoring & Logs

### Railway Dashboard
- View logs: Project → Deployments → View logs
- Monitor metrics: CPU, memory, network usage
- Set up alerts for downtime

### Health Checks
Your app includes a health endpoint:
```
GET https://your-app.railway.app/api/health
```

Response:
```json
{
  "success": true,
  "status": "running",
  "uptime": 3600,
  "messages": 42,
  "activeSessions": 5
}
```

## 💰 Scaling & Pricing

### Railway Pricing
- **Hobby Plan**: $5/month, includes:
  - 512MB RAM
  - 1GB storage
  - Custom domains
  - Automatic HTTPS

- **Pro Plan**: $20/month, includes:
  - 8GB RAM
  - 100GB storage
  - Priority support
  - Advanced metrics

### Auto-scaling
Railway automatically scales based on traffic:
- CPU and memory scaling
- Geographic distribution
- Load balancing

## 🔒 Security Features

### Built-in Security
- HTTPS by default
- DDoS protection
- Rate limiting
- CORS configuration
- Helmet.js security headers

### Environment Variables
All sensitive data stored as encrypted environment variables:
- API keys
- Database credentials
- JWT secrets

## 🚀 Production Checklist

- [ ] Repository pushed to GitHub
- [ ] Railway project deployed successfully
- [ ] Environment variables configured
- [ ] Custom domain added (optional)
- [ ] Browser extensions updated with production URL
- [ ] Health check endpoint responding
- [ ] Rate limiting configured
- [ ] CORS origins set correctly
- [ ] SSL certificate active
- [ ] Monitoring alerts set up

## 🐛 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Check Railway build logs
railway logs --deployment
```

**Extension Not Connecting**
1. Check CORS settings in server
2. Verify API endpoint URL in extension
3. Check browser console for errors

**High Memory Usage**
1. Monitor Railway metrics
2. Optimize message storage (use database)
3. Implement message cleanup

### Debug Commands

```bash
# Local development
cd railway-backend
npm install
npm run dev

# Test API endpoints
curl https://your-app.railway.app/api/health
curl https://your-app.railway.app/free-script.js

# Check extension
chrome://extensions/ → InterTools → Inspect views: popup
```

## 📚 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/free-script.js` | Free InterTools script |
| GET | `/pro-script.js` | Pro InterTools script |
| POST | `/api/session/create` | Create user session |
| POST | `/api/session/validate` | Validate session |
| POST | `/api/trial/activate` | Start free trial |
| POST | `/api/messages` | Send chat message |
| GET | `/api/messages/:sessionId` | Get messages |
| GET | `/api/analytics` | Usage analytics |

### WebSocket Events

| Event | Description |
|-------|-------------|
| `connection` | Client connected |
| `joinSession` | Join session room |
| `newMessage` | New chat message |
| `disconnect` | Client disconnected |

## 🎉 Success!

Your InterTools backend is now running on Railway with:

✅ Automatic HTTPS and custom domains  
✅ Auto-scaling based on traffic  
✅ Browser extension support  
✅ Real-time WebSocket communication  
✅ Session management and analytics  
✅ Rate limiting and security  
✅ Automatic deployments from GitHub  

Users can now install your browser extension and get instant AI assistance on any website!

## 🔗 Next Steps

1. **Publish Extension**: Submit to Chrome Web Store and Firefox Add-ons
2. **Add Database**: Upgrade to PostgreSQL for persistence
3. **Pro Features**: Implement Stripe payments and advanced features
4. **Analytics**: Add detailed usage tracking
5. **Mobile**: Create mobile apps with WebView integration

---

**Need Help?** Check the [Railway Documentation](https://docs.railway.app) or [open an issue](https://github.com/your-repo/issues).
