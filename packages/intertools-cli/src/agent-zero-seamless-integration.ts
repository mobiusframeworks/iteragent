import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import axios from 'axios';

export interface AgentZeroIntegrationConfig {
  containerName: string;
  agentZeroPort: number;
  apiPort: number;
  enableSeamlessMode: boolean;
  enableModelSelection: boolean;
  enableWorkflowIntegration: boolean;
  autoStart: boolean;
  healthCheckInterval: number;
  restartPolicy: 'no' | 'on-failure' | 'always' | 'unless-stopped';
}

export interface AgentZeroModel {
  id: string;
  name: string;
  provider: 'agent-zero';
  type: 'chat' | 'completion' | 'embedding';
  description: string;
  capabilities: string[];
  status: 'available' | 'unavailable' | 'loading';
  endpoint: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface WorkflowIntegration {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  actions: string[];
  enabled: boolean;
  lastUsed?: Date;
  usageCount: number;
}

export class AgentZeroSeamlessIntegration extends EventEmitter {
  private config: AgentZeroIntegrationConfig;
  private containerProcess: ChildProcess | null = null;
  private running: boolean = false;
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private availableModels: AgentZeroModel[] = [];
  private workflows: WorkflowIntegration[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<AgentZeroIntegrationConfig> = {}) {
    super();
    this.config = {
      containerName: 'iteragent-agent-zero',
      agentZeroPort: 50001,
      apiPort: 50003,
      enableSeamlessMode: true,
      enableModelSelection: true,
      enableWorkflowIntegration: true,
      autoStart: true,
      healthCheckInterval: 30000,
      restartPolicy: 'unless-stopped',
      ...config
    };

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
    this.initializeModels();
    this.initializeWorkflows();
  }

  /**
   * Start seamless Agent Zero integration
   */
  async start(): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Starting Agent Zero Seamless Integration...'));
      
      // Start Agent Zero container
      await this.startAgentZeroContainer();
      
      // Wait for Agent Zero to be ready
      await this.waitForAgentZero();
      
      // Initialize models
      await this.loadAvailableModels();
      
      // Start API server
      await this.startAPIServer();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.running = true;
      
      console.log(chalk.green('✅ Agent Zero Seamless Integration started'));
      console.log(chalk.blue(`🤖 Agent Zero: http://localhost:${this.config.agentZeroPort}`));
      console.log(chalk.blue(`📡 Integration API: http://localhost:${this.config.apiPort}`));
      console.log(chalk.blue(`🎯 Models available: ${this.availableModels.length}`));
      console.log(chalk.blue(`⚡ Workflows enabled: ${this.workflows.filter(w => w.enabled).length}`));
      
