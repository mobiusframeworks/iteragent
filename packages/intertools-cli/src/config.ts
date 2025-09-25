import path from 'path';
import os from 'os';

export const config = {
  // Server endpoints
  serverUrl: process.env.INTERTOOLS_SERVER_URL || 'http://localhost:3000',
  
  // Local storage paths
  configDir: path.join(os.homedir(), '.config', 'intertools'),
  configFile: path.join(os.homedir(), '.config', 'intertools', 'config.json'),
  
  // API endpoints
  endpoints: {
    activate: '/v1/license/activate',
    redeemTrial: '/v1/license/redeem-trial',
    verify: '/v1/license/verify',
    publicKey: '/v1/license/public-key'
  },

  // CLI settings
  timeout: 30000, // 30 seconds
  pollInterval: 2000, // 2 seconds for webhook polling
  maxPollAttempts: 30, // 60 seconds total polling time
};

export interface StoredConfig {
  token?: string;
  email?: string;
  plan?: string;
  expiresAt?: string;
  issuedAt?: string;
  serverUrl?: string;
}

export const defaultConfig: StoredConfig = {
  serverUrl: config.serverUrl
};
