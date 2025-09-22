import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import axios from 'axios';

export interface AgentZeroOrchestratorConfig {
  containerName: string;
  agentZeroPort: number;
  orchestratorPort: number;
  enableBigGunMode: boolean;
  enableTaskDecomposition: boolean;
  enableAgentCoordination: boolean;
  enableCursorMonitoring: boolean;
  enableLogAnalysis: boolean;
  enableWorkflowEnhancement: boolean;
  autoStart: boolean;
  healthCheckInterval: number;
  taskTimeout: number;
  maxConcurrentTasks: number;
}

export interface AgentTask {
  id: string;
  type: 'cursor-monitor' | 'log-analysis' | 'workflow-enhancement' | 'task-decomposition' | 'problem-solving';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  description: string;
  input: any;
  output?: any;
  assignedAgent?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  timeout?: number;
  retryCount: number;
  maxRetries: number;
}

export interface SpecializedAgent {
  id: string;
  name: string;
  type: 'cursor-monitor' | 'log-analyzer' | 'workflow-enhancer' | 'task-decomposer' | 'problem-solver';
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

export interface CursorChatMonitor {
  isMonitoring: boolean;
  lastActivity: Date;
  frozenThreshold: number; // milliseconds
  promptTemplates: string[];
  autoPromptEnabled: boolean;
  chatHistory: Array<{
    timestamp: Date;
    message: string;
    type: 'user' | 'assistant' | 'system';
  }>;
}

export interface WorkflowEnhancement {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  enhancements: string[];
  efficiencyGain: number; // percentage
  enabled: boolean;
  usageCount: number;
  lastUsed?: Date;
}

export class AgentZeroOrchestrator extends EventEmitter {
  private config: AgentZeroOrchestratorConfig;
  private containerProcess: ChildProcess | null = null;
  private running: boolean = false;
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  
  // Agent system
  private agents: Map<string, SpecializedAgent> = new Map();
  private taskQueue: AgentTask[] = [];
  private activeTasks: Map<string, AgentTask> = new Map();
  private completedTasks: AgentTask[] = [];
  
  // Monitoring systems
  private cursorMonitor: CursorChatMonitor;
  private logAnalyzer: any;
  private workflowEnhancer: any;
  
  // Enhancement system
  private workflowEnhancements: WorkflowEnhancement[] = [];
  private efficiencyMetrics: {
    tasksPerMinute: number;
    averageTaskTime: number;
    successRate: number;
    efficiencyGain: number;
  } = {
    tasksPerMinute: 0,
    averageTaskTime: 0,
    successRate: 0,
    efficiencyGain: 0
  };

