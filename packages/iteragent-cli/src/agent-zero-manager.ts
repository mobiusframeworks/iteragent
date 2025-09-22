import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { CursorAIFunctionExecutor } from './cursor-ai-executor';

export interface AgentZeroConfig {
  dockerImage: string;
  containerName: string;
  port: number;
  enableVisualization: boolean;
  enableLogging: boolean;
  enableSettings: boolean;
  logRetentionDays: number;
  maxLogSize: number;
  enableRealTimeUpdates: boolean;
  dashboardPort: number;
  enableWebSocket: boolean;
}

export interface AgentZeroLog {
  id: string;
  timestamp: Date;
  type: 'chat' | 'project' | 'context' | 'execution' | 'performance' | 'error';
  source: 'cursor-ai' | 'agent-zero' | 'iteragent' | 'user' | 'system';
  message: string;
  data?: any;
  projectId?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface AgentZeroProject {
  id: string;
  name: string;
  path: string;
  type: 'web' | 'mobile' | 'trading' | 'desktop' | 'other';
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  lastAccessed: Date;
  context: Record<string, any>;
  logs: AgentZeroLog[];
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    errorRate: number;
  };
}

export interface AgentZeroSession {
  id: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'error';
  chatHistory: AgentZeroLog[];
  context: Record<string, any>;
  performance: {
    totalExecutions: number;
    successRate: number;
    averageResponseTime: number;
    errorCount: number;
  };
}

export interface AgentZeroDashboard {
  projects: AgentZeroProject[];
  sessions: AgentZeroSession[];
  logs: AgentZeroLog[];
  performance: {
    totalProjects: number;
    activeSessions: number;
    totalExecutions: number;
    averageSuccessRate: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  };
  settings: AgentZeroConfig;
}

export class AgentZeroManager extends EventEmitter {
  private config: AgentZeroConfig;
  private dockerProcess: ChildProcess | null = null;
  private isRunning: boolean = false;
  private projects: Map<string, AgentZeroProject> = new Map();
  private sessions: Map<string, AgentZeroSession> = new Map();
  private logs: AgentZeroLog[] = [];
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private cursorAIExecutor: CursorAIFunctionExecutor;

  constructor(config: Partial<AgentZeroConfig> = {}) {
    super();
    this.config = {
      dockerImage: 'agentzero/agentzero:latest',
      containerName: 'iteragent-agentzero',
      port: 8080,
      enableVisualization: true,
      enableLogging: true,
      enableSettings: true,
      logRetentionDays: 30,
      maxLogSize: 1000000, // 1MB
      enableRealTimeUpdates: true,
      dashboardPort: 3000,
      enableWebSocket: true,
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
   * Start Agent Zero mode
   */
  async start(): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Starting Agent Zero mode...'));
      
      // Start Docker container
      await this.startDockerContainer();
      
      // Start localhost server
      await this.startLocalhostServer();
      
      // Initialize logging
      await this.initializeLogging();
      
      // Start real-time updates
      if (this.config.enableRealTimeUpdates) {
        this.startRealTimeUpdates();
      }
      
      this.isRunning = true;
      console.log(chalk.green('✅ Agent Zero mode started successfully'));
      console.log(chalk.blue(`📊 Dashboard available at: http://localhost:${this.config.dashboardPort}`));
      console.log(chalk.blue(`🔌 Agent Zero API available at: http://localhost:${this.config.port}`));
      
      this.emit('agentZeroStarted', this.config);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start Agent Zero mode:'), error);
      throw error;
    }
  }

  /**
   * Stop Agent Zero mode
   */
  async stop(): Promise<void> {
    try {
      console.log(chalk.yellow('⏹️ Stopping Agent Zero mode...'));
      
      // Stop Docker container
      await this.stopDockerContainer();
      
      // Stop localhost server
      await this.stopLocalhostServer();
      
      // Stop real-time updates
      this.stopRealTimeUpdates();
      
      this.isRunning = false;
      console.log(chalk.green('✅ Agent Zero mode stopped successfully'));
      
      this.emit('agentZeroStopped');
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to stop Agent Zero mode:'), error);
      throw error;
    }
  }

