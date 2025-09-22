import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { CursorAIFunctionExecutor } from './cursor-ai-executor';

export interface AgentZeroGitConfig {
  repository: string;
  branch: string;
  localPath: string;
  enableDocker: boolean;
  enableVenv: boolean;
  enableLocalInstall: boolean;
  autoUpdate: boolean;
  promptUser: boolean;
  securityMode: 'strict' | 'moderate' | 'permissive';
  port: number;
  enableWebUI: boolean;
  enableAPI: boolean;
  enableLogging: boolean;
  logRetentionDays: number;
}

export interface AgentZeroInstallation {
  id: string;
  type: 'git' | 'docker' | 'venv' | 'local';
  status: 'installing' | 'installed' | 'running' | 'stopped' | 'error';
  path: string;
  version: string;
  installedAt: Date;
  lastUpdated?: Date;
  config: AgentZeroGitConfig;
  process?: ChildProcess;
  logs: string[];
  health: 'healthy' | 'unhealthy' | 'unknown';
}

export interface UserPrompt {
  id: string;
  type: 'installation' | 'settings' | 'security' | 'update';
  title: string;
  message: string;
  options: string[];
  defaultOption: string;
  required: boolean;
  timestamp: Date;
  response?: string;
}

export class AgentZeroGitManager extends EventEmitter {
  private config: AgentZeroGitConfig;
  private installation: AgentZeroInstallation | null = null;
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private cursorAIExecutor: CursorAIFunctionExecutor;
  private userPrompts: UserPrompt[] = [];
  private isInstalling: boolean = false;

  constructor(config: Partial<AgentZeroGitConfig> = {}) {
    super();
    this.config = {
      repository: 'https://github.com/agent0ai/agent-zero.git',
      branch: 'main',
      localPath: '.iteragent/agent-zero',
      enableDocker: false,
      enableVenv: true,
      enableLocalInstall: true,
      autoUpdate: false,
      promptUser: true,
      securityMode: 'moderate',
      port: 50001,
      enableWebUI: true,
      enableAPI: true,
      enableLogging: true,
      logRetentionDays: 30,
      ...config
    };

    this.cursorAIExecutor = new CursorAIFunctionExecutor();
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupExpressRoutes();
    this.setupWebSocketHandlers();
    this.setupEventListeners();
  }

  /**
   * Start Agent Zero automatically without prompts
   */
  async start(): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Starting Agent Zero Git Integration...'));
      console.log(chalk.cyan('📥 Auto-installing Agent Zero (no prompts)'));
      
      // Check if Agent Zero is already installed
      const existingInstallation = await this.checkExistingInstallation();
      
      if (existingInstallation) {
        console.log(chalk.green('✅ Found existing Agent Zero installation'));
        this.installation = existingInstallation;
        
        // Auto-use existing installation
        console.log(chalk.blue('🚀 Starting existing Agent Zero installation...'));
        await this.startExistingInstallation();
      } else {
        console.log(chalk.yellow('📥 No existing Agent Zero installation found'));
        
        // Auto-install with venv (recommended method)
        console.log(chalk.blue('📥 Installing Agent Zero (venv)...'));
        await this.installAgentZero('venv');
      }
      
      // Start localhost server
      await this.startLocalhostServer();
      
      // Start real-time updates
      this.startRealTimeUpdates();
      
      console.log(chalk.green('✅ Agent Zero Git Integration started successfully'));
      console.log(chalk.blue(`📊 Dashboard: http://localhost:${this.config.port}`));
      console.log(chalk.blue(`🤖 Agent Zero: http://localhost:${this.config.port}`));
      
