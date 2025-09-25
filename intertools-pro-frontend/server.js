import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5174;

// Serve static files
app.use(express.static(__dirname));

// Serve download files
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 InterTools Pro Frontend v2.0.0 running at http://localhost:${PORT}`);
  console.log('📝 Update YOUR_PUBLISHABLE_KEY and YOUR_STRIPE_PUBLISHABLE_KEY in index.html');
  console.log('🎯 Features: Modern ES6+, 7-day trial, Stripe integration, Clerk auth');
});
