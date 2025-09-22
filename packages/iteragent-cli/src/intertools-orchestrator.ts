import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import axios from 'axios';
import { CursorAIInteractive } from './cursor-ai-interactive';

export interface InterToolsOrchestratorConfig {
  containerName: string;
  agentZeroPort: number;
  orchestratorPort: number;
  enableBigGunMode: boolean;
  enableSpecializedAgents: boolean;
  enableContinuousMonitoring: boolean;
  enableCompactSummaries: boolean;
  enableCursorIntegration: boolean;
  autoStart: boolean;
  skipPrompts: boolean;
  healthCheckInterval: number;
  logAnalysisInterval: number;
  summaryMaxLength: number;
}

export interface SpecializedAgent {
  id: string;
  name: string;
  type: 'console-log-harvester' | 'terminal-log-monitor' | 'cursor-chat-communicator' | 'log-interpreter' | 'code-change-suggester';
  status: 'idle' | 'busy' | 'error';
  capabilities: string[];
  currentTask?: string;
  taskHistory: string[];
  performance: {
    tasksCompleted: number;
    averageExecutionTime: number;
    successRate: number;
    lastActivity: Date;
  };
}

export interface LogAnalysisResult {
  id: string;
  timestamp: Date;
  source: 'console' | 'terminal';
  logType: 'error' | 'warning' | 'info' | 'debug';
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  details: string;
  suggestions: string[];
  codeImplications: string[];
  compactSummary: string; // Max 100 chars for Cursor chat
}

export interface CursorChatMessage {
  id: string;
  timestamp: Date;
  type: 'error-analysis' | 'suggestion' | 'summary' | 'prompt';
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  actionable: boolean;
}

export class InterToolsOrchestrator extends EventEmitter {
  private config: InterToolsOrchestratorConfig;
  private containerProcess: ChildProcess | null = null;
  private running: boolean = false;
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  
  // Specialized agents
  private agents: Map<string, SpecializedAgent> = new Map();
  private logAnalysisResults: LogAnalysisResult[] = [];
  private cursorChatMessages: CursorChatMessage[] = [];
  
  // Monitoring systems
  private consoleLogBuffer: string[] = [];
  private terminalLogBuffer: string[] = [];
  private lastConsoleAnalysis: Date = new Date();
  private lastTerminalAnalysis: Date = new Date();
  
  // Interactive Cursor AI system
  private cursorAIInteractive: CursorAIInteractive;