      this.emit('agentZeroStarted', this.installation);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start Agent Zero:'), error);
      throw error;
    }
  }

  /**
   * Stop Agent Zero
   */
  async stop(): Promise<void> {
    try {
      console.log(chalk.yellow('⏹️ Stopping Agent Zero...'));
      
      if (this.installation?.process) {
        this.installation.process.kill();
        this.installation.status = 'stopped';
      }
      
      await this.stopLocalhostServer();
      this.stopRealTimeUpdates();
      
      console.log(chalk.green('✅ Agent Zero stopped successfully'));
      this.emit('agentZeroStopped');
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to stop Agent Zero:'), error);
      throw error;
    }
  }

  /**
   * Check for existing Agent Zero installation
   */
  private async checkExistingInstallation(): Promise<AgentZeroInstallation | null> {
    try {
      const localPath = this.config.localPath;
      
      // Check if directory exists
      try {
        await fs.access(localPath);
      } catch {
        return null;
      }
      
      // Check for different installation types
      const venvPath = join(localPath, 'venv');
      const dockerPath = join(localPath, 'Dockerfile');
      const requirementsPath = join(localPath, 'requirements.txt');
      
      let installationType: 'git' | 'docker' | 'venv' | 'local' = 'git';
      
      if (await this.pathExists(venvPath)) {
        installationType = 'venv';
      } else if (await this.pathExists(dockerPath)) {
        installationType = 'docker';
      } else if (await this.pathExists(requirementsPath)) {
        installationType = 'local';
      }
      
      // Get version info
      const version = await this.getVersion(localPath);
      
      return {
        id: `installation_${Date.now()}`,
        type: installationType,
        status: 'installed',
        path: localPath,
        version: version || 'unknown',
        installedAt: new Date(),
        config: this.config,
        logs: [],
        health: 'unknown'
      };
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Create user prompt
   */
  private async createPrompt(promptData: Partial<UserPrompt>): Promise<UserPrompt> {
    const prompt: UserPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'installation',
      title: 'Agent Zero Setup',
      message: 'Please choose an option:',
      options: ['Yes', 'No'],
      defaultOption: 'Yes',
      required: true,
      timestamp: new Date(),
      ...promptData
    };
    
    this.userPrompts.push(prompt);
    this.emit('promptCreated', prompt);
    
    return prompt;
  }

  /**
   * Show prompt to user
   */
  private async showPrompt(prompt: UserPrompt): Promise<string> {
    console.log(chalk.cyan(`\n🤖 ${prompt.title}`));
    console.log(chalk.white(prompt.message));
    console.log(chalk.gray('─'.repeat(50)));
    
    prompt.options.forEach((option, index) => {
      const isDefault = option === prompt.defaultOption;
      const prefix = isDefault ? '►' : ' ';
      const color = isDefault ? chalk.green.bold : chalk.gray;
      console.log(color(`${prefix} ${index + 1}. ${option}`));
    });
    
    console.log(chalk.gray('─'.repeat(50)));
    
    // In a real implementation, this would use a proper input method
    // For now, we'll simulate with the default option
    const response = prompt.defaultOption;
    
    prompt.response = response;
    this.emit('promptResponded', prompt);
    
    console.log(chalk.green(`✅ Selected: ${response}`));
    
    return response;
  }

  /**
   * Handle installation response
   */
  private async handleInstallationResponse(response: string): Promise<void> {
    if (response.includes('Use existing')) {
      await this.startExistingInstallation();
    } else if (response.includes('Update')) {
      await this.updateAgentZero();
    } else if (response.includes('Reinstall')) {
      await this.reinstallAgentZero();
    } else if (response.includes('Git Clone')) {
      await this.installAgentZero('venv');
    } else if (response.includes('Docker')) {
      await this.installAgentZero('docker');
    } else if (response.includes('Local Python')) {
      await this.installAgentZero('local');
    } else if (response.includes('Skip')) {
      console.log(chalk.yellow('⏭️ Skipping Agent Zero installation'));
    }
  }

  /**
   * Install Agent Zero
   */
  private async installAgentZero(type: 'venv' | 'docker' | 'local'): Promise<void> {
    if (this.isInstalling) {
      console.log(chalk.yellow('⏳ Installation already in progress...'));
      return;
    }
    
    this.isInstalling = true;
    
    try {
      console.log(chalk.blue(`📥 Installing Agent Zero (${type})...`));
      
      this.installation = {
        id: `installation_${Date.now()}`,
        type,
        status: 'installing',
        path: this.config.localPath,
        version: 'installing',
        installedAt: new Date(),
        config: this.config,
        logs: [],
        health: 'unknown'
      };
      
      switch (type) {
        case 'venv':
          await this.installWithVenv();
          break;
        case 'docker':
          await this.installWithDocker();
          break;
        case 'local':
          await this.installLocally();
          break;
      }
      
      this.installation.status = 'installed';
      this.installation.version = await this.getVersion(this.config.localPath) || 'unknown';
      
      console.log(chalk.green('✅ Agent Zero installed successfully'));
      
      // Start the installation
      await this.startInstallation();
      
    } catch (error) {
      console.error(chalk.red('❌ Installation failed:'), error);
      if (this.installation) {
        this.installation.status = 'error';
      }
      throw error;
    } finally {
      this.isInstalling = false;
    }
  }

  /**
   * Install with Python virtual environment
   */
  private async installWithVenv(): Promise<void> {
    console.log(chalk.blue('🐍 Installing with Python virtual environment...'));
    
    // Clone repository
    await this.gitClone();
    
    // Create virtual environment
    await this.createVirtualEnvironment();
    
    // Install dependencies
    await this.installDependencies();
    
    console.log(chalk.green('✅ Virtual environment setup complete'));
  }

  /**
   * Install with Docker
   */
  private async installWithDocker(): Promise<void> {
    console.log(chalk.blue('🐳 Installing with Docker...'));
    
    // Check if Docker is available
    await this.checkDockerAvailability();
    
    // Clone repository
    await this.gitClone();
    
    // Build Docker image
    await this.buildDockerImage();
    
    console.log(chalk.green('✅ Docker setup complete'));
  }

  /**
   * Install locally
   */
  private async installLocally(): Promise<void> {
    console.log(chalk.blue('📦 Installing locally...'));
    
    // Clone repository
    await this.gitClone();
    
    // Install dependencies globally
    await this.installDependenciesGlobal();
    
    console.log(chalk.green('✅ Local installation complete'));
  }

  /**
   * Git clone Agent Zero repository
   */
  private async gitClone(): Promise<void> {
    console.log(chalk.blue(`📥 Cloning ${this.config.repository}...`));
    
    return new Promise((resolve, reject) => {
      const git = spawn('git', [
        'clone',
        '--branch', this.config.branch,
        '--depth', '1',
        this.config.repository,
        this.config.localPath
      ], { stdio: 'pipe' });
      
      let output = '';
      git.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      git.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      git.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Repository cloned successfully'));
          resolve();
        } else {
          reject(new Error(`Git clone failed: ${output}`));
        }
      });
      
      git.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Create Python virtual environment
   */
  private async createVirtualEnvironment(): Promise<void> {
    console.log(chalk.blue('🐍 Creating virtual environment...'));
    
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [
        '-m', 'venv',
        join(this.config.localPath, 'venv')
      ], { stdio: 'pipe' });
      
      python.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Virtual environment created'));
          resolve();
        } else {
          reject(new Error('Failed to create virtual environment'));
        }
      });
      
      python.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Install Python dependencies
   */
  private async installDependencies(): Promise<void> {
    console.log(chalk.blue('📦 Installing Python dependencies...'));
    
    const venvPython = join(this.config.localPath, 'venv', 'bin', 'python');
    const venvPip = join(this.config.localPath, 'venv', 'bin', 'pip');
    
    // Check if pip exists, if not use python -m pip
    const pipCommand = await this.pathExists(venvPip) ? venvPip : 'python3';
    const pipArgs = await this.pathExists(venvPip) ? 
      ['install', '-r', 'requirements.txt'] : 
      ['-m', 'pip', 'install', '-r', 'requirements.txt'];
    
    return new Promise((resolve, reject) => {
      const pip = spawn(pipCommand, pipArgs, { 
        cwd: this.config.localPath,
        stdio: 'pipe' 
      });
      
      let output = '';
      pip.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      pip.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      pip.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Dependencies installed'));
          resolve();
        } else {
          reject(new Error(`Dependency installation failed: ${output}`));
        }
      });
      
      pip.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Install dependencies globally
   */
  private async installDependenciesGlobal(): Promise<void> {
    console.log(chalk.blue('📦 Installing dependencies globally...'));
    
    return new Promise((resolve, reject) => {
      const pip = spawn('pip3', [
        'install',
        '-r', 'requirements.txt'
      ], { 
        cwd: this.config.localPath,
        stdio: 'pipe' 
      });
      
      let output = '';
      pip.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      pip.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      pip.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Dependencies installed globally'));
          resolve();
        } else {
          reject(new Error(`Global dependency installation failed: ${output}`));
        }
      });
      
      pip.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Check Docker availability
   */
  private async checkDockerAvailability(): Promise<void> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['version'], { stdio: 'pipe' });
      
      docker.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Docker is not available. Please install Docker or choose a different installation method.'));
        }
      });
      
      docker.on('error', (error) => {
        reject(new Error('Docker is not available. Please install Docker or choose a different installation method.'));
      });
    });
  }

  /**
   * Build Docker image
   */
  private async buildDockerImage(): Promise<void> {
    console.log(chalk.blue('🐳 Building Docker image...'));
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', [
        'build',
        '-t', 'agent-zero-local',
        '.'
      ], { 
        cwd: this.config.localPath,
        stdio: 'pipe' 
      });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Docker image built'));
          resolve();
        } else {
          reject(new Error(`Docker build failed: ${output}`));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Start existing installation
   */
  private async startExistingInstallation(): Promise<void> {
    if (!this.installation) {
      throw new Error('No installation found');
    }
    
    console.log(chalk.blue('🚀 Starting existing Agent Zero installation...'));
    await this.startInstallation();
  }

  /**
   * Start Agent Zero installation
   */
  private async startInstallation(): Promise<void> {
    if (!this.installation) {
      throw new Error('No installation found');
    }
    
    console.log(chalk.blue('🚀 Starting Agent Zero...'));
    
    this.installation.status = 'running';
    
    switch (this.installation.type) {
      case 'venv':
        await this.startVenvInstallation();
        break;
      case 'docker':
        await this.startDockerInstallation();
        break;
      case 'local':
        await this.startLocalInstallation();
        break;
    }
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    console.log(chalk.green('✅ Agent Zero started successfully'));
  }

  /**
   * Start virtual environment installation
   */
  private async startVenvInstallation(): Promise<void> {
    const venvPython = join(this.installation!.path, 'venv', 'bin', 'python');
    
    return new Promise((resolve, reject) => {
      const process = spawn(venvPython, [
        'main.py',
        '--port', this.config.port.toString()
      ], { 
        cwd: this.installation!.path,
        stdio: 'pipe' 
      });
      
      this.installation!.process = process;
      
      process.stdout?.on('data', (data) => {
        const log = data.toString();
        this.installation!.logs.push(log);
        this.emit('logAdded', log);
      });
      
      process.stderr?.on('data', (data) => {
        const log = data.toString();
        this.installation!.logs.push(log);
        this.emit('logAdded', log);
      });
      
      process.on('close', (code) => {
        this.installation!.status = 'stopped';
        this.emit('agentZeroStopped');
      });
      
      process.on('error', (error) => {
        this.installation!.status = 'error';
        reject(error);
      });
      
      // Wait a bit for startup
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  /**
   * Start Docker installation
   */
  private async startDockerInstallation(): Promise<void> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', [
        'run',
        '-p', `${this.config.port}:80`,
        'agent-zero-local'
      ], { stdio: 'pipe' });
      
      this.installation!.process = docker;
      
      docker.stdout?.on('data', (data) => {
        const log = data.toString();
        this.installation!.logs.push(log);
        this.emit('logAdded', log);
      });
      
      docker.stderr?.on('data', (data) => {
        const log = data.toString();
        this.installation!.logs.push(log);
        this.emit('logAdded', log);
      });
      
      docker.on('close', (code) => {
        this.installation!.status = 'stopped';
        this.emit('agentZeroStopped');
      });
      
      docker.on('error', (error) => {
        this.installation!.status = 'error';
        reject(error);
      });
      
      // Wait a bit for startup
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  /**
   * Start local installation
   */
  private async startLocalInstallation(): Promise<void> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [
        'main.py',
        '--port', this.config.port.toString()
      ], { 
        cwd: this.installation!.path,
        stdio: 'pipe' 
      });
      
      this.installation!.process = python;
      
      python.stdout?.on('data', (data) => {
        const log = data.toString();
        this.installation!.logs.push(log);
        this.emit('logAdded', log);
      });
      
      python.stderr?.on('data', (data) => {
        const log = data.toString();
        this.installation!.logs.push(log);
        this.emit('logAdded', log);
      });
      
      python.on('close', (code) => {
        this.installation!.status = 'stopped';
        this.emit('agentZeroStopped');
      });
      
      python.on('error', (error) => {
        this.installation!.status = 'error';
        reject(error);
      });
      
      // Wait a bit for startup
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      if (this.installation?.status === 'running') {
        try {
          const response = await fetch(`http://localhost:${this.config.port}/health`);
          this.installation.health = response.ok ? 'healthy' : 'unhealthy';
        } catch {
          this.installation.health = 'unhealthy';
        }
        
        this.emit('healthUpdated', this.installation.health);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Update Agent Zero
   */
  private async updateAgentZero(): Promise<void> {
    console.log(chalk.blue('🔄 Updating Agent Zero...'));
    
    if (this.installation?.process) {
      this.installation.process.kill();
    }
    
    // Pull latest changes
    await this.gitPull();
    
    // Reinstall dependencies if needed
    if (this.installation?.type === 'venv') {
      await this.installDependencies();
    }
    
    // Restart
    await this.startInstallation();
    
    console.log(chalk.green('✅ Agent Zero updated successfully'));
  }

  /**
   * Git pull latest changes
   */
  private async gitPull(): Promise<void> {
    return new Promise((resolve, reject) => {
      const git = spawn('git', ['pull'], { 
        cwd: this.config.localPath,
        stdio: 'pipe' 
      });
      
      git.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Git pull failed'));
        }
      });
      
      git.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Reinstall Agent Zero
   */
  private async reinstallAgentZero(): Promise<void> {
    console.log(chalk.blue('🔄 Reinstalling Agent Zero...'));
    
    // Stop existing installation
    if (this.installation?.process) {
      this.installation.process.kill();
    }
    
    // Remove existing installation
    await this.removeInstallation();
    
    // Install fresh
    const installType = this.installation?.type === 'git' ? 'venv' : this.installation?.type || 'venv';
    await this.installAgentZero(installType);
  }

  /**
   * Remove installation
   */
  private async removeInstallation(): Promise<void> {
    try {
      await fs.rm(this.config.localPath, { recursive: true, force: true });
      console.log(chalk.green('✅ Existing installation removed'));
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not remove existing installation'));
    }
  }

  /**
   * Start localhost server
   */
  private async startLocalhostServer(): Promise<void> {
    console.log(chalk.blue('🌐 Starting localhost server...'));
    
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(chalk.green(`✅ Localhost server started on port ${this.config.port}`));
          resolve();
        }
      });
    });
  }

  /**
   * Stop localhost server
   */
  private async stopLocalhostServer(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log(chalk.green('✅ Localhost server stopped'));
        resolve();
      });
    });
  }

  /**
   * Setup Express routes
   */
  private setupExpressRoutes(): void {
    this.app.use(express.static(join(__dirname, '../public')));
    this.app.use(express.json());

    // Dashboard route
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // API routes
    this.app.get('/api/status', (req, res) => {
      res.json({
        installation: this.installation,
        config: this.config,
        prompts: this.userPrompts
      });
    });

    this.app.post('/api/settings', (req, res) => {
      const newSettings = req.body;
      this.updateConfig(newSettings);
      res.json({ success: true, config: this.config });
    });
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(chalk.blue(`🔌 Client connected: ${socket.id}`));
      
      // Send initial data
      socket.emit('statusUpdate', {
        installation: this.installation,
        config: this.config,
        prompts: this.userPrompts
      });
      
      socket.on('disconnect', () => {
        console.log(chalk.yellow(`🔌 Client disconnected: ${socket.id}`));
      });
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.on('logAdded', (log) => {
      this.io.emit('logAdded', log);
    });
    
    this.on('statusUpdate', (status) => {
      this.io.emit('statusUpdate', status);
    });
    
    this.on('promptCreated', (prompt) => {
      this.io.emit('promptCreated', prompt);
    });
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    setInterval(() => {
      this.io.emit('statusUpdate', {
        installation: this.installation,
        config: this.config,
        prompts: this.userPrompts
      });
    }, 5000);
  }

  /**
   * Stop real-time updates
   */
  private stopRealTimeUpdates(): void {
    // Real-time updates are handled by setInterval, which will stop when the process ends
  }

  /**
   * Generate dashboard HTML
   */
  private generateDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IterAgent - Agent Zero Git Integration</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #1a1a1a;
            color: #ffffff;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        .title {
            font-size: 2.5em;
            font-weight: bold;
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .status {
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            background: #00ff88;
            color: #000;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: #2a2a2a;
            border-radius: 15px;
            padding: 25px;
            border: 1px solid #333;
        }
        .card h3 {
            margin-top: 0;
            color: #00d4ff;
            font-size: 1.3em;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 10px;
            background: #333;
            border-radius: 8px;
        }
        .metric-value {
            font-weight: bold;
            color: #00ff88;
        }
        .logs {
            max-height: 400px;
            overflow-y: auto;
            background: #1a1a1a;
            border-radius: 10px;
            padding: 15px;
        }
        .log-entry {
            margin: 10px 0;
            padding: 10px;
            border-radius: 8px;
            border-left: 4px solid #00d4ff;
            background: #2a2a2a;
        }
        .log-timestamp {
            font-size: 0.8em;
            color: #888;
        }
        .log-message {
            margin: 5px 0;
            font-weight: bold;
        }
        .health-excellent { color: #00ff88; }
        .health-good { color: #88ff00; }
        .health-warning { color: #ffaa00; }
        .health-critical { color: #ff4444; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🤖 IterAgent Agent Zero</div>
        <div class="status" id="status">🟢 Running</div>
    </div>
    
    <div class="grid">
        <div class="card">
            <h3>📊 Installation Status</h3>
            <div class="metric">
                <span>Type:</span>
                <span class="metric-value" id="installType">venv</span>
            </div>
            <div class="metric">
                <span>Status:</span>
                <span class="metric-value" id="installStatus">running</span>
            </div>
            <div class="metric">
                <span>Version:</span>
                <span class="metric-value" id="installVersion">latest</span>
            </div>
            <div class="metric">
                <span>Health:</span>
                <span class="metric-value" id="installHealth">healthy</span>
            </div>
            <div class="metric">
                <span>Path:</span>
                <span class="metric-value" id="installPath">.iteragent/agent-zero</span>
            </div>
        </div>
        
        <div class="card">
            <h3>⚙️ Configuration</h3>
            <div class="metric">
                <span>Repository:</span>
                <span class="metric-value" id="repo">agent0ai/agent-zero</span>
            </div>
            <div class="metric">
                <span>Port:</span>
                <span class="metric-value" id="port">50001</span>
            </div>
            <div class="metric">
                <span>Security:</span>
                <span class="metric-value" id="security">moderate</span>
            </div>
            <div class="metric">
                <span>Auto Update:</span>
                <span class="metric-value" id="autoUpdate">disabled</span>
            </div>
            <div class="metric">
                <span>User Prompts:</span>
                <span class="metric-value" id="prompts">enabled</span>
            </div>
        </div>
    </div>
    
    <div class="card">
        <h3>📝 Live Logs</h3>
        <div class="logs" id="logs">
            <div class="log-entry">
                <div class="log-timestamp">Loading...</div>
                <div class="log-message">Initializing Agent Zero Git Integration...</div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        
        socket.on('statusUpdate', (data) => {
            updateStatus(data);
        });
        
        socket.on('logAdded', (log) => {
            addLogEntry(log);
        });
        
        function updateStatus(data) {
            if (data.installation) {
                document.getElementById('installType').textContent = data.installation.type;
                document.getElementById('installStatus').textContent = data.installation.status;
                document.getElementById('installVersion').textContent = data.installation.version;
                document.getElementById('installHealth').textContent = data.installation.health;
                document.getElementById('installPath').textContent = data.installation.path;
            }
            
            if (data.config) {
                document.getElementById('repo').textContent = data.config.repository.split('/').pop();
                document.getElementById('port').textContent = data.config.port;
                document.getElementById('security').textContent = data.config.securityMode;
                document.getElementById('autoUpdate').textContent = data.config.autoUpdate ? 'enabled' : 'disabled';
                document.getElementById('prompts').textContent = data.config.promptUser ? 'enabled' : 'disabled';
            }
        }
        
        function addLogEntry(log) {
            const logsContainer = document.getElementById('logs');
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = \`
                <div class="log-timestamp">\${new Date().toLocaleString()}</div>
                <div class="log-message">\${log}</div>
            \`;
            
            logsContainer.insertBefore(logEntry, logsContainer.firstChild);
            
            // Keep only last 50 logs visible
            while (logsContainer.children.length > 50) {
                logsContainer.removeChild(logsContainer.lastChild);
            }
        }
        
        // Request initial data
        socket.emit('requestStatus');
    </script>
</body>
</html>
    `;
  }

  /**
   * Utility methods
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async getVersion(path: string): Promise<string | null> {
    try {
      const packageJsonPath = join(path, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      return packageJson.version || null;
    } catch {
      try {
        const versionPath = join(path, 'version.txt');
        return await fs.readFile(versionPath, 'utf8');
      } catch {
        return null;
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AgentZeroGitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get configuration
   */
  getConfig(): AgentZeroGitConfig {
    return { ...this.config };
  }

  /**
   * Get installation
   */
  getInstallation(): AgentZeroInstallation | null {
    return this.installation;
  }

  /**
   * Get user prompts
   */
  getUserPrompts(): UserPrompt[] {
    return [...this.userPrompts];
  }

  /**
   * Check if Agent Zero is running
   */
  isRunning(): boolean {
    return this.installation?.status === 'running';
  }
}