      this.emit('integrationStarted', {
        agentZeroUrl: `http://localhost:${this.config.agentZeroPort}`,
        apiUrl: `http://localhost:${this.config.apiPort}`,
        models: this.availableModels,
        workflows: this.workflows
      });
      
    } catch (error) {
        console.error(chalk.red('❌ Failed to start seamless integration:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Stop seamless integration
   */
  async stop(): Promise<void> {
    try {
      console.log(chalk.yellow('⏹️ Stopping Agent Zero Seamless Integration...'));
      
      this.stopHealthMonitoring();
      await this.stopAPIServer();
      await this.stopAgentZeroContainer();
      
      this.running = false;
      
      console.log(chalk.green('✅ Agent Zero Seamless Integration stopped'));
      this.emit('integrationStopped');
      
    } catch (error) {
        console.error(chalk.red('❌ Failed to stop integration:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get available models for your app
   */
  getAvailableModels(): AgentZeroModel[] {
    return this.availableModels.filter(model => model.status === 'available');
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): AgentZeroModel | null {
    return this.availableModels.find(model => model.id === modelId) || null;
  }

  /**
   * Send chat message to Agent Zero
   */
  async sendChatMessage(message: string, modelId: string = 'agent-zero-chat'): Promise<any> {
    try {
      const model = this.getModel(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const response = await axios.post(`${model.endpoint}/chat`, {
        message: message,
        model: modelId,
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
        console.error(chalk.red('❌ Failed to send chat message:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get completion from Agent Zero
   */
  async getCompletion(prompt: string, modelId: string = 'agent-zero-completion'): Promise<any> {
    try {
      const model = this.getModel(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      const response = await axios.post(`${model.endpoint}/completion`, {
        prompt: prompt,
        model: modelId,
        max_tokens: model.maxTokens || 1000,
        temperature: model.temperature || 0.7
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error(chalk.red('❌ Failed to get completion:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId: string, input: any): Promise<any> {
    try {
      const workflow = this.workflows.find(w => w.id === workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      if (!workflow.enabled) {
        throw new Error(`Workflow ${workflowId} is disabled`);
      }

      // Update usage stats
      workflow.usageCount++;
      workflow.lastUsed = new Date();

      // Execute workflow actions
      const results = [];
      for (const action of workflow.actions) {
        const result = await this.executeAction(action, input);
        results.push(result);
      }

      this.emit('workflowExecuted', { workflowId, input, results });
      return results;

    } catch (error) {
      console.error(chalk.red('❌ Failed to execute workflow:'), error);
      throw error;
    }
  }

  /**
   * Start Agent Zero container
   */
  private async startAgentZeroContainer(): Promise<void> {
    console.log(chalk.blue('🐳 Starting Agent Zero container...'));
    
    // Check if container already exists
    const existingContainer = await this.getContainerStatus();
    
    if (existingContainer && existingContainer.status === 'running') {
      console.log(chalk.green('✅ Agent Zero container already running'));
      return;
    }
    
    if (existingContainer) {
      console.log(chalk.yellow('🔄 Starting existing container...'));
      await this.startExistingContainer();
    } else {
      console.log(chalk.blue('📥 Creating new container...'));
      await this.createAndStartContainer();
    }
  }

  /**
   * Get container status
   */
  private async getContainerStatus(): Promise<any> {
    return new Promise((resolve) => {
      const docker = spawn('docker', ['inspect', this.config.containerName], { stdio: 'pipe' });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0 && output.trim()) {
          try {
            const containerInfo = JSON.parse(output.trim());
            resolve({
              status: containerInfo[0].State.Status,
              id: containerInfo[0].Id,
              name: containerInfo[0].Name.replace('/', '')
            });
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
      
      docker.on('error', () => {
        resolve(null);
      });
    });
  }

  /**
   * Start existing container
   */
  private async startExistingContainer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['start', this.config.containerName], { stdio: 'pipe' });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Container started'));
          resolve();
        } else {
          reject(new Error('Failed to start container'));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Create and start new container
   */
  private async createAndStartContainer(): Promise<void> {
    // Pull image first
    await this.pullAgentZeroImage();
    
    // Create container
    await this.createContainer();
    
    // Start container
    await this.startExistingContainer();
  }

  /**
   * Pull Agent Zero image
   */
  private async pullAgentZeroImage(): Promise<void> {
    console.log(chalk.blue('📥 Pulling Agent Zero image...'));
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['pull', 'agent0ai/agent-zero:latest'], { stdio: 'pipe' });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Image pulled successfully'));
          resolve();
        } else {
          reject(new Error('Failed to pull image'));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Create container
   */
  private async createContainer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', [
        'create',
        '--name', this.config.containerName,
        '--restart', this.config.restartPolicy,
        '-p', `${this.config.agentZeroPort}:80`,
        'agent0ai/agent-zero:latest'
      ], { stdio: 'pipe' });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Container created'));
          resolve();
        } else {
          reject(new Error('Failed to create container'));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop Agent Zero container
   */
  private async stopAgentZeroContainer(): Promise<void> {
    if (!this.containerProcess) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['stop', this.config.containerName], { stdio: 'pipe' });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Container stopped'));
          resolve();
        } else {
          reject(new Error('Failed to stop container'));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Wait for Agent Zero to be ready
   */
  private async waitForAgentZero(): Promise<void> {
    console.log(chalk.blue('⏳ Waiting for Agent Zero to be ready...'));
    
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`http://localhost:${this.config.agentZeroPort}/health`, {
          timeout: 5000
        });
        
        if (response.status === 200) {
          console.log(chalk.green('✅ Agent Zero is ready'));
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Agent Zero failed to start within timeout');
  }

  /**
   * Initialize available models
   */
  private initializeModels(): void {
    this.availableModels = [
      {
        id: 'agent-zero-chat',
        name: 'Agent Zero Chat',
        provider: 'agent-zero',
        type: 'chat',
        description: 'Agent Zero conversational AI for interactive chat',
        capabilities: ['conversation', 'reasoning', 'tool-use', 'memory'],
        status: 'loading',
        endpoint: `http://localhost:${this.config.agentZeroPort}`,
        maxTokens: 4000,
        temperature: 0.7
      },
      {
        id: 'agent-zero-completion',
        name: 'Agent Zero Completion',
        provider: 'agent-zero',
        type: 'completion',
        description: 'Agent Zero for text completion and generation',
        capabilities: ['text-generation', 'code-completion', 'summarization'],
        status: 'loading',
        endpoint: `http://localhost:${this.config.agentZeroPort}`,
        maxTokens: 2000,
        temperature: 0.5
      },
      {
        id: 'agent-zero-code',
        name: 'Agent Zero Code',
        provider: 'agent-zero',
        type: 'completion',
        description: 'Agent Zero specialized for code generation and analysis',
        capabilities: ['code-generation', 'code-analysis', 'debugging', 'refactoring'],
        status: 'loading',
        endpoint: `http://localhost:${this.config.agentZeroPort}`,
        maxTokens: 3000,
        temperature: 0.3
      }
    ];
  }

  /**
   * Initialize workflows
   */
  private initializeWorkflows(): void {
    this.workflows = [
      {
        id: 'iteragent-development',
        name: 'IterAgent Development Workflow',
        description: 'Automated development workflow using Agent Zero',
        triggers: ['file-change', 'test-failure', 'build-error'],
        actions: ['analyze-error', 'suggest-fix', 'generate-code'],
        enabled: true,
        usageCount: 0
      },
      {
        id: 'code-review',
        name: 'Automated Code Review',
        description: 'Agent Zero powered code review and suggestions',
        triggers: ['pull-request', 'commit'],
        actions: ['analyze-code', 'check-best-practices', 'suggest-improvements'],
        enabled: true,
        usageCount: 0
      },
      {
        id: 'documentation',
        name: 'Documentation Generation',
        description: 'Generate and update documentation using Agent Zero',
        triggers: ['code-change', 'manual-trigger'],
        actions: ['analyze-code', 'generate-docs', 'update-readme'],
        enabled: true,
        usageCount: 0
      }
    ];
  }

  /**
   * Load available models from Agent Zero
   */
  private async loadAvailableModels(): Promise<void> {
    try {
      // Update model statuses to available
      this.availableModels.forEach(model => {
        model.status = 'available';
      });
      
      console.log(chalk.green(`✅ Loaded ${this.availableModels.length} models`));
      this.emit('modelsLoaded', this.availableModels);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to load models:'), error);
      this.availableModels.forEach(model => {
        model.status = 'unavailable';
      });
    }
  }

  /**
   * Execute workflow action
   */
  private async executeAction(action: string, input: any): Promise<any> {
    switch (action) {
      case 'analyze-error':
        return await this.sendChatMessage(`Analyze this error: ${JSON.stringify(input)}`);
      case 'suggest-fix':
        return await this.getCompletion(`Suggest a fix for: ${JSON.stringify(input)}`);
      case 'generate-code':
        return await this.getCompletion(`Generate code for: ${JSON.stringify(input)}`, 'agent-zero-code');
      case 'analyze-code':
        return await this.sendChatMessage(`Analyze this code: ${JSON.stringify(input)}`);
      case 'check-best-practices':
        return await this.sendChatMessage(`Check best practices for: ${JSON.stringify(input)}`);
      case 'suggest-improvements':
        return await this.getCompletion(`Suggest improvements for: ${JSON.stringify(input)}`);
      case 'generate-docs':
        return await this.getCompletion(`Generate documentation for: ${JSON.stringify(input)}`);
      case 'update-readme':
        return await this.getCompletion(`Update README for: ${JSON.stringify(input)}`);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Start API server
   */
  private async startAPIServer(): Promise<void> {
    console.log(chalk.blue('🌐 Starting integration API server...'));
    
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.apiPort, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(chalk.green(`✅ API server started on port ${this.config.apiPort}`));
          resolve();
        }
      });
    });
  }

  /**
   * Stop API server
   */
  private async stopAPIServer(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log(chalk.green('✅ API server stopped'));
        resolve();
      });
    });
  }

  /**
   * Setup Express routes
   */
  private setupExpressRoutes(): void {
    this.app.use(express.json());

    // Models API
    this.app.get('/api/models', (req, res) => {
      res.json({
        models: this.getAvailableModels(),
        total: this.getAvailableModels().length
      });
    });

    this.app.get('/api/models/:id', (req, res) => {
      const model = this.getModel(req.params.id);
      if (model) {
        res.json(model);
      } else {
        res.status(404).json({ error: 'Model not found' });
      }
    });

    // Chat API
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { message, modelId } = req.body;
        const result = await this.sendChatMessage(message, modelId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    // Completion API
    this.app.post('/api/completion', async (req, res) => {
      try {
        const { prompt, modelId } = req.body;
        const result = await this.getCompletion(prompt, modelId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    // Workflows API
    this.app.get('/api/workflows', (req, res) => {
      res.json({
        workflows: this.workflows,
        total: this.workflows.length
      });
    });

    this.app.post('/api/workflows/:id/execute', async (req, res) => {
      try {
        const { input } = req.body;
        const result = await this.executeWorkflow(req.params.id, input);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    // Status API
    this.app.get('/api/status', (req, res) => {
      res.json({
        running: this.isRunning,
        agentZeroUrl: `http://localhost:${this.config.agentZeroPort}`,
        models: this.getAvailableModels().length,
        workflows: this.workflows.filter(w => w.enabled).length
      });
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
        running: this.isRunning,
        models: this.getAvailableModels(),
        workflows: this.workflows
      });
      
      socket.on('disconnect', () => {
        console.log(chalk.yellow(`🔌 Client disconnected: ${socket.id}`));
      });
    });
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:${this.config.agentZeroPort}/health`, {
          timeout: 5000
        });
        
        if (response.status !== 200) {
          console.log(chalk.yellow('⚠️ Agent Zero health check failed'));
          this.emit('healthWarning');
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Agent Zero health check failed'));
        this.emit('healthError', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): AgentZeroIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Get workflows
   */
  getWorkflows(): WorkflowIntegration[] {
    return [...this.workflows];
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }
}