  constructor(config: Partial<InterToolsOrchestratorConfig> = {}) {
    super();
    this.config = {
      containerName: 'intertools-agent-zero',
      agentZeroPort: 50001,
      orchestratorPort: 50005,
      enableBigGunMode: true,
      enableSpecializedAgents: true,
      enableContinuousMonitoring: true,
      enableCompactSummaries: true,
      enableCursorIntegration: true,
      autoStart: true,
      healthCheckInterval: 30000,
      logAnalysisInterval: 5000,
      summaryMaxLength: 100,
      skipPrompts: true, // Auto-proceed without user confirmation
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

    // Initialize interactive Cursor AI system
    this.cursorAIInteractive = new CursorAIInteractive('.cursor/inbox');

    this.setupExpressRoutes();
    this.setupWebSocketHandlers();
    this.initializeSpecializedAgents();
  }

  /**
   * Start InterTools Orchestrator
   */
  async start(): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Starting InterTools Orchestrator (Big Gun Mode)...'));
      console.log(chalk.cyan('🎯 Specialized agent coordination'));
      console.log(chalk.cyan('📊 Continuous log monitoring'));
      console.log(chalk.cyan('💬 Compact Cursor chat integration'));
      console.log(chalk.cyan('🔍 Intelligent log interpretation'));
      
      // Start Agent Zero container
      await this.startAgentZeroContainer();
      
      // Wait for Agent Zero to be ready
      await this.waitForAgentZero();
      
      // Initialize specialized agents
      await this.initializeSpecializedAgents();
      
      // Start continuous monitoring
      await this.startContinuousMonitoring();
      
      // Start orchestrator API server
      await this.startOrchestratorServer();
      
      this.running = true;
      
      console.log(chalk.green('✅ InterTools Orchestrator started successfully'));
      console.log(chalk.blue(`🤖 Agent Zero: http://localhost:${this.config.agentZeroPort}`));
      console.log(chalk.blue(`🎯 Orchestrator API: http://localhost:${this.config.orchestratorPort}`));
      console.log(chalk.cyan(`👥 Specialized Agents: ${this.agents.size}`));
      
      this.emit('orchestratorStarted', {
        agentZeroUrl: `http://localhost:${this.config.agentZeroPort}`,
        orchestratorUrl: `http://localhost:${this.config.orchestratorPort}`,
        agents: Array.from(this.agents.values())
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start orchestrator:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Stop orchestrator
   */
  async stop(): Promise<void> {
    try {
      console.log(chalk.yellow('⏹️ Stopping InterTools Orchestrator...'));
      
      this.stopContinuousMonitoring();
      await this.stopOrchestratorServer();
      await this.stopAgentZeroContainer();
      
      this.running = false;
      
      console.log(chalk.green('✅ InterTools Orchestrator stopped'));
      this.emit('orchestratorStopped');
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to stop orchestrator:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Initialize specialized agents
   */
  private async initializeSpecializedAgents(): Promise<void> {
    console.log(chalk.blue('👥 Initializing specialized agents...'));
    
    const agentTypes = [
      {
        id: 'console-log-harvester',
        name: 'Console Log Harvester',
        type: 'console-log-harvester' as const,
        capabilities: ['console-monitoring', 'log-capture', 'error-detection', 'pattern-recognition']
      },
      {
        id: 'terminal-log-monitor',
        name: 'Terminal Log Monitor',
        type: 'terminal-log-monitor' as const,
        capabilities: ['terminal-monitoring', 'command-tracking', 'output-analysis', 'process-monitoring']
      },
      {
        id: 'cursor-chat-communicator',
        name: 'Cursor Chat Communicator',
        type: 'cursor-chat-communicator' as const,
        capabilities: ['chat-integration', 'message-formatting', 'priority-routing', 'actionable-suggestions']
      },
      {
        id: 'log-interpreter',
        name: 'Log Interpreter',
        type: 'log-interpreter' as const,
        capabilities: ['log-analysis', 'error-interpretation', 'context-understanding', 'pattern-matching']
      },
      {
        id: 'code-change-suggester',
        name: 'Code Change Suggester',
        type: 'code-change-suggester' as const,
        capabilities: ['code-analysis', 'fix-suggestions', 'implementation-guidance', 'anthropic-integration']
      }
    ];

    for (const agentConfig of agentTypes) {
      const agent: SpecializedAgent = {
        ...agentConfig,
        status: 'idle',
        currentTask: undefined,
        taskHistory: [],
        performance: {
          tasksCompleted: 0,
          averageExecutionTime: 0,
          successRate: 100,
          lastActivity: new Date()
        }
      };

      this.agents.set(agent.id, agent);
    }

    console.log(chalk.green(`✅ Initialized ${this.agents.size} specialized agents`));
    this.emit('agentsInitialized', Array.from(this.agents.values()));
  }

  /**
   * Start continuous monitoring
   */
  private async startContinuousMonitoring(): Promise<void> {
    console.log(chalk.blue('🔍 Starting continuous monitoring...'));
    
    // Console log monitoring
    setInterval(() => {
      this.monitorConsoleLogs();
    }, this.config.logAnalysisInterval);
    
    // Terminal log monitoring
    setInterval(() => {
      this.monitorTerminalLogs();
    }, this.config.logAnalysisInterval);
    
    // Log analysis processing
    setInterval(() => {
      this.processLogAnalysis();
    }, this.config.logAnalysisInterval * 2);
    
    // Cursor chat integration
    setInterval(() => {
      this.sendToCursorChat();
    }, this.config.logAnalysisInterval * 3);
    
    console.log(chalk.green('✅ Continuous monitoring started'));
  }

  /**
   * Monitor console logs
   */
  private async monitorConsoleLogs(): Promise<void> {
    const consoleAgent = this.agents.get('console-log-harvester');
    if (!consoleAgent || consoleAgent.status === 'busy') return;

    consoleAgent.status = 'busy';
    consoleAgent.currentTask = 'console-monitoring';

    try {
      // Simulate console log capture (in real implementation, this would hook into actual console)
      const mockConsoleLogs = [
        'Error: Cannot read property "length" of undefined',
        'Warning: Deprecated API usage detected',
        'Info: Server started on port 3000',
        'Debug: Database connection established'
      ];

      // Add new logs to buffer
      const newLogs = mockConsoleLogs.filter(log => 
        !this.consoleLogBuffer.includes(log)
      );
      this.consoleLogBuffer.push(...newLogs);

      if (newLogs.length > 0) {
        console.log(chalk.blue(`📊 Console Log Harvester: Captured ${newLogs.length} new logs`));
        this.emit('consoleLogsCaptured', { logs: newLogs, agent: consoleAgent });
      }

    } catch (error) {
      console.error(chalk.red('❌ Console log monitoring error:'), error);
    } finally {
      consoleAgent.status = 'idle';
      consoleAgent.currentTask = undefined;
    }
  }

  /**
   * Monitor terminal logs
   */
  private async monitorTerminalLogs(): Promise<void> {
    const terminalAgent = this.agents.get('terminal-log-monitor');
    if (!terminalAgent || terminalAgent.status === 'busy') return;

    terminalAgent.status = 'busy';
    terminalAgent.currentTask = 'terminal-monitoring';

    try {
      // Simulate terminal log capture
      const mockTerminalLogs = [
        'npm run dev: Server running on http://localhost:3000',
        'git push: Pushed 3 commits to main branch',
        'npm install: Added 5 new dependencies',
        'Error: Command failed with exit code 1'
      ];

      const newLogs = mockTerminalLogs.filter(log => 
        !this.terminalLogBuffer.includes(log)
      );
      this.terminalLogBuffer.push(...newLogs);

      if (newLogs.length > 0) {
        console.log(chalk.blue(`📊 Terminal Log Monitor: Captured ${newLogs.length} new logs`));
        this.emit('terminalLogsCaptured', { logs: newLogs, agent: terminalAgent });
      }

    } catch (error) {
      console.error(chalk.red('❌ Terminal log monitoring error:'), error);
    } finally {
      terminalAgent.status = 'idle';
      terminalAgent.currentTask = undefined;
    }
  }

  /**
   * Process log analysis
   */
  private async processLogAnalysis(): Promise<void> {
    const interpreterAgent = this.agents.get('log-interpreter');
    if (!interpreterAgent || interpreterAgent.status === 'busy') return;

    interpreterAgent.status = 'busy';
    interpreterAgent.currentTask = 'log-interpretation';

    try {
      // Analyze console logs
      if (this.consoleLogBuffer.length > 0) {
        const consoleAnalysis = await this.analyzeLogs('console', this.consoleLogBuffer);
        this.logAnalysisResults.push(...consoleAnalysis);
        this.consoleLogBuffer = []; // Clear processed logs
      }

      // Analyze terminal logs
      if (this.terminalLogBuffer.length > 0) {
        const terminalAnalysis = await this.analyzeLogs('terminal', this.terminalLogBuffer);
        this.logAnalysisResults.push(...terminalAnalysis);
        this.terminalLogBuffer = []; // Clear processed logs
      }

      console.log(chalk.blue(`📊 Log Interpreter: Processed ${this.logAnalysisResults.length} total analyses`));
      this.emit('logAnalysisCompleted', { results: this.logAnalysisResults });

      // Create interactive commands if errors are detected
      const hasErrors = this.logAnalysisResults.some(analysis => 
        analysis.logType === 'error' || analysis.severity === 'high' || analysis.severity === 'critical'
      );
      
      if (hasErrors && this.config.enableCursorIntegration) {
        await this.createInteractiveCommandsForErrors();
      }

    } catch (error) {
      console.error(chalk.red('❌ Log analysis error:'), error);
    } finally {
      interpreterAgent.status = 'idle';
      interpreterAgent.currentTask = undefined;
    }
  }

  /**
   * Analyze logs using Agent Zero
   */
  private async analyzeLogs(source: 'console' | 'terminal', logs: string[]): Promise<LogAnalysisResult[]> {
    const analysisPrompt = `
    Analyze these ${source} logs and provide insights:
    
    Logs: ${JSON.stringify(logs, null, 2)}
    
    For each significant log entry, provide:
    1. Log type (error/warning/info/debug)
    2. Severity level (low/medium/high/critical)
    3. Brief summary (max 50 words)
    4. Detailed explanation
    5. Actionable suggestions
    6. Code implications
    7. Compact summary for chat (max 100 characters)
    
    Format as JSON array.
    `;

    try {
      const response = await this.sendToAgentZero(analysisPrompt);
      const analyses = JSON.parse(response);
      
      return analyses.map((analysis: any, index: number) => ({
        id: `analysis_${Date.now()}_${index}`,
        timestamp: new Date(),
        source,
        logType: analysis.logType || 'info',
        severity: analysis.severity || 'low',
        summary: analysis.summary || 'No summary available',
        details: analysis.details || 'No details available',
        suggestions: analysis.suggestions || [],
        codeImplications: analysis.codeImplications || [],
        compactSummary: analysis.compactSummary || analysis.summary?.substring(0, 100) || 'Log analysis'
      }));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to analyze logs:'), error);
      return [];
    }
  }

  /**
   * Send compact summaries to Cursor chat
   */
  private async sendToCursorChat(): Promise<void> {
    const communicatorAgent = this.agents.get('cursor-chat-communicator');
    if (!communicatorAgent || communicatorAgent.status === 'busy') return;

    communicatorAgent.status = 'busy';
    communicatorAgent.currentTask = 'cursor-communication';

    try {
      // Get recent high-priority analyses
      const recentAnalyses = this.logAnalysisResults
        .filter(analysis => 
          analysis.severity === 'high' || analysis.severity === 'critical' ||
          analysis.timestamp > new Date(Date.now() - 60000) // Last minute
        )
        .slice(-5); // Last 5 items

      if (recentAnalyses.length === 0) return;

      for (const analysis of recentAnalyses) {
        const chatMessage: CursorChatMessage = {
          id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: analysis.severity === 'critical' ? 'error-analysis' : 'summary',
          content: analysis.compactSummary,
          priority: analysis.severity,
          source: `${analysis.source}-logs`,
          actionable: analysis.suggestions.length > 0
        };

        this.cursorChatMessages.push(chatMessage);
        
        // Send to Cursor chat
        await this.sendMessageToCursor(chatMessage);
        
        console.log(chalk.blue(`💬 Cursor Chat Communicator: Sent ${analysis.severity} priority message`));
      }

      this.emit('cursorChatMessagesSent', { messages: this.cursorChatMessages.slice(-recentAnalyses.length) });

    } catch (error) {
      console.error(chalk.red('❌ Cursor chat communication error:'), error);
    } finally {
      communicatorAgent.status = 'idle';
      communicatorAgent.currentTask = undefined;
    }
  }

  /**
   * Send message to Cursor chat
   */
  private async sendMessageToCursor(message: CursorChatMessage): Promise<void> {
    const cursorInboxPath = '.cursor/inbox';
    const messageFile = join(cursorInboxPath, `intertools-${message.type}-${message.id}.md`);
    
    const messageContent = `# InterTools ${message.type.charAt(0).toUpperCase() + message.type.slice(1)}

**Timestamp:** ${message.timestamp.toISOString()}
**Priority:** ${message.priority.toUpperCase()}
**Source:** ${message.source}

## ${message.type === 'error-analysis' ? 'Error Analysis' : 'Summary'}
${message.content}

## Actionable
${message.actionable ? 'Yes - See suggestions below' : 'No - Informational only'}

---
*Generated by InterTools Orchestrator*
`;

    try {
      await fs.mkdir(cursorInboxPath, { recursive: true });
      await fs.writeFile(messageFile, messageContent);
      
      console.log(chalk.green(`✅ Message sent to Cursor: ${messageFile}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to send message to Cursor:'), error);
      throw error;
    }
  }

  /**
   * Create interactive commands for Cursor AI when errors are detected
   */
  private async createInteractiveCommandsForErrors(): Promise<void> {
    try {
      // Get recent high-priority errors
      const recentErrors = this.logAnalysisResults
        .filter(analysis => 
          analysis.severity === 'high' || analysis.severity === 'critical' ||
          analysis.logType === 'error'
        )
        .slice(-5); // Last 5 errors

      if (recentErrors.length === 0) return;

      // Create a mock summary for the interactive system
      const mockSummary = {
        serverHealth: 'unhealthy' as const,
        logAnalysis: {
          errors: recentErrors.map(analysis => ({
            message: analysis.summary,
            timestamp: analysis.timestamp,
            category: analysis.logType,
            context: analysis.details
          })),
          warnings: this.logAnalysisResults
            .filter(analysis => analysis.logType === 'warning')
            .slice(-3)
            .map(analysis => ({
              message: analysis.summary,
              timestamp: analysis.timestamp,
              category: analysis.logType
            })),
          summary: {
            totalEntries: this.logAnalysisResults.length,
            errorCount: recentErrors.length,
            warningCount: this.logAnalysisResults.filter(a => a.logType === 'warning').length,
            categories: {}
          }
        },
        criticalIssues: recentErrors
          .filter(analysis => analysis.severity === 'critical')
          .map(analysis => analysis.summary),
        recommendations: recentErrors
          .flatMap(analysis => analysis.suggestions || [])
          .slice(0, 5)
      };

      // Create interactive commands
      await this.cursorAIInteractive.sendInteractiveCommands(mockSummary as any);
      
      console.log(chalk.blue('🤖 Interactive error resolution commands created for Cursor AI'));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to create interactive commands:'), error);
    }
  }

  /**
   * Send message to Agent Zero
   */
  private async sendToAgentZero(message: string): Promise<string> {
    try {
      const response = await axios.post(`http://localhost:${this.config.agentZeroPort}/chat`, {
        message: message,
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data.response || response.data.message || JSON.stringify(response.data);
    } catch (error) {
      console.error(chalk.red('❌ Failed to communicate with Agent Zero:'), error);
      throw error;
    }
  }

  /**
   * Start Agent Zero container
   */
  private async startAgentZeroContainer(): Promise<void> {
    console.log(chalk.blue('🐳 Starting Agent Zero container...'));
    
    // Check if container already exists and is running
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
        '--restart', 'unless-stopped',
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
   * Start orchestrator server
   */
  private async startOrchestratorServer(): Promise<void> {
    console.log(chalk.blue('🌐 Starting orchestrator API server...'));
    
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.orchestratorPort, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log(chalk.green(`✅ Orchestrator server started on port ${this.config.orchestratorPort}`));
          resolve();
        }
      });
    });
  }

  /**
   * Stop orchestrator server
   */
  private async stopOrchestratorServer(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log(chalk.green('✅ Orchestrator server stopped'));
        resolve();
      });
    });
  }

  /**
   * Stop continuous monitoring
   */
  private stopContinuousMonitoring(): void {
    console.log(chalk.yellow('⏹️ Continuous monitoring stopped'));
  }

  /**
   * Setup Express routes
   */
  private setupExpressRoutes(): void {
    this.app.use(express.json());

    // Status API
    this.app.get('/api/status', (req, res) => {
      res.json({
        running: this.running,
        agents: Array.from(this.agents.values()),
        logAnalysisResults: this.logAnalysisResults.length,
        cursorChatMessages: this.cursorChatMessages.length,
        consoleLogBuffer: this.consoleLogBuffer.length,
        terminalLogBuffer: this.terminalLogBuffer.length
      });
    });

    // Agents API
    this.app.get('/api/agents', (req, res) => {
      res.json({
        agents: Array.from(this.agents.values()),
        total: this.agents.size
      });
    });

    // Log analysis API
    this.app.get('/api/logs', (req, res) => {
      res.json({
        analyses: this.logAnalysisResults.slice(-50), // Last 50 analyses
        total: this.logAnalysisResults.length
      });
    });

    // Cursor chat messages API
    this.app.get('/api/cursor-chat', (req, res) => {
      res.json({
        messages: this.cursorChatMessages.slice(-20), // Last 20 messages
        total: this.cursorChatMessages.length
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
        running: this.running,
        agents: Array.from(this.agents.values()),
        logAnalysisResults: this.logAnalysisResults.length,
        cursorChatMessages: this.cursorChatMessages.length
      });
      
      socket.on('disconnect', () => {
        console.log(chalk.yellow(`🔌 Client disconnected: ${socket.id}`));
      });
    });
  }

  /**
   * Get configuration
   */
  getConfig(): InterToolsOrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Get agents
   */
  getAgents(): SpecializedAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get log analysis results
   */
  getLogAnalysisResults(): LogAnalysisResult[] {
    return [...this.logAnalysisResults];
  }

  /**
   * Get cursor chat messages
   */
  getCursorChatMessages(): CursorChatMessage[] {
    return [...this.cursorChatMessages];
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }
}