  /**
   * Start Docker container
   */
  private async startDockerContainer(): Promise<void> {
    console.log(chalk.blue('🐳 Starting Agent Zero Docker container...'));
    
    const dockerCommand = [
      'run',
      '-d',
      '--name', this.config.containerName,
      '-p', `${this.config.port}:8080`,
      '--restart', 'unless-stopped',
      this.config.dockerImage
    ];

    return new Promise((resolve, reject) => {
      this.dockerProcess = spawn('docker', dockerCommand, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.dockerProcess.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Agent Zero Docker container started'));
          resolve();
        } else {
          reject(new Error(`Docker container failed to start with code ${code}`));
        }
      });

      this.dockerProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop Docker container
   */
  private async stopDockerContainer(): Promise<void> {
    if (this.dockerProcess) {
      console.log(chalk.yellow('🛑 Stopping Agent Zero Docker container...'));
      
      return new Promise((resolve, reject) => {
        const stopCommand = spawn('docker', ['stop', this.config.containerName]);
        
        stopCommand.on('close', (code) => {
          if (code === 0) {
            console.log(chalk.green('✅ Agent Zero Docker container stopped'));
            resolve();
          } else {
            reject(new Error(`Failed to stop Docker container with code ${code}`));
          }
        });
      });
    }
  }

  /**
   * Start localhost server
   */
  private async startLocalhostServer(): Promise<void> {
    console.log(chalk.blue('🌐 Starting localhost server...'));
    
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.dashboardPort, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(chalk.green(`✅ Localhost server started on port ${this.config.dashboardPort}`));
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
    // Serve static files
    this.app.use(express.static(join(__dirname, '../public')));
    this.app.use(express.json());

    // Dashboard route
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML());
    });

    // API routes
    this.app.get('/api/dashboard', (req, res) => {
      const dashboard = this.getDashboard();
      res.json(dashboard);
    });

    this.app.get('/api/projects', (req, res) => {
      const projects = Array.from(this.projects.values());
      res.json(projects);
    });

    this.app.get('/api/sessions', (req, res) => {
      const sessions = Array.from(this.sessions.values());
      res.json(sessions);
    });

    this.app.get('/api/logs', (req, res) => {
      const { type, source, projectId, limit = '100' } = req.query;
      
      let filteredLogs = this.logs;
      
      if (type) {
        filteredLogs = filteredLogs.filter(log => log.type === type);
      }
      
      if (source) {
        filteredLogs = filteredLogs.filter(log => log.source === source);
      }
      
      if (projectId) {
        filteredLogs = filteredLogs.filter(log => log.projectId === projectId);
      }
      
      const limitedLogs = filteredLogs.slice(0, parseInt(limit as string));
      
      res.json(limitedLogs);
    });

    this.app.post('/api/logs', (req, res) => {
      const logData = req.body;
      const log = this.createLog(logData);
      this.addLog(log);
      res.json({ success: true, logId: log.id });
    });

    this.app.get('/api/settings', (req, res) => {
      res.json(this.config);
    });

    this.app.post('/api/settings', (req, res) => {
      const newSettings = req.body;
      this.updateConfig(newSettings);
      res.json({ success: true, config: this.config });
    });

    this.app.post('/api/projects', (req, res) => {
      const projectData = req.body;
      const project = this.createProject(projectData);
      this.addProject(project);
      res.json({ success: true, projectId: project.id });
    });

    this.app.post('/api/sessions', (req, res) => {
      const sessionData = req.body;
      const session = this.createSession(sessionData);
      this.addSession(session);
      res.json({ success: true, sessionId: session.id });
    });
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(chalk.blue(`🔌 Client connected: ${socket.id}`));
      
      // Send initial dashboard data
      socket.emit('dashboardUpdate', this.getDashboard());
      
      // Handle client requests
      socket.on('requestDashboard', () => {
        socket.emit('dashboardUpdate', this.getDashboard());
      });
      
      socket.on('requestLogs', (filters) => {
        const logs = this.getFilteredLogs(filters);
        socket.emit('logsUpdate', logs);
      });
      
      socket.on('requestProjects', () => {
        const projects = Array.from(this.projects.values());
        socket.emit('projectsUpdate', projects);
      });
      
      socket.on('requestSessions', () => {
        const sessions = Array.from(this.sessions.values());
        socket.emit('sessionsUpdate', sessions);
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
    // Listen to Cursor AI executor events
    this.cursorAIExecutor.on('functionExecuted', (func, result) => {
      this.addLog(this.createLog({
        type: 'execution',
        source: 'cursor-ai',
        message: `Function executed: ${func.name}`,
        data: { function: func, result },
        metadata: { success: result.success, duration: result.duration }
      }));
    });

    this.cursorAIExecutor.on('functionFailed', (func, result) => {
      this.addLog(this.createLog({
        type: 'error',
        source: 'cursor-ai',
        message: `Function failed: ${func.name}`,
        data: { function: func, result },
        metadata: { error: result.error }
      }));
    });

    this.cursorAIExecutor.on('speedSuggestions', (suggestions) => {
      this.addLog(this.createLog({
        type: 'performance',
        source: 'iteragent',
        message: `Generated ${suggestions.length} speed optimization suggestions`,
        data: { suggestions },
        metadata: { count: suggestions.length }
      }));
    });

    this.cursorAIExecutor.on('performanceMetrics', (metrics) => {
      this.addLog(this.createLog({
        type: 'performance',
        source: 'iteragent',
        message: 'Performance metrics updated',
        data: { metrics },
        metadata: { 
          cpuUsage: metrics.cpuUsage,
          memoryUsage: metrics.memoryUsage,
          responseTime: metrics.responseTime
        }
      }));
    });
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    setInterval(() => {
      if (this.isRunning) {
        // Update dashboard data
        const dashboard = this.getDashboard();
        this.io.emit('dashboardUpdate', dashboard);
        
        // Update performance metrics
        const performanceLog = this.createLog({
          type: 'performance',
          source: 'iteragent',
          message: 'Real-time performance update',
          data: { timestamp: new Date() }
        });
        this.addLog(performanceLog);
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Stop real-time updates
   */
  private stopRealTimeUpdates(): void {
    // Real-time updates are handled by setInterval, which will stop when the process ends
  }

  /**
   * Initialize logging system
   */
  private async initializeLogging(): Promise<void> {
    console.log(chalk.blue('📝 Initializing logging system...'));
    
    // Create logs directory
    const logsDir = '.iteragent/logs';
    try {
      await fs.mkdir(logsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Load existing logs
    await this.loadExistingLogs();
    
    console.log(chalk.green('✅ Logging system initialized'));
  }

  /**
   * Load existing logs from disk
   */
  private async loadExistingLogs(): Promise<void> {
    try {
      const logsDir = '.iteragent/logs';
      const files = await fs.readdir(logsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = join(logsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const logs = JSON.parse(content);
          this.logs.push(...logs);
        }
      }
      
      console.log(chalk.green(`📚 Loaded ${this.logs.length} existing logs`));
    } catch (error) {
      console.log(chalk.yellow('⚠️ No existing logs found'));
    }
  }

  /**
   * Save logs to disk
   */
  private async saveLogs(): Promise<void> {
    try {
      const logsDir = '.iteragent/logs';
      const timestamp = new Date().toISOString().split('T')[0];
      const filePath = join(logsDir, `logs-${timestamp}.json`);
      
      await fs.writeFile(filePath, JSON.stringify(this.logs, null, 2));
    } catch (error) {
      console.error(chalk.red('❌ Failed to save logs:'), error);
    }
  }

  /**
   * Create a new log entry
   */
  private createLog(logData: Partial<AgentZeroLog>): AgentZeroLog {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'chat',
      source: 'user',
      message: '',
      ...logData
    };
  }

  /**
   * Add a log entry
   */
  private addLog(log: AgentZeroLog): void {
    this.logs.push(log);
    
    // Keep only recent logs (based on retention policy)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.logRetentionDays);
    
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    
    // Save logs periodically
    if (this.logs.length % 100 === 0) {
      this.saveLogs();
    }
    
    // Emit log event
    this.emit('logAdded', log);
    
    // Broadcast to WebSocket clients
    this.io.emit('logAdded', log);
  }

  /**
   * Create a new project
   */
  private createProject(projectData: Partial<AgentZeroProject>): AgentZeroProject {
    return {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Untitled Project',
      path: '',
      type: 'other',
      status: 'active',
      createdAt: new Date(),
      lastAccessed: new Date(),
      context: {},
      logs: [],
      performance: {
        cpuUsage: 0,
        memoryUsage: 0,
        responseTime: 0,
        errorRate: 0
      },
      ...projectData
    };
  }

  /**
   * Add a project
   */
  private addProject(project: AgentZeroProject): void {
    this.projects.set(project.id, project);
    this.emit('projectAdded', project);
    this.io.emit('projectAdded', project);
  }

  /**
   * Create a new session
   */
  private createSession(sessionData: Partial<AgentZeroSession>): AgentZeroSession {
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: '',
      startTime: new Date(),
      status: 'active',
      chatHistory: [],
      context: {},
      performance: {
        totalExecutions: 0,
        successRate: 0,
        averageResponseTime: 0,
        errorCount: 0
      },
      ...sessionData
    };
  }

  /**
   * Add a session
   */
  private addSession(session: AgentZeroSession): void {
    this.sessions.set(session.id, session);
    this.emit('sessionAdded', session);
    this.io.emit('sessionAdded', session);
  }

  /**
   * Get filtered logs
   */
  private getFilteredLogs(filters: any): AgentZeroLog[] {
    let filteredLogs = this.logs;
    
    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type);
    }
    
    if (filters.source) {
      filteredLogs = filteredLogs.filter(log => log.source === filters.source);
    }
    
    if (filters.projectId) {
      filteredLogs = filteredLogs.filter(log => log.projectId === filters.projectId);
    }
    
    if (filters.limit) {
      filteredLogs = filteredLogs.slice(0, parseInt(filters.limit));
    }
    
    return filteredLogs;
  }

  /**
   * Get dashboard data
   */
  private getDashboard(): AgentZeroDashboard {
    const projects = Array.from(this.projects.values());
    const sessions = Array.from(this.sessions.values());
    const activeSessions = sessions.filter(s => s.status === 'active');
    
    const totalExecutions = sessions.reduce((sum, s) => sum + s.performance.totalExecutions, 0);
    const totalSuccesses = sessions.reduce((sum, s) => sum + (s.performance.totalExecutions * s.performance.successRate / 100), 0);
    const averageSuccessRate = totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 0;
    
    // Calculate system health
    let systemHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    if (averageSuccessRate < 50) {
      systemHealth = 'critical';
    } else if (averageSuccessRate < 75) {
      systemHealth = 'warning';
    } else if (averageSuccessRate < 90) {
      systemHealth = 'good';
    }
    
    return {
      projects,
      sessions,
      logs: this.logs.slice(-100), // Last 100 logs
      performance: {
        totalProjects: projects.length,
        activeSessions: activeSessions.length,
        totalExecutions,
        averageSuccessRate,
        systemHealth
      },
      settings: this.config
    };
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
    <title>IterAgent Agent Zero Dashboard</title>
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
        .log-source {
            font-size: 0.9em;
            color: #00d4ff;
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
            <h3>📊 Performance Metrics</h3>
            <div class="metric">
                <span>Total Projects:</span>
                <span class="metric-value" id="totalProjects">0</span>
            </div>
            <div class="metric">
                <span>Active Sessions:</span>
                <span class="metric-value" id="activeSessions">0</span>
            </div>
            <div class="metric">
                <span>Total Executions:</span>
                <span class="metric-value" id="totalExecutions">0</span>
            </div>
            <div class="metric">
                <span>Success Rate:</span>
                <span class="metric-value" id="successRate">0%</span>
            </div>
            <div class="metric">
                <span>System Health:</span>
                <span class="metric-value" id="systemHealth">Excellent</span>
            </div>
        </div>
        
        <div class="card">
            <h3>⚙️ Settings</h3>
            <div class="metric">
                <span>Docker Image:</span>
                <span class="metric-value" id="dockerImage">agentzero/agentzero:latest</span>
            </div>
            <div class="metric">
                <span>Container Port:</span>
                <span class="metric-value" id="containerPort">8080</span>
            </div>
            <div class="metric">
                <span>Dashboard Port:</span>
                <span class="metric-value" id="dashboardPort">3000</span>
            </div>
            <div class="metric">
                <span>Log Retention:</span>
                <span class="metric-value" id="logRetention">30 days</span>
            </div>
            <div class="metric">
                <span>Real-time Updates:</span>
                <span class="metric-value" id="realTimeUpdates">Enabled</span>
            </div>
        </div>
    </div>
    
    <div class="card">
        <h3>📝 Recent Logs</h3>
        <div class="logs" id="logs">
            <div class="log-entry">
                <div class="log-timestamp">Loading...</div>
                <div class="log-message">Initializing dashboard...</div>
                <div class="log-source">system</div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        
        socket.on('dashboardUpdate', (dashboard) => {
            updateDashboard(dashboard);
        });
        
        socket.on('logAdded', (log) => {
            addLogEntry(log);
        });
        
        function updateDashboard(dashboard) {
            document.getElementById('totalProjects').textContent = dashboard.performance.totalProjects;
            document.getElementById('activeSessions').textContent = dashboard.performance.activeSessions;
            document.getElementById('totalExecutions').textContent = dashboard.performance.totalExecutions;
            document.getElementById('successRate').textContent = dashboard.performance.averageSuccessRate.toFixed(1) + '%';
            
            const healthElement = document.getElementById('systemHealth');
            healthElement.textContent = dashboard.performance.systemHealth;
            healthElement.className = 'metric-value health-' + dashboard.performance.systemHealth;
            
            document.getElementById('dockerImage').textContent = dashboard.settings.dockerImage;
            document.getElementById('containerPort').textContent = dashboard.settings.port;
            document.getElementById('dashboardPort').textContent = dashboard.settings.dashboardPort;
            document.getElementById('logRetention').textContent = dashboard.settings.logRetentionDays + ' days';
            document.getElementById('realTimeUpdates').textContent = dashboard.settings.enableRealTimeUpdates ? 'Enabled' : 'Disabled';
        }
        
        function addLogEntry(log) {
            const logsContainer = document.getElementById('logs');
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = \`
                <div class="log-timestamp">\${new Date(log.timestamp).toLocaleString()}</div>
                <div class="log-message">\${log.message}</div>
                <div class="log-source">\${log.source} - \${log.type}</div>
            \`;
            
            logsContainer.insertBefore(logEntry, logsContainer.firstChild);
            
            // Keep only last 50 logs visible
            while (logsContainer.children.length > 50) {
                logsContainer.removeChild(logsContainer.lastChild);
            }
        }
        
        // Request initial data
        socket.emit('requestDashboard');
    </script>
</body>
</html>
    `;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AgentZeroConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
    this.io.emit('configUpdated', this.config);
  }

  /**
   * Get configuration
   */
  getConfig(): AgentZeroConfig {
    return { ...this.config };
  }

  /**
   * Check if Agent Zero is running
   */
  isAgentZeroRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get projects
   */
  getProjects(): AgentZeroProject[] {
    return Array.from(this.projects.values());
  }

  /**
   * Get sessions
   */
  getSessions(): AgentZeroSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get logs
   */
  getLogs(): AgentZeroLog[] {
    return [...this.logs];
  }
}