  constructor(config: Partial<AgentZeroOrchestratorConfig> = {}) {
    super();
    this.config = {
      containerName: 'iteragent-agent-zero',
      agentZeroPort: 50001,
      orchestratorPort: 50004,
      enableBigGunMode: true,
      enableTaskDecomposition: true,
      enableAgentCoordination: true,
      enableCursorMonitoring: true,
      enableLogAnalysis: true,
      enableWorkflowEnhancement: true,
      autoStart: true,
      healthCheckInterval: 30000,
      taskTimeout: 300000, // 5 minutes
      maxConcurrentTasks: 10,
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

    // Initialize monitoring systems
    this.cursorMonitor = {
      isMonitoring: false,
      lastActivity: new Date(),
      frozenThreshold: 30000, // 30 seconds
      promptTemplates: [
        "I notice the conversation has paused. Would you like me to continue with the current task?",
        "It looks like we might need to move forward. Should I proceed with the next step?",
        "The chat seems to have stalled. Let me suggest the next action to take.",
        "I'm ready to continue. What would you like me to focus on next?",
        "It appears we're waiting for input. Here's what I recommend we do next:"
      ],
      autoPromptEnabled: true,
      chatHistory: []
    };

    this.setupExpressRoutes();
    this.setupWebSocketHandlers();
    this.initializeAgents();
    this.initializeWorkflowEnhancements();
  }

  /**
   * Start Agent Zero Orchestrator (Big Gun Mode)
   */
  async start(): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Starting Agent Zero Orchestrator (Big Gun Mode)...'));
      console.log(chalk.cyan('🎯 Multi-agent coordination system'));
      console.log(chalk.cyan('⚡ Enhanced workflow efficiency'));
      console.log(chalk.cyan('🔍 Cursor chat monitoring'));
      
      // Start Agent Zero container
      await this.startAgentZeroContainer();
      
      // Wait for Agent Zero to be ready
      await this.waitForAgentZero();
      
      // Initialize specialized agents
      await this.initializeAgents();
      
      // Start monitoring systems
      await this.startMonitoringSystems();
      
      // Start orchestrator API server
      await this.startOrchestratorServer();
      
      // Start task processing
      this.startTaskProcessor();
      
      this.running = true;
      
      console.log(chalk.green('✅ Agent Zero Orchestrator started successfully'));
      console.log(chalk.blue(`🤖 Agent Zero: http://localhost:${this.config.agentZeroPort}`));
      console.log(chalk.blue(`🎯 Orchestrator API: http://localhost:${this.config.orchestratorPort}`));
      console.log(chalk.cyan(`👥 Active Agents: ${this.agents.size}`));
      console.log(chalk.cyan(`📋 Task Queue: ${this.taskQueue.length}`));
      console.log(chalk.cyan(`⚡ Workflow Enhancements: ${this.workflowEnhancements.filter(w => w.enabled).length}`));
      
      this.emit('orchestratorStarted', {
        agentZeroUrl: `http://localhost:${this.config.agentZeroPort}`,
        orchestratorUrl: `http://localhost:${this.config.orchestratorPort}`,
        agents: Array.from(this.agents.values()),
        enhancements: this.workflowEnhancements
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
      console.log(chalk.yellow('⏹️ Stopping Agent Zero Orchestrator...'));
      
      this.stopTaskProcessor();
      this.stopMonitoringSystems();
      await this.stopOrchestratorServer();
      await this.stopAgentZeroContainer();
      
      this.running = false;
      
      console.log(chalk.green('✅ Agent Zero Orchestrator stopped'));
      this.emit('orchestratorStopped');
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to stop orchestrator:'), error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Submit task for orchestration
   */
  async submitTask(task: Partial<AgentTask>): Promise<string> {
    const agentTask: AgentTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'problem-solving',
      priority: 'medium',
      status: 'pending',
      description: 'Generic task',
      input: {},
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      ...task
    };

    this.taskQueue.push(agentTask);
    this.emit('taskSubmitted', agentTask);
    
    console.log(chalk.blue(`📋 Task submitted: ${agentTask.id} (${agentTask.type})`));
    
    return agentTask.id;
  }

  /**
   * Decompose complex task into smaller subtasks
   */
  async decomposeTask(taskId: string): Promise<AgentTask[]> {
    const task = this.taskQueue.find(t => t.id === taskId) || this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    console.log(chalk.blue(`🔍 Decomposing task: ${taskId}`));
    
    // Use Agent Zero to analyze and decompose the task
    const decompositionPrompt = `
    Analyze this task and break it down into smaller, manageable subtasks:
    
    Task: ${task.description}
    Type: ${task.type}
    Priority: ${task.priority}
    Input: ${JSON.stringify(task.input, null, 2)}
    
    Please provide a JSON array of subtasks, each with:
    - type: the type of subtask
    - description: clear description of what needs to be done
    - priority: low/medium/high/critical
    - dependencies: array of other subtask IDs this depends on
    - estimatedTime: estimated time in minutes
    `;

    try {
      const response = await this.sendToAgentZero(decompositionPrompt);
      const subtasks = JSON.parse(response);
      
      const decomposedTasks: AgentTask[] = subtasks.map((subtask: any, index: number) => ({
        id: `${taskId}_subtask_${index}`,
        type: subtask.type || 'problem-solving',
        priority: subtask.priority || 'medium',
        status: 'pending',
        description: subtask.description,
        input: { ...task.input, subtask },
        createdAt: new Date(),
        retryCount: 0,
        maxRetries: 2,
        timeout: subtask.estimatedTime ? subtask.estimatedTime * 60000 : this.config.taskTimeout
      }));

      // Add subtasks to queue
      this.taskQueue.push(...decomposedTasks);
      
      console.log(chalk.green(`✅ Task decomposed into ${decomposedTasks.length} subtasks`));
      this.emit('taskDecomposed', { taskId, subtasks: decomposedTasks });
      
      return decomposedTasks;
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to decompose task:'), error);
      throw error;
    }
  }

  /**
   * Start Cursor chat monitoring
   */
  async startCursorMonitoring(): Promise<void> {
    console.log(chalk.blue('👁️ Starting Cursor chat monitoring...'));
    
    this.cursorMonitor.isMonitoring = true;
    
    // Monitor for chat activity
    setInterval(() => {
      this.checkCursorChatActivity();
    }, 5000); // Check every 5 seconds
    
    console.log(chalk.green('✅ Cursor chat monitoring started'));
    this.emit('cursorMonitoringStarted');
  }

  /**
   * Check Cursor chat activity
   */
  private async checkCursorChatActivity(): Promise<void> {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - this.cursorMonitor.lastActivity.getTime();
    
    if (timeSinceLastActivity > this.cursorMonitor.frozenThreshold) {
      console.log(chalk.yellow('⚠️ Cursor chat appears frozen'));
      
      if (this.cursorMonitor.autoPromptEnabled) {
        await this.promptCursorChat();
      }
      
      this.emit('cursorChatFrozen', {
        lastActivity: this.cursorMonitor.lastActivity,
        frozenDuration: timeSinceLastActivity
      });
    }
  }

  /**
   * Prompt Cursor chat to continue
   */
  private async promptCursorChat(): Promise<void> {
    const promptTemplate = this.cursorMonitor.promptTemplates[
      Math.floor(Math.random() * this.cursorMonitor.promptTemplates.length)
    ];
    
    console.log(chalk.cyan(`💬 Prompting Cursor chat: ${promptTemplate}`));
    
    // Send prompt to Cursor chat
    try {
      await this.sendToCursorChat(promptTemplate);
      this.cursorMonitor.lastActivity = new Date();
      
      this.emit('cursorChatPrompted', {
        prompt: promptTemplate,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to prompt Cursor chat:'), error);
    }
  }

  /**
   * Send message to Cursor chat
   */
  private async sendToCursorChat(message: string): Promise<void> {
    // This would integrate with Cursor's API or file system
    // For now, we'll simulate by writing to a file that Cursor can monitor
    const cursorInboxPath = '.cursor/inbox';
    const promptFile = join(cursorInboxPath, `agent-zero-prompt-${Date.now()}.md`);
    
    const promptContent = `# Agent Zero Orchestrator Prompt

**Timestamp:** ${new Date().toISOString()}
**Type:** Chat Continuation Prompt

## Message
${message}

## Context
This prompt was generated by the Agent Zero Orchestrator because the Cursor chat appeared to be frozen or inactive.

## Suggested Actions
- Continue with the current task
- Provide feedback on the current progress
- Request clarification if needed
- Move to the next step in the workflow

---
*Generated by IterAgent Agent Zero Orchestrator*
`;

    try {
      await fs.mkdir(cursorInboxPath, { recursive: true });
      await fs.writeFile(promptFile, promptContent);
      
      console.log(chalk.green(`✅ Prompt sent to Cursor chat: ${promptFile}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to send prompt to Cursor:'), error);
      throw error;
    }
  }

  /**
   * Initialize specialized agents
   */
  private async initializeAgents(): Promise<void> {
    console.log(chalk.blue('👥 Initializing specialized agents...'));
    
    const agentTypes = [
      {
        id: 'cursor-monitor',
        name: 'Cursor Chat Monitor',
        type: 'cursor-monitor' as const,
        capabilities: ['chat-monitoring', 'activity-detection', 'prompt-generation', 'continuation-triggers']
      },
      {
        id: 'log-analyzer',
        name: 'Log Analysis Agent',
        type: 'log-analyzer' as const,
        capabilities: ['log-parsing', 'error-detection', 'pattern-recognition', 'insight-generation']
      },
      {
        id: 'workflow-enhancer',
        name: 'Workflow Enhancement Agent',
        type: 'workflow-enhancer' as const,
        capabilities: ['workflow-optimization', 'efficiency-analysis', 'automation-suggestions', 'process-improvement']
      },
      {
        id: 'task-decomposer',
        name: 'Task Decomposition Agent',
        type: 'task-decomposer' as const,
        capabilities: ['task-analysis', 'subtask-generation', 'dependency-mapping', 'priority-assignment']
      },
      {
        id: 'problem-solver',
        name: 'Problem Solving Agent',
        type: 'problem-solver' as const,
        capabilities: ['solution-generation', 'debugging', 'optimization', 'creative-problem-solving']
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
   * Initialize workflow enhancements
   */
  private initializeWorkflowEnhancements(): void {
    this.workflowEnhancements = [
      {
        id: 'cursor-chat-optimization',
        name: 'Cursor Chat Optimization',
        description: 'Optimize Cursor chat interactions and prevent freezing',
        triggers: ['chat-freeze', 'inactivity', 'long-response'],
        enhancements: ['auto-prompt', 'context-preservation', 'response-acceleration'],
        efficiencyGain: 25,
        enabled: true,
        usageCount: 0
      },
      {
        id: 'log-analysis-automation',
        name: 'Automated Log Analysis',
        description: 'Automatically analyze and categorize console logs',
        triggers: ['new-logs', 'error-detection', 'performance-issues'],
        enhancements: ['real-time-analysis', 'pattern-detection', 'insight-generation'],
        efficiencyGain: 40,
        enabled: true,
        usageCount: 0
      },
      {
        id: 'task-parallelization',
        name: 'Task Parallelization',
        description: 'Automatically parallelize independent tasks',
        triggers: ['multiple-tasks', 'independent-subtasks', 'resource-availability'],
        enhancements: ['parallel-execution', 'resource-optimization', 'load-balancing'],
        efficiencyGain: 60,
        enabled: true,
        usageCount: 0
      },
      {
        id: 'intelligent-routing',
        name: 'Intelligent Task Routing',
        description: 'Route tasks to the most appropriate agent',
        triggers: ['new-task', 'agent-capability-check', 'workload-balance'],
        enhancements: ['capability-matching', 'load-balancing', 'performance-optimization'],
        efficiencyGain: 35,
        enabled: true,
        usageCount: 0
      }
    ];
  }

  /**
   * Start monitoring systems
   */
  private async startMonitoringSystems(): Promise<void> {
    console.log(chalk.blue('🔍 Starting monitoring systems...'));
    
    if (this.config.enableCursorMonitoring) {
      await this.startCursorMonitoring();
    }
    
    if (this.config.enableLogAnalysis) {
      await this.startLogAnalysis();
    }
    
    console.log(chalk.green('✅ Monitoring systems started'));
  }

  /**
   * Start log analysis
   */
  private async startLogAnalysis(): Promise<void> {
    console.log(chalk.blue('📊 Starting log analysis system...'));
    
    // Monitor for new log entries and analyze them
    setInterval(() => {
      this.analyzeRecentLogs();
    }, 10000); // Analyze every 10 seconds
    
    console.log(chalk.green('✅ Log analysis system started'));
  }

  /**
   * Analyze recent logs
   */
  private async analyzeRecentLogs(): Promise<void> {
    // This would integrate with IterAgent's log harvesting system
    // For now, we'll simulate log analysis
    
    const logAnalysisTask = await this.submitTask({
      type: 'log-analysis',
      priority: 'medium',
      description: 'Analyze recent console logs for patterns and issues',
      input: { source: 'console', timeframe: 'last-10-minutes' }
    });
    
    this.emit('logAnalysisTriggered', { taskId: logAnalysisTask });
  }

  /**
   * Start task processor
   */
  private startTaskProcessor(): void {
    console.log(chalk.blue('⚙️ Starting task processor...'));
    
    setInterval(() => {
      this.processTaskQueue();
    }, 1000); // Process every second
    
    console.log(chalk.green('✅ Task processor started'));
  }

  /**
   * Process task queue
   */
  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.length === 0 || this.activeTasks.size >= this.config.maxConcurrentTasks) {
      return;
    }

    // Sort tasks by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const task = this.taskQueue.shift();
    if (!task) return;

    // Find best agent for the task
    const agent = this.findBestAgent(task);
    if (!agent) {
      console.log(chalk.yellow(`⚠️ No available agent for task: ${task.id}`));
      this.taskQueue.push(task); // Put back in queue
      return;
    }

    // Assign task to agent
    await this.assignTaskToAgent(task, agent);
  }

  /**
   * Find best agent for task
   */
  private findBestAgent(task: AgentTask): SpecializedAgent | null {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'idle');

    if (availableAgents.length === 0) {
      return null;
    }

    // Find agent with matching capabilities
    const matchingAgents = availableAgents.filter(agent => {
      const taskCapabilities = this.getTaskCapabilities(task);
      return taskCapabilities.some(cap => agent.capabilities.includes(cap));
    });

    if (matchingAgents.length > 0) {
      // Return agent with best performance
      return matchingAgents.reduce((best, current) => 
        current.performance.successRate > best.performance.successRate ? current : best
      );
    }

    // Fallback to problem-solver agent
    return availableAgents.find(agent => agent.type === 'problem-solver') || availableAgents[0];
  }

  /**
   * Get capabilities needed for task
   */
  private getTaskCapabilities(task: AgentTask): string[] {
    const capabilityMap = {
      'cursor-monitor': ['chat-monitoring', 'activity-detection'],
      'log-analysis': ['log-parsing', 'error-detection', 'pattern-recognition'],
      'workflow-enhancement': ['workflow-optimization', 'efficiency-analysis'],
      'task-decomposition': ['task-analysis', 'subtask-generation'],
      'problem-solving': ['solution-generation', 'debugging', 'optimization']
    };

    return capabilityMap[task.type] || ['problem-solving'];
  }

  /**
   * Assign task to agent
   */
  private async assignTaskToAgent(task: AgentTask, agent: SpecializedAgent): Promise<void> {
    console.log(chalk.blue(`🎯 Assigning task ${task.id} to agent ${agent.name}`));
    
    task.status = 'running';
    task.assignedAgent = agent.id;
    task.startedAt = new Date();
    
    agent.status = 'busy';
    agent.currentTask = task.id;
    agent.taskHistory.push(task.id);
    
    this.activeTasks.set(task.id, task);
    
    this.emit('taskAssigned', { task, agent });
    
    // Execute task
    this.executeTask(task, agent);
  }

  /**
   * Execute task with agent
   */
  private async executeTask(task: AgentTask, agent: SpecializedAgent): Promise<void> {
    try {
      console.log(chalk.blue(`⚡ Executing task ${task.id} with ${agent.name}`));
      
      let result;
      
      switch (agent.type) {
        case 'cursor-monitor':
          result = await this.executeCursorMonitorTask(task);
          break;
        case 'log-analyzer':
          result = await this.executeLogAnalysisTask(task);
          break;
        case 'workflow-enhancer':
          result = await this.executeWorkflowEnhancementTask(task);
          break;
        case 'task-decomposer':
          result = await this.executeTaskDecompositionTask(task);
          break;
        case 'problem-solver':
          result = await this.executeProblemSolvingTask(task);
          break;
        default:
          throw new Error(`Unknown agent type: ${agent.type}`);
      }
      
      // Complete task
      task.status = 'completed';
      task.output = result;
      task.completedAt = new Date();
      
      // Update agent performance
      const executionTime = task.completedAt.getTime() - task.startedAt!.getTime();
      agent.performance.tasksCompleted++;
      agent.performance.averageExecutionTime = 
        (agent.performance.averageExecutionTime + executionTime) / 2;
      agent.performance.lastActivity = new Date();
      
      // Move to completed tasks
      this.activeTasks.delete(task.id);
      this.completedTasks.push(task);
      
      // Free up agent
      agent.status = 'idle';
      agent.currentTask = undefined;
      
      console.log(chalk.green(`✅ Task ${task.id} completed by ${agent.name}`));
      this.emit('taskCompleted', { task, agent, result });
      
    } catch (error) {
      console.error(chalk.red(`❌ Task ${task.id} failed:`), error);
      
      task.status = 'failed';
      task.retryCount++;
      
      if (task.retryCount < task.maxRetries) {
        console.log(chalk.yellow(`🔄 Retrying task ${task.id} (${task.retryCount}/${task.maxRetries})`));
        this.taskQueue.push(task);
      } else {
        console.log(chalk.red(`❌ Task ${task.id} failed permanently`));
        this.completedTasks.push(task);
      }
      
      // Free up agent
      const agent = this.agents.get(task.assignedAgent!);
      if (agent) {
        agent.status = 'idle';
        agent.currentTask = undefined;
      }
      
      this.activeTasks.delete(task.id);
      this.emit('taskFailed', { task, error });
    }
  }

  /**
   * Execute cursor monitor task
   */
  private async executeCursorMonitorTask(task: AgentTask): Promise<any> {
    // Monitor Cursor chat and detect issues
    const analysis = {
      isActive: this.cursorMonitor.isMonitoring,
      lastActivity: this.cursorMonitor.lastActivity,
      chatHistoryLength: this.cursorMonitor.chatHistory.length,
      frozenThreshold: this.cursorMonitor.frozenThreshold,
      recommendations: [] as string[]
    };

    if (Date.now() - this.cursorMonitor.lastActivity.getTime() > this.cursorMonitor.frozenThreshold) {
      analysis.recommendations.push('Chat appears frozen - consider prompting continuation');
    }

    return analysis;
  }

  /**
   * Execute log analysis task
   */
  private async executeLogAnalysisTask(task: AgentTask): Promise<any> {
    // Analyze logs using Agent Zero
    const analysisPrompt = `
    Analyze the following logs and provide insights:
    
    ${JSON.stringify(task.input, null, 2)}
    
    Please provide:
    1. Error patterns detected
    2. Performance issues identified
    3. Recommendations for improvement
    4. Priority level for each issue
    `;

    const result = await this.sendToAgentZero(analysisPrompt);
    return JSON.parse(result);
  }

  /**
   * Execute workflow enhancement task
   */
  private async executeWorkflowEnhancementTask(task: AgentTask): Promise<any> {
    // Analyze workflow and suggest enhancements
    const enhancementPrompt = `
    Analyze this workflow and suggest efficiency improvements:
    
    ${JSON.stringify(task.input, null, 2)}
    
    Please provide:
    1. Current efficiency bottlenecks
    2. Suggested optimizations
    3. Estimated efficiency gains
    4. Implementation priority
    `;

    const result = await this.sendToAgentZero(enhancementPrompt);
    return JSON.parse(result);
  }

  /**
   * Execute task decomposition task
   */
  private async executeTaskDecompositionTask(task: AgentTask): Promise<any> {
    return await this.decomposeTask(task.id);
  }

  /**
   * Execute problem solving task
   */
  private async executeProblemSolvingTask(task: AgentTask): Promise<any> {
    const problemPrompt = `
    Solve this problem:
    
    ${task.description}
    
    Input: ${JSON.stringify(task.input, null, 2)}
    
    Please provide:
    1. Problem analysis
    2. Solution approach
    3. Implementation steps
    4. Risk assessment
    `;

    const result = await this.sendToAgentZero(problemPrompt);
    return JSON.parse(result);
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
   * Stop monitoring systems
   */
  private stopMonitoringSystems(): void {
    this.cursorMonitor.isMonitoring = false;
    console.log(chalk.yellow('⏹️ Monitoring systems stopped'));
  }

  /**
   * Stop task processor
   */
  private stopTaskProcessor(): void {
    console.log(chalk.yellow('⏹️ Task processor stopped'));
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
        taskQueue: this.taskQueue.length,
        activeTasks: this.activeTasks.size,
        completedTasks: this.completedTasks.length,
        efficiencyMetrics: this.efficiencyMetrics,
        cursorMonitor: this.cursorMonitor
      });
    });

    // Task API
    this.app.post('/api/tasks', async (req, res) => {
      try {
        const taskId = await this.submitTask(req.body);
        res.json({ taskId, status: 'submitted' });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/tasks', (req, res) => {
      res.json({
        queue: this.taskQueue,
        active: Array.from(this.activeTasks.values()),
        completed: this.completedTasks.slice(-50) // Last 50 completed tasks
      });
    });

    // Agent API
    this.app.get('/api/agents', (req, res) => {
      res.json({
        agents: Array.from(this.agents.values()),
        total: this.agents.size
      });
    });

    // Workflow enhancements API
    this.app.get('/api/enhancements', (req, res) => {
      res.json({
        enhancements: this.workflowEnhancements,
        total: this.workflowEnhancements.length
      });
    });

    // Cursor monitoring API
    this.app.post('/api/cursor/prompt', async (req, res) => {
      try {
        await this.promptCursorChat();
        res.json({ status: 'prompted' });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
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
        running: this.running,
        agents: Array.from(this.agents.values()),
        taskQueue: this.taskQueue.length,
        activeTasks: this.activeTasks.size,
        efficiencyMetrics: this.efficiencyMetrics
      });
      
      socket.on('disconnect', () => {
        console.log(chalk.yellow(`🔌 Client disconnected: ${socket.id}`));
      });
    });
  }

  /**
   * Get configuration
   */
  getConfig(): AgentZeroOrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Get agents
   */
  getAgents(): SpecializedAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get task queue
   */
  getTaskQueue(): AgentTask[] {
    return [...this.taskQueue];
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): AgentTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks(): AgentTask[] {
    return [...this.completedTasks];
  }

  /**
   * Get workflow enhancements
   */
  getWorkflowEnhancements(): WorkflowEnhancement[] {
    return [...this.workflowEnhancements];
  }

  /**
   * Get efficiency metrics
   */
  getEfficiencyMetrics() {
    return { ...this.efficiencyMetrics };
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }
}
