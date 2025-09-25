import { EventEmitter } from 'events';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { spawn, ChildProcess } from 'child_process';
import { TerminalSuggestion, TerminalFeedback } from './terminal-feedback';

export interface CursorAIFunction {
  id: string;
  name: string;
  description: string;
  category: 'file-operation' | 'git-operation' | 'build-operation' | 'test-operation' | 'deployment' | 'other';
  command: string;
  parameters?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;
  estimatedDuration: number; // milliseconds
  lastExecuted?: Date;
  executionCount: number;
  successRate: number;
}

export interface ExecutionResult {
  functionId: string;
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  timestamp: Date;
  requiresConfirmation: boolean;
}

export interface PerformanceMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

export interface SpeedOptimizationSuggestion {
  id: string;
  type: 'caching' | 'parallelization' | 'resource-optimization' | 'code-optimization' | 'infrastructure';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  command?: string;
  reasoning: string;
  estimatedImprovement: number; // percentage
}

export interface CursorAIConfig {
  enableAutoExecution: boolean;
  allowlist: string[];
  blocklist: string[];
  defaultBlocklist: string[];
  performanceMonitoring: {
    enabled: boolean;
    interval: number; // milliseconds
    thresholds: {
      cpuUsage: number;
      memoryUsage: number;
      responseTime: number;
    };
  };
  speedOptimization: {
    enabled: boolean;
    suggestionInterval: number; // milliseconds
    autoApply: boolean;
    minImprovementThreshold: number; // percentage
  };
  ui: {
    showFunctionPanel: boolean;
    panelPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    autoHide: boolean;
    hideDelay: number; // milliseconds
  };
}

