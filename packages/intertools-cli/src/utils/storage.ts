import fs from 'fs';
import path from 'path';
import { config, StoredConfig, defaultConfig } from '../config';

/**
 * Ensure config directory exists
 */
export function ensureConfigDir(): void {
  if (!fs.existsSync(config.configDir)) {
    fs.mkdirSync(config.configDir, { recursive: true });
  }
}

/**
 * Load configuration from file
 */
export function loadConfig(): StoredConfig {
  try {
    ensureConfigDir();
    
    if (!fs.existsSync(config.configFile)) {
      return { ...defaultConfig };
    }

    const data = fs.readFileSync(config.configFile, 'utf8');
    const parsed = JSON.parse(data);
    
    return { ...defaultConfig, ...parsed };
  } catch (error) {
    console.warn('Warning: Failed to load config, using defaults');
    return { ...defaultConfig };
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(newConfig: Partial<StoredConfig>): void {
  try {
    ensureConfigDir();
    
    const currentConfig = loadConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };
    
    // Set secure permissions before writing
    const data = JSON.stringify(updatedConfig, null, 2);
    fs.writeFileSync(config.configFile, data, { mode: 0o600 });
    
    console.log(`✅ Configuration saved to ${config.configFile}`);
  } catch (error) {
    console.error('❌ Failed to save configuration:', error);
    throw error;
  }
}

/**
 * Get stored token from config or environment
 */
export function getStoredToken(): string | null {
  // First check environment variable
  const envToken = process.env.INTERTOOLS_LICENSE;
  if (envToken) {
    return envToken;
  }

  // Then check config file
  const storedConfig = loadConfig();
  return storedConfig.token || null;
}

/**
 * Clear stored configuration
 */
export function clearConfig(): void {
  try {
    if (fs.existsSync(config.configFile)) {
      fs.unlinkSync(config.configFile);
      console.log('✅ Configuration cleared');
    } else {
      console.log('ℹ️  No configuration to clear');
    }
  } catch (error) {
    console.error('❌ Failed to clear configuration:', error);
    throw error;
  }
}

/**
 * Get config file path for display
 */
export function getConfigPath(): string {
  return config.configFile;
}

/**
 * Check if token exists in storage
 */
export function hasStoredToken(): boolean {
  return getStoredToken() !== null;
}
