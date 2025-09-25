import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    priceId: process.env.STRIPE_PRICE_ID!,
  },

  // JWT
  jwt: {
    privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem',
    publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem',
    issuer: process.env.JWT_ISSUER || 'intertools-pro',
    audience: process.env.JWT_AUDIENCE || 'intertools-users',
    algorithm: 'RS256' as const,
  },

  // Rate Limiting
  rateLimiting: {
    trialPerEmail: parseInt(process.env.TRIAL_RATE_LIMIT_PER_EMAIL || '3', 10),
    trialWindowHours: parseInt(process.env.TRIAL_RATE_LIMIT_WINDOW_HOURS || '24', 10),
    apiPerMinute: parseInt(process.env.API_RATE_LIMIT_PER_MINUTE || '100', 10),
  },

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5174')
    .split(',')
    .map(origin => origin.trim()),

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/server.log',
  },

  // Trial Configuration
  trial: {
    durationDays: 7,
    gracePeriodDays: 5,
  },

  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
  },

  // Email (optional)
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@intertools.com',
  },
};

// Validate required configuration
export function validateConfig() {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY', 
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_ID',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Check JWT keys exist
  const privateKeyPath = path.resolve(config.jwt.privateKeyPath);
  const publicKeyPath = path.resolve(config.jwt.publicKeyPath);

  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(`JWT private key not found at: ${privateKeyPath}. Run 'npm run generate-keys' first.`);
  }

  if (!fs.existsSync(publicKeyPath)) {
    throw new Error(`JWT public key not found at: ${publicKeyPath}. Run 'npm run generate-keys' first.`);
  }

  console.log('✅ Configuration validated successfully');
}

// Load JWT keys
export function loadJWTKeys() {
  const privateKeyPath = path.resolve(config.jwt.privateKeyPath);
  const publicKeyPath = path.resolve(config.jwt.publicKeyPath);

  return {
    privateKey: fs.readFileSync(privateKeyPath, 'utf8'),
    publicKey: fs.readFileSync(publicKeyPath, 'utf8'),
  };
}