export class CursorAIFunctionExecutor extends EventEmitter {
  private config: CursorAIConfig;
  private functions: Map<string, CursorAIFunction> = new Map();
  private executionHistory: ExecutionResult[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private speedSuggestions: SpeedOptimizationSuggestion[] = [];
  private isMonitoring: boolean = false;
  private performanceInterval: NodeJS.Timeout | null = null;
  private suggestionInterval: NodeJS.Timeout | null = null;
  private terminalFeedback: TerminalFeedback;

  constructor(config: Partial<CursorAIConfig> = {}) {
    super();
    this.config = {
      enableAutoExecution: true,
      allowlist: [],
      blocklist: [],
      defaultBlocklist: [
        'git push',
        'git push origin',
        'git push --force',
        'rm -rf',
        'sudo rm',
        'format c:',
        'del /f /s /q',
        'shutdown',
        'reboot',
        'halt'
      ],
      performanceMonitoring: {
        enabled: true,
        interval: 30000, // 30 seconds
        thresholds: {
          cpuUsage: 80,
          memoryUsage: 85,
          responseTime: 5000
        }
      },
      speedOptimization: {
        enabled: true,
        suggestionInterval: 300000, // 5 minutes
        autoApply: false,
        minImprovementThreshold: 10
      },
      ui: {
        showFunctionPanel: true,
        panelPosition: 'top-right',
        autoHide: true,
        hideDelay: 5000
      },
      ...config
    };
    
    this.terminalFeedback = new TerminalFeedback();
    this.initializeDefaultFunctions();
    this.loadConfiguration();
  }

  /**
   * Initialize default Cursor AI functions
   */
  private initializeDefaultFunctions(): void {
    const defaultFunctions: CursorAIFunction[] = [
      {
        id: 'create-file',
        name: 'Create File',
        description: 'Create a new file with specified content',
        category: 'file-operation',
        command: 'touch {filepath} && echo "{content}" > {filepath}',
        riskLevel: 'low',
        requiresConfirmation: false,
        estimatedDuration: 100,
        executionCount: 0,
        successRate: 100
      },
      {
        id: 'edit-file',
        name: 'Edit File',
        description: 'Edit an existing file',
        category: 'file-operation',
        command: 'echo "{content}" > {filepath}',
        riskLevel: 'medium',
        requiresConfirmation: false,
        estimatedDuration: 200,
        executionCount: 0,
        successRate: 95
      },
      {
        id: 'run-tests',
        name: 'Run Tests',
        description: 'Execute test suite',
        category: 'test-operation',
        command: 'npm test',
        riskLevel: 'low',
        requiresConfirmation: false,
        estimatedDuration: 10000,
        executionCount: 0,
        successRate: 90
      },
      {
        id: 'install-deps',
        name: 'Install Dependencies',
        description: 'Install project dependencies',
        category: 'build-operation',
        command: 'npm install',
        riskLevel: 'low',
        requiresConfirmation: false,
        estimatedDuration: 30000,
        executionCount: 0,
        successRate: 95
      },
      {
        id: 'build-project',
        name: 'Build Project',
        description: 'Build the project',
        category: 'build-operation',
        command: 'npm run build',
        riskLevel: 'low',
        requiresConfirmation: false,
        estimatedDuration: 60000,
        executionCount: 0,
        successRate: 85
      },
      {
        id: 'git-add',
        name: 'Git Add',
        description: 'Add files to git staging',
        category: 'git-operation',
        command: 'git add {files}',
        riskLevel: 'low',
        requiresConfirmation: false,
        estimatedDuration: 500,
        executionCount: 0,
        successRate: 98
      },
      {
        id: 'git-commit',
        name: 'Git Commit',
        description: 'Commit changes to git',
        category: 'git-operation',
        command: 'git commit -m "{message}"',
        riskLevel: 'low',
        requiresConfirmation: false,
        estimatedDuration: 1000,
        executionCount: 0,
        successRate: 95
      },
      {
        id: 'git-push',
        name: 'Git Push',
        description: 'Push changes to remote repository',
        category: 'git-operation',
        command: 'git push {remote} {branch}',
        riskLevel: 'high',
        requiresConfirmation: true,
        estimatedDuration: 5000,
        executionCount: 0,
        successRate: 90
      },
      {
        id: 'start-dev-server',
        name: 'Start Dev Server',
        description: 'Start development server',
        category: 'build-operation',
        command: 'npm run dev',
        riskLevel: 'low',
        requiresConfirmation: false,
        estimatedDuration: 10000,
        executionCount: 0,
        successRate: 85
      },
      {
        id: 'lint-code',
        name: 'Lint Code',
        description: 'Run code linting',
        category: 'test-operation',
        command: 'npm run lint',
        riskLevel: 'low',
        requiresConfirmation: false,
        estimatedDuration: 5000,
        executionCount: 0,
        successRate: 90
      }
    ];

    defaultFunctions.forEach(func => {
      this.functions.set(func.id, func);
    });
  }

  /**
   * Execute a Cursor AI function
   */
  async executeFunction(functionId: string, parameters?: Record<string, any>): Promise<ExecutionResult> {
    const func = this.functions.get(functionId);
    if (!func) {
      throw new Error(`Function ${functionId} not found`);
    }

    // Check if function is blocked
    if (this.isFunctionBlocked(func)) {
      const result: ExecutionResult = {
        functionId,
        success: false,
        output: '',
        error: `Function ${func.name} is blocked`,
        duration: 0,
        timestamp: new Date(),
        requiresConfirmation: true
      };
      
      this.emit('functionBlocked', func, result);
      return result;
    }

    // Check if confirmation is required
    if (func.requiresConfirmation && !this.isFunctionAllowed(func)) {
      const result: ExecutionResult = {
        functionId,
        success: false,
        output: '',
        error: `Function ${func.name} requires confirmation`,
        duration: 0,
        timestamp: new Date(),
        requiresConfirmation: true
      };
      
      this.emit('functionRequiresConfirmation', func, result);
      return result;
    }

    const startTime = Date.now();
    
    try {
      console.log(chalk.blue(`🚀 Executing function: ${func.name}`));
      
      // Replace parameters in command
      let command = func.command;
      if (parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
          command = command.replace(`{${key}}`, String(value));
        });
      }

      // Execute command
      const output = await this.executeCommand(command);
      const duration = Date.now() - startTime;

      const result: ExecutionResult = {
        functionId,
        success: true,
        output,
        duration,
        timestamp: new Date(),
        requiresConfirmation: false
      };

      // Update function statistics
      func.executionCount++;
      func.lastExecuted = new Date();
      func.successRate = ((func.successRate * (func.executionCount - 1)) + 100) / func.executionCount;

      this.executionHistory.push(result);
      this.emit('functionExecuted', func, result);

      console.log(chalk.green(`✅ Function executed successfully: ${func.name}`));
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      const result: ExecutionResult = {
        functionId,
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: new Date(),
        requiresConfirmation: false
      };

      // Update function statistics
      func.executionCount++;
      func.lastExecuted = new Date();
      func.successRate = ((func.successRate * (func.executionCount - 1)) + 0) / func.executionCount;

      this.executionHistory.push(result);
      this.emit('functionFailed', func, result);

      console.log(chalk.red(`❌ Function execution failed: ${func.name}`));
      return result;
    }
  }

  /**
   * Execute command in terminal
   */
  private executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      });

      let output = '';
      let error = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(error || `Command failed with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Check if function is blocked
   */
  private isFunctionBlocked(func: CursorAIFunction): boolean {
    // Check default blocklist
    if (this.config.defaultBlocklist.some(blocked => func.command.includes(blocked))) {
      return true;
    }

    // Check custom blocklist
    if (this.config.blocklist.includes(func.id) || this.config.blocklist.includes(func.name)) {
      return true;
    }

    return false;
  }

  /**
   * Check if function is allowed
   */
  private isFunctionAllowed(func: CursorAIFunction): boolean {
    // If allowlist is empty, allow all non-blocked functions
    if (this.config.allowlist.length === 0) {
      return !this.isFunctionBlocked(func);
    }

    // Check if function is in allowlist
    return this.config.allowlist.includes(func.id) || this.config.allowlist.includes(func.name);
  }

  /**
   * Add function to allowlist
   */
  addToAllowlist(functionId: string): void {
    if (!this.config.allowlist.includes(functionId)) {
      this.config.allowlist.push(functionId);
      this.saveConfiguration();
      console.log(chalk.green(`✅ Added ${functionId} to allowlist`));
      this.emit('allowlistUpdated', this.config.allowlist);
    }
  }

  /**
   * Remove function from allowlist
   */
  removeFromAllowlist(functionId: string): void {
    const index = this.config.allowlist.indexOf(functionId);
    if (index > -1) {
      this.config.allowlist.splice(index, 1);
      this.saveConfiguration();
      console.log(chalk.yellow(`🗑️ Removed ${functionId} from allowlist`));
      this.emit('allowlistUpdated', this.config.allowlist);
    }
  }

  /**
   * Add function to blocklist
   */
  addToBlocklist(functionId: string): void {
    if (!this.config.blocklist.includes(functionId)) {
      this.config.blocklist.push(functionId);
      this.saveConfiguration();
      console.log(chalk.red(`🚫 Added ${functionId} to blocklist`));
      this.emit('blocklistUpdated', this.config.blocklist);
    }
  }

  /**
   * Remove function from blocklist
   */
  removeFromBlocklist(functionId: string): void {
    const index = this.config.blocklist.indexOf(functionId);
    if (index > -1) {
      this.config.blocklist.splice(index, 1);
      this.saveConfiguration();
      console.log(chalk.green(`✅ Removed ${functionId} from blocklist`));
      this.emit('blocklistUpdated', this.config.blocklist);
    }
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log(chalk.blue('📊 Starting performance monitoring...'));

    this.performanceInterval = setInterval(async () => {
      const metrics = await this.collectPerformanceMetrics();
      this.performanceMetrics.push(metrics);
      
      // Keep only last 100 metrics
      if (this.performanceMetrics.length > 100) {
        this.performanceMetrics.shift();
      }

      // Check thresholds
      this.checkPerformanceThresholds(metrics);
      
      this.emit('performanceMetrics', metrics);
    }, this.config.performanceMonitoring.interval);

    // Start speed optimization suggestions
    this.suggestionInterval = setInterval(() => {
      this.generateSpeedOptimizationSuggestions();
    }, this.config.speedOptimization.suggestionInterval);
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }

    if (this.suggestionInterval) {
      clearInterval(this.suggestionInterval);
      this.suggestionInterval = null;
    }

    console.log(chalk.yellow('⏹️ Performance monitoring stopped'));
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    // Get CPU usage (simplified)
    const cpuUsage = await this.getCPUUsage();
    
    // Get memory usage
    const memoryUsage = await this.getMemoryUsage();
    
    // Get disk usage
    const diskUsage = await this.getDiskUsage();
    
    // Get network latency (simplified)
    const networkLatency = await this.getNetworkLatency();
    
    const responseTime = Date.now() - startTime;

    return {
      timestamp: new Date(),
      cpuUsage,
      memoryUsage,
      diskUsage,
      networkLatency,
      responseTime,
      throughput: this.calculateThroughput(),
      errorRate: this.calculateErrorRate()
    };
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const start = process.cpuUsage();
      setTimeout(() => {
        const usage = process.cpuUsage(start);
        const totalUsage = usage.user + usage.system;
        const percentage = (totalUsage / 1000000) * 100; // Convert to percentage
        resolve(Math.min(percentage, 100));
      }, 100);
    });
  }

  /**
   * Get memory usage percentage
   */
  private async getMemoryUsage(): Promise<number> {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const usedMem = memUsage.heapUsed + memUsage.external;
    return (usedMem / totalMem) * 100;
  }

  /**
   * Get disk usage percentage
   */
  private async getDiskUsage(): Promise<number> {
    try {
      const { exec } = require('child_process');
      return new Promise((resolve) => {
        exec('df -h .', (error: any, stdout: string) => {
          if (error) {
            resolve(0);
            return;
          }
          
          const lines = stdout.split('\n');
          if (lines.length > 1) {
            const parts = lines[1].split(/\s+/);
            const usage = parts[4] ? parseInt(parts[4].replace('%', '')) : 0;
            resolve(usage);
          } else {
            resolve(0);
          }
        });
      });
    } catch {
      return 0;
    }
  }

  /**
   * Get network latency
   */
  private async getNetworkLatency(): Promise<number> {
    try {
      const start = Date.now();
      const { exec } = require('child_process');
      
      return new Promise((resolve) => {
        exec('ping -c 1 8.8.8.8', (error: any, stdout: string) => {
          const latency = Date.now() - start;
          resolve(error ? 0 : latency);
        });
      });
    } catch {
      return 0;
    }
  }

  /**
   * Calculate throughput
   */
  private calculateThroughput(): number {
    const recentExecutions = this.executionHistory.slice(-10);
    const successfulExecutions = recentExecutions.filter(exec => exec.success);
    return (successfulExecutions.length / recentExecutions.length) * 100;
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    const recentExecutions = this.executionHistory.slice(-10);
    const failedExecutions = recentExecutions.filter(exec => !exec.success);
    return (failedExecutions.length / recentExecutions.length) * 100;
  }

  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    const thresholds = this.config.performanceMonitoring.thresholds;
    
    if (metrics.cpuUsage > thresholds.cpuUsage) {
      this.generateSpeedOptimizationSuggestions();
      console.log(chalk.yellow(`⚠️ High CPU usage detected: ${metrics.cpuUsage.toFixed(1)}%`));
    }
    
    if (metrics.memoryUsage > thresholds.memoryUsage) {
      this.generateSpeedOptimizationSuggestions();
      console.log(chalk.yellow(`⚠️ High memory usage detected: ${metrics.memoryUsage.toFixed(1)}%`));
    }
    
    if (metrics.responseTime > thresholds.responseTime) {
      this.generateSpeedOptimizationSuggestions();
      console.log(chalk.yellow(`⚠️ Slow response time detected: ${metrics.responseTime}ms`));
    }
  }

  /**
   * Generate speed optimization suggestions
   */
  private generateSpeedOptimizationSuggestions(): void {
    const suggestions: SpeedOptimizationSuggestion[] = [];
    
    // Analyze recent performance metrics
    const recentMetrics = this.performanceMetrics.slice(-5);
    const avgCPU = recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;

    // CPU optimization suggestions
    if (avgCPU > 70) {
      suggestions.push({
        id: 'cpu-optimization-1',
        type: 'parallelization',
        title: 'Enable Parallel Processing',
        description: 'Consider running operations in parallel to reduce CPU bottlenecks',
        impact: 'high',
        effort: 'medium',
        command: 'npm run build --parallel',
        reasoning: `CPU usage is high (${avgCPU.toFixed(1)}%). Parallel processing can help distribute the load.`,
        estimatedImprovement: 25
      });
    }

    // Memory optimization suggestions
    if (avgMemory > 80) {
      suggestions.push({
        id: 'memory-optimization-1',
        type: 'resource-optimization',
        title: 'Optimize Memory Usage',
        description: 'Reduce memory consumption by optimizing data structures and caching',
        impact: 'high',
        effort: 'high',
        reasoning: `Memory usage is high (${avgMemory.toFixed(1)}%). Consider optimizing data structures and implementing caching.`,
        estimatedImprovement: 30
      });
    }

    // Response time optimization suggestions
    if (avgResponseTime > 3000) {
      suggestions.push({
        id: 'response-optimization-1',
        type: 'caching',
        title: 'Implement Caching',
        description: 'Add caching layer to reduce response times',
        impact: 'high',
        effort: 'medium',
        command: 'npm install redis',
        reasoning: `Response time is slow (${avgResponseTime.toFixed(0)}ms). Caching can significantly improve performance.`,
        estimatedImprovement: 40
      });
    }

    // General optimization suggestions
    suggestions.push({
      id: 'general-optimization-1',
      type: 'code-optimization',
      title: 'Code Optimization',
      description: 'Review and optimize frequently executed code paths',
      impact: 'medium',
      effort: 'medium',
      reasoning: 'Regular code optimization can improve overall performance.',
      estimatedImprovement: 15
    });

    // Add suggestions
    suggestions.forEach(suggestion => {
      if (!this.speedSuggestions.find(s => s.id === suggestion.id)) {
        this.speedSuggestions.push(suggestion);
      }
    });

    // Emit suggestions
    if (suggestions.length > 0) {
      console.log(chalk.cyan(`💡 Generated ${suggestions.length} speed optimization suggestions`));
      this.emit('speedSuggestions', suggestions);
    }
  }

  /**
   * Get all functions
   */
  getFunctions(): CursorAIFunction[] {
    return Array.from(this.functions.values());
  }

  /**
   * Get function by ID
   */
  getFunction(functionId: string): CursorAIFunction | undefined {
    return this.functions.get(functionId);
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ExecutionResult[] {
    return [...this.executionHistory];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Get speed optimization suggestions
   */
  getSpeedSuggestions(): SpeedOptimizationSuggestion[] {
    return [...this.speedSuggestions];
  }

  /**
   * Get configuration
   */
  getConfig(): CursorAIConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CursorAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfiguration();
    console.log(chalk.blue('⚙️ Configuration updated'));
  }

  /**
   * Load configuration from file
   */
  private loadConfiguration(): void {
    try {
      const configPath = '.iteragent/cursor-ai-config.json';
      if (existsSync(configPath)) {
        const configData = JSON.parse(readFileSync(configPath, 'utf8'));
        this.config = { ...this.config, ...configData };
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not load Cursor AI configuration'));
    }
  }

  /**
   * Save configuration to file
   */
  private saveConfiguration(): void {
    try {
      const configPath = '.iteragent/cursor-ai-config.json';
      mkdirSync('.iteragent', { recursive: true });
      writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.log(chalk.red('❌ Could not save Cursor AI configuration'));
    }
  }
}
