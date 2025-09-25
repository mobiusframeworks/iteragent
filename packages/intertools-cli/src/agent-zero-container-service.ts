import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { CursorAIFunctionExecutor } from './cursor-ai-executor';

export interface AgentZeroContainerConfig {
  imageName: string;
  containerName: string;
  port: number;
  enablePersistence: boolean;
  autoStart: boolean;
  healthCheckInterval: number;
  restartPolicy: 'no' | 'on-failure' | 'always' | 'unless-stopped';
  volumeMounts: string[];
  environment: Record<string, string>;
}

export interface AgentZeroContainerStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting' | 'dead' | 'not-found';
  image: string;
  ports: string[];
  createdAt: string;
  startedAt?: string;
  health: 'healthy' | 'unhealthy' | 'starting' | 'unknown';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface AgentZeroContainerManager {
  config: AgentZeroContainerConfig;
  status: AgentZeroContainerStatus | null;
  initialized: boolean;
  lastHealthCheck: Date;
  connectionCount: number;
}

export class AgentZeroContainerService extends EventEmitter {
  private config: AgentZeroContainerConfig;
  private status: AgentZeroContainerStatus | null = null;
  private initialized: boolean = false;
  private lastHealthCheck: Date = new Date();
  private connectionCount: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private cursorAIExecutor: CursorAIFunctionExecutor;

