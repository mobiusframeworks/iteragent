import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface IterAgentConfig {
  port: number;
  startCommand: string;
  routes: string[];
  logCaptureDuration: number;
  testTimeout: number;
  cursorInboxPath: string;
  outputDir: string;
  headless: boolean;
  takeScreenshots: boolean;
  workingDirectory?: string;
  env?: Record<string, string>;
}

export async function loadConfig(configPath: string): Promise<IterAgentConfig> {
  try {
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    // Apply defaults for missing properties
    const defaultConfig: IterAgentConfig = {
      port: 3000,
      startCommand: 'npm run dev',
      routes: ['/'],
      logCaptureDuration: 5000,
      testTimeout: 30000,
      cursorInboxPath: '.cursor/inbox',
      outputDir: '.iteragent',
      headless: true,
      takeScreenshots: true,
      workingDirectory: process.cwd(),
      env: {}
    };

    return { ...defaultConfig, ...config };
  } catch (error) {
    console.log(chalk.yellow(`⚠️ Config file not found: ${configPath}`));
    console.log(chalk.yellow('Using default configuration...'));
    
    return {
      port: 3000,
      startCommand: 'npm run dev',
      routes: ['/'],
      logCaptureDuration: 5000,
      testTimeout: 30000,
      cursorInboxPath: '.cursor/inbox',
      outputDir: '.iteragent',
      headless: true,
      takeScreenshots: true,
      workingDirectory: process.cwd(),
      env: {}
    };
  }
}

export async function saveConfig(config: IterAgentConfig, configPath: string): Promise<void> {
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`✅ Configuration saved to ${configPath}`));
  } catch (error) {
    console.error(chalk.red('❌ Error saving config:'), error);
    throw error;
  }
}

export function validateConfig(config: IterAgentConfig): string[] {
  const errors: string[] = [];

  if (config.port < 1 || config.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }

  if (!config.startCommand || config.startCommand.trim() === '') {
    errors.push('Start command is required');
  }

  if (!Array.isArray(config.routes) || config.routes.length === 0) {
    errors.push('At least one route is required');
  }

  if (config.logCaptureDuration < 1000) {
    errors.push('Log capture duration must be at least 1000ms');
  }

  if (config.testTimeout < 5000) {
    errors.push('Test timeout must be at least 5000ms');
  }

  return errors;
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist, which is fine
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function findAvailablePort(startPort: number = 3000): Promise<number> {
  const net = await import('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Port is in use, try next one
      findAvailablePort(startPort + 1).then(resolve).catch(reject);
    });
  });
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

export async function waitForFile(filePath: string, timeout: number = 10000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return false;
}

export function parseCommand(command: string): { command: string; args: string[] } {
  const parts = command.trim().split(/\s+/);
  return {
    command: parts[0],
    args: parts.slice(1)
  };
}

export async function checkCommandExists(command: string): Promise<boolean> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

export function getProjectType(): 'node' | 'python' | 'rust' | 'go' | 'unknown' {
  try {
    const fs = require('fs');
    
    if (fs.existsSync('package.json')) {
      return 'node';
    }
    
    if (fs.existsSync('requirements.txt') || fs.existsSync('pyproject.toml')) {
      return 'python';
    }
    
    if (fs.existsSync('Cargo.toml')) {
      return 'rust';
    }
    
    if (fs.existsSync('go.mod')) {
      return 'go';
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function getDefaultStartCommand(projectType: string): Promise<string> {
  switch (projectType) {
    case 'node':
      return 'npm run dev';
    case 'python':
      return 'python -m http.server 8000';
    case 'rust':
      return 'cargo run';
    case 'go':
      return 'go run main.go';
    default:
      return 'npm run dev';
  }
}

export function createProgressBar(total: number): {
  update: (current: number) => void;
  finish: () => void;
} {
  let current = 0;
  
  const update = (newCurrent: number) => {
    current = newCurrent;
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    process.stdout.write(`\r[${bar}] ${percentage}%`);
  };
  
  const finish = () => {
    process.stdout.write('\n');
  };
  
  return { update, finish };
}