  constructor(config: Partial<AgentZeroContainerConfig> = {}) {
    super();
    this.config = {
      imageName: 'agent0ai/agent-zero:latest',
      containerName: 'iteragent-agent-zero',
      port: 50001,
      enablePersistence: true,
      autoStart: true,
      healthCheckInterval: 30000, // 30 seconds
      restartPolicy: 'unless-stopped',
      volumeMounts: [
        './agent-zero-data:/app/data',
        './agent-zero-logs:/app/logs'
      ],
      environment: {
        'AGENT_ZERO_PORT': '80',
        'AGENT_ZERO_HOST': '0.0.0.0',
        'AGENT_ZERO_LOG_LEVEL': 'info'
      },
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
   * Initialize Agent Zero container service
   */
  async initialize(): Promise<void> {
    try {
      console.log(chalk.blue('🐳 Initializing Agent Zero Container Service...'));
      
      // Check if Docker is available
      await this.checkDockerAvailability();
      
      // Check if container already exists
      const existingContainer = await this.getContainerStatus();
      
      if (existingContainer) {
        console.log(chalk.green('✅ Found existing Agent Zero container'));
        this.status = existingContainer;
        
        if (this.status.status === 'running') {
          console.log(chalk.green('✅ Container is already running'));
          await this.startHealthMonitoring();
        } else if (this.config.autoStart) {
          console.log(chalk.yellow('🔄 Starting existing container...'));
          await this.startContainer();
        }
      } else {
        console.log(chalk.yellow('📥 No existing container found'));
        
        if (this.config.autoStart) {
          console.log(chalk.blue('🚀 Creating and starting new container...'));
          await this.createAndStartContainer();
        }
      }
      
      // Start localhost server for management
      await this.startLocalhostServer();
      
      this.initialized = true;
      console.log(chalk.green('✅ Agent Zero Container Service initialized'));
      
      this.emit('initialized', this.status);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize Agent Zero Container Service:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Start Agent Zero container
   */
  async start(): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Starting Agent Zero container...'));
      
      if (this.status?.status === 'running') {
        console.log(chalk.green('✅ Container is already running'));
        return;
      }
      
      if (this.status) {
        // Start existing container
        await this.startContainer();
      } else {
        // Create and start new container
        await this.createAndStartContainer();
      }
      
      // Start health monitoring
      await this.startHealthMonitoring();
      
      console.log(chalk.green('✅ Agent Zero container started successfully'));
      console.log(chalk.blue(`📊 Dashboard: http://localhost:${this.config.port}`));
      console.log(chalk.blue(`🤖 Agent Zero: http://localhost:${this.config.port}`));
      
      this.emit('containerStarted', this.status);
      
    } catch (error) {
        console.error(chalk.red('❌ Failed to start Agent Zero container:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Stop Agent Zero container
   */
  async stop(): Promise<void> {
    try {
      console.log(chalk.yellow('⏹️ Stopping Agent Zero container...'));
      
      if (!this.status) {
        console.log(chalk.yellow('⚠️ No container to stop'));
        return;
      }
      
      // Stop health monitoring
      this.stopHealthMonitoring();
      
      // Stop container
      await this.stopContainer();
      
      console.log(chalk.green('✅ Agent Zero container stopped successfully'));
      this.emit('containerStopped');
      
    } catch (error) {
        console.error(chalk.red('❌ Failed to stop Agent Zero container:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Restart Agent Zero container
   */
  async restart(): Promise<void> {
    try {
      console.log(chalk.blue('🔄 Restarting Agent Zero container...'));
      
      await this.stop();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      await this.start();
      
      console.log(chalk.green('✅ Agent Zero container restarted successfully'));
      
    } catch (error) {
        console.error(chalk.red('❌ Failed to restart Agent Zero container:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get container status from Docker
   */
  async getContainerStatusFromDocker(): Promise<AgentZeroContainerStatus | null> {
    try {
      const status = await this.getContainerStatus();
      this.status = status;
      return status;
    } catch (error) {
        console.error(chalk.red('❌ Failed to get container status:'), error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Connect to existing container
   */
  async connect(): Promise<void> {
    try {
      console.log(chalk.blue('🔌 Connecting to existing Agent Zero container...'));
      
      const status = await this.getContainerStatusFromDocker();
      
      if (!status) {
        throw new Error('No Agent Zero container found');
      }
      
      if (status.status !== 'running') {
        throw new Error(`Container is not running (status: ${status.status})`);
      }
      
      this.connectionCount++;
      console.log(chalk.green(`✅ Connected to container (${this.connectionCount} connections)`));
      
      // Start health monitoring if not already running
      if (!this.healthCheckInterval) {
        await this.startHealthMonitoring();
      }
      
      this.emit('connected', status);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to connect to container:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Disconnect from container
   */
  async disconnect(): Promise<void> {
    try {
      this.connectionCount = Math.max(0, this.connectionCount - 1);
      console.log(chalk.yellow(`🔌 Disconnected from container (${this.connectionCount} connections remaining)`));
      
      // Stop health monitoring if no connections
      if (this.connectionCount === 0 && this.healthCheckInterval) {
        this.stopHealthMonitoring();
      }
      
      this.emit('disconnected');
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to disconnect from container:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
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
          reject(new Error('Docker is not available. Please install Docker or use the Git-based approach.'));
        }
      });
      
      docker.on('error', (error) => {
        reject(new Error('Docker is not available. Please install Docker or use the Git-based approach.'));
      });
    });
  }

  /**
   * Get container status from Docker
   */
  private async getContainerStatus(): Promise<AgentZeroContainerStatus | null> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', [
        'inspect',
        '--format={{json .}}',
        this.config.containerName
      ], { stdio: 'pipe' });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.stderr?.on('data', (data) => {
        // Container not found is not an error for our purposes
        if (!data.toString().includes('No such container')) {
          console.error(chalk.red('Docker error:'), data.toString());
        }
      });
      
      docker.on('close', (code) => {
        if (code === 0 && output.trim()) {
          try {
            const containerInfo = JSON.parse(output.trim());
            const status: AgentZeroContainerStatus = {
              id: containerInfo.Id,
              name: containerInfo.Name.replace('/', ''),
              status: containerInfo.State.Status,
              image: containerInfo.Config.Image,
              ports: Object.keys(containerInfo.NetworkSettings.Ports || {}),
              createdAt: containerInfo.Created,
              startedAt: containerInfo.State.StartedAt,
              health: containerInfo.State.Health?.Status || 'unknown',
              uptime: containerInfo.State.StartedAt ? 
                Date.now() - new Date(containerInfo.State.StartedAt).getTime() : 0,
              memoryUsage: 0, // Would need additional Docker stats call
              cpuUsage: 0 // Would need additional Docker stats call
            };
            resolve(status);
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(null); // Container not found
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
    console.log(chalk.blue('📥 Pulling Agent Zero Docker image...'));
    await this.pullImage();
    
    console.log(chalk.blue('🐳 Creating Agent Zero container...'));
    await this.createContainer();
    
    console.log(chalk.blue('🚀 Starting Agent Zero container...'));
    await this.startContainer();
  }

  /**
   * Pull Docker image
   */
  private async pullImage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['pull', this.config.imageName], { stdio: 'pipe' });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
        // Show progress
        const lines = output.split('\n');
        const lastLine = lines[lines.length - 2];
        if (lastLine && lastLine.includes('Downloading')) {
          process.stdout.write('\r' + chalk.blue('📥 ') + lastLine);
        }
      });
      
      docker.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('\n✅ Image pulled successfully'));
          resolve();
        } else {
          reject(new Error(`Failed to pull image: ${output}`));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Create Docker container
   */
  private async createContainer(): Promise<void> {
    const dockerArgs = [
      'create',
      '--name', this.config.containerName,
      '--restart', this.config.restartPolicy,
      '-p', `${this.config.port}:80`
    ];
    
    // Add volume mounts
    this.config.volumeMounts.forEach(mount => {
      dockerArgs.push('-v', mount);
    });
    
    // Add environment variables
    Object.entries(this.config.environment).forEach(([key, value]) => {
      dockerArgs.push('-e', `${key}=${value}`);
    });
    
    dockerArgs.push(this.config.imageName);
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', dockerArgs, { stdio: 'pipe' });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Container created successfully'));
          resolve();
        } else {
          reject(new Error(`Failed to create container: ${output}`));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Start Docker container
   */
  private async startContainer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['start', this.config.containerName], { stdio: 'pipe' });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Container started successfully'));
          resolve();
        } else {
          reject(new Error(`Failed to start container: ${output}`));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop Docker container
   */
  private async stopContainer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['stop', this.config.containerName], { stdio: 'pipe' });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.stderr?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Container stopped successfully'));
          resolve();
        } else {
          reject(new Error(`Failed to stop container: ${output}`));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Start health monitoring
   */
  private async startHealthMonitoring(): Promise<void> {
    if (this.healthCheckInterval) {
      return; // Already monitoring
    }
    
    console.log(chalk.blue('🏥 Starting health monitoring...'));
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const status = await this.getContainerStatusFromDocker();
        if (status) {
          this.status = status;
          this.lastHealthCheck = new Date();
          this.emit('healthCheck', status);
          
          if (status.health === 'unhealthy') {
            console.log(chalk.yellow('⚠️ Container health check failed'));
            this.emit('healthWarning', status);
          }
        }
      } catch (error) {
        console.error(chalk.red('❌ Health check failed:'), error instanceof Error ? error.message : String(error));
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
      console.log(chalk.yellow('⏹️ Health monitoring stopped'));
    }
  }

  /**
   * Start localhost server
   */
  private async startLocalhostServer(): Promise<void> {
    console.log(chalk.blue('🌐 Starting localhost server...'));
    
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port + 1, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(chalk.green(`✅ Localhost server started on port ${this.config.port + 1}`));
          resolve();
        }
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
        status: this.status,
        config: this.config,
        connectionCount: this.connectionCount,
        lastHealthCheck: this.lastHealthCheck,
        isInitialized: this.initialized
      });
    });

    this.app.post('/api/container/start', async (req, res) => {
      try {
        await this.start();
        res.json({ success: true, status: this.status });
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.post('/api/container/stop', async (req, res) => {
      try {
        await this.stop();
        res.json({ success: true, status: this.status });
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.post('/api/container/restart', async (req, res) => {
      try {
        await this.restart();
        res.json({ success: true, status: this.status });
      } catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
      }
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
        status: this.status,
        config: this.config,
        connectionCount: this.connectionCount,
        lastHealthCheck: this.lastHealthCheck,
        isInitialized: this.initialized
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
    this.on('healthCheck', (status) => {
      this.io.emit('healthCheck', status);
    });
    
    this.on('statusUpdate', (status) => {
      this.io.emit('statusUpdate', status);
    });
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
    <title>IterAgent - Agent Zero Container Management</title>
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
        .controls {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: #00d4ff;
            color: #000;
        }
        .btn-danger {
            background: #ff4444;
            color: #fff;
        }
        .btn-warning {
            background: #ffaa00;
            color: #000;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .health-excellent { color: #00ff88; }
        .health-good { color: #88ff00; }
        .health-warning { color: #ffaa00; }
        .health-critical { color: #ff4444; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🐳 IterAgent Agent Zero Container</div>
        <div class="status" id="status">🟢 Running</div>
    </div>
    
    <div class="controls">
        <button class="btn btn-primary" onclick="startContainer()">Start Container</button>
        <button class="btn btn-danger" onclick="stopContainer()">Stop Container</button>
        <button class="btn btn-warning" onclick="restartContainer()">Restart Container</button>
    </div>
    
    <div class="grid">
        <div class="card">
            <h3>📊 Container Status</h3>
            <div class="metric">
                <span>Status:</span>
                <span class="metric-value" id="containerStatus">running</span>
            </div>
            <div class="metric">
                <span>Health:</span>
                <span class="metric-value" id="containerHealth">healthy</span>
            </div>
            <div class="metric">
                <span>Image:</span>
                <span class="metric-value" id="containerImage">agent0ai/agent-zero:latest</span>
            </div>
            <div class="metric">
                <span>Uptime:</span>
                <span class="metric-value" id="containerUptime">2h 15m</span>
            </div>
            <div class="metric">
                <span>Connections:</span>
                <span class="metric-value" id="connectionCount">3</span>
            </div>
        </div>
        
        <div class="card">
            <h3>⚙️ Configuration</h3>
            <div class="metric">
                <span>Container Name:</span>
                <span class="metric-value" id="containerName">iteragent-agent-zero</span>
            </div>
            <div class="metric">
                <span>Port:</span>
                <span class="metric-value" id="containerPort">50001</span>
            </div>
            <div class="metric">
                <span>Restart Policy:</span>
                <span class="metric-value" id="restartPolicy">unless-stopped</span>
            </div>
            <div class="metric">
                <span>Persistence:</span>
                <span class="metric-value" id="persistence">enabled</span>
            </div>
            <div class="metric">
                <span>Last Health Check:</span>
                <span class="metric-value" id="lastHealthCheck">2 minutes ago</span>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        
        socket.on('statusUpdate', (data) => {
            updateStatus(data);
        });
        
        socket.on('healthCheck', (status) => {
            updateHealthStatus(status);
        });
        
        function updateStatus(data) {
            if (data.status) {
                document.getElementById('containerStatus').textContent = data.status.status;
                document.getElementById('containerHealth').textContent = data.status.health;
                document.getElementById('containerImage').textContent = data.status.image;
                document.getElementById('containerUptime').textContent = formatUptime(data.status.uptime);
                document.getElementById('connectionCount').textContent = data.connectionCount;
            }
            
            if (data.config) {
                document.getElementById('containerName').textContent = data.config.containerName;
                document.getElementById('containerPort').textContent = data.config.port;
                document.getElementById('restartPolicy').textContent = data.config.restartPolicy;
                document.getElementById('persistence').textContent = data.config.enablePersistence ? 'enabled' : 'disabled';
            }
            
            if (data.lastHealthCheck) {
                document.getElementById('lastHealthCheck').textContent = formatTimeAgo(data.lastHealthCheck);
            }
        }
        
        function updateHealthStatus(status) {
            document.getElementById('containerHealth').textContent = status.health;
            document.getElementById('containerUptime').textContent = formatUptime(status.uptime);
        }
        
        function formatUptime(ms) {
            const hours = Math.floor(ms / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            return \`\${hours}h \${minutes}m\`;
        }
        
        function formatTimeAgo(date) {
            const now = new Date();
            const diff = now - new Date(date);
            const minutes = Math.floor(diff / (1000 * 60));
            return \`\${minutes} minutes ago\`;
        }
        
        async function startContainer() {
            try {
                const response = await fetch('/api/container/start', { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                    console.log('Container started successfully');
                } else {
                    console.error('Failed to start container:', result.error);
                }
            } catch (error) {
                console.error('Error starting container:', error);
            }
        }
        
        async function stopContainer() {
            try {
                const response = await fetch('/api/container/stop', { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                    console.log('Container stopped successfully');
                } else {
                    console.error('Failed to stop container:', result.error);
                }
            } catch (error) {
                console.error('Error stopping container:', error);
            }
        }
        
        async function restartContainer() {
            try {
                const response = await fetch('/api/container/restart', { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                    console.log('Container restarted successfully');
                } else {
                    console.error('Failed to restart container:', result.error);
                }
            } catch (error) {
                console.error('Error restarting container:', error);
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
   * Get configuration
   */
  getConfig(): AgentZeroContainerConfig {
    return { ...this.config };
  }

  /**
   * Get status
   */
  getStatus(): AgentZeroContainerStatus | null {
    return this.status;
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connectionCount;
  }

  /**
   * Check if container is running
   */
  isRunning(): boolean {
    return this.status?.status === 'running';
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
