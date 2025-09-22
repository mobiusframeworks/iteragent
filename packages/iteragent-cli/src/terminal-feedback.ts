import { EventEmitter } from 'events';
import chalk from 'chalk';
import { spawn, ChildProcess } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface TerminalSuggestion {
  id: string;
  type: 'command' | 'fix' | 'optimization' | 'debug' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  command?: string;
  code?: string;
  reasoning: string;
  confidence: number; // 0-1
  timestamp: Date;
  executed: boolean;
  result?: 'success' | 'failure' | 'pending';
}

export interface SuggestionFilter {
  types: string[];
  priorities: string[];
  keywords: string[];
  blocked: string[];
}

export interface TerminalFeedbackConfig {
  enableSuggestions: boolean;
  suggestionThreshold: number; // confidence threshold
  autoExecute: boolean;
  maxSuggestions: number;
  allowlistFile: string;
  blocklistFile: string;
  logAnalysisDepth: number;
  enableCodeExecution: boolean;
  executionTimeout: number;
}

export class TerminalFeedback extends EventEmitter {
  private config: TerminalFeedbackConfig;
  private suggestions: Map<string, TerminalSuggestion> = new Map();
  private allowlist: Set<string> = new Set();
  private blocklist: Set<string> = new Set();
  private isRunning: boolean = false;
  private currentProcess: ChildProcess | null = null;
  private logBuffer: string[] = [];
  private analysisQueue: string[] = [];

  constructor(config: Partial<TerminalFeedbackConfig> = {}) {
    super();
    this.config = {
      enableSuggestions: true,
      suggestionThreshold: 0.7,
      autoExecute: false,
      maxSuggestions: 10,
      allowlistFile: '.iteragent/allowlist.json',
      blocklistFile: '.iteragent/blocklist.json',
      logAnalysisDepth: 100,
      enableCodeExecution: true,
      executionTimeout: 30000,
      ...config
    };
    this.loadFilters();
  }

  /**
   * Start monitoring terminal output and generating suggestions
   */
  async startMonitoring(process: ChildProcess): Promise<void> {
    this.isRunning = true;
    this.currentProcess = process;
    
    console.log(chalk.blue('🔍 Starting terminal feedback monitoring...'));
    
    // Monitor stdout
    process.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      this.logBuffer.push(output);
      this.analyzeLogEntry(output, 'stdout');
    });

    // Monitor stderr
    process.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();
      this.logBuffer.push(output);
      this.analyzeLogEntry(output, 'stderr');
    });

    // Monitor process events
    process.on('exit', (code) => {
      this.analyzeProcessExit(code);
    });

    process.on('error', (error) => {
      this.analyzeProcessError(error);
    });

    // Start periodic analysis
    this.startPeriodicAnalysis();
  }

  /**
   * Stop monitoring and cleanup
   */
  stopMonitoring(): void {
    this.isRunning = false;
    this.currentProcess = null;
    console.log(chalk.yellow('⏹️ Terminal feedback monitoring stopped'));
  }

  /**
   * Analyze individual log entry
   */
  private analyzeLogEntry(output: string, source: 'stdout' | 'stderr'): void {
    if (!this.config.enableSuggestions) return;

    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      this.analysisQueue.push(line);
      
      // Analyze for immediate issues
      this.analyzeImmediateIssues(line, source);
    }

    // Keep buffer size manageable
    if (this.logBuffer.length > this.config.logAnalysisDepth) {
      this.logBuffer.shift();
    }
  }

  /**
   * Analyze for immediate critical issues
   */
  private analyzeImmediateIssues(line: string, source: 'stdout' | 'stderr'): void {
    const criticalPatterns = [
      { pattern: /error|Error|ERROR/, type: 'error', priority: 'high' },
      { pattern: /fatal|Fatal|FATAL/, type: 'error', priority: 'critical' },
      { pattern: /exception|Exception|EXCEPTION/, type: 'error', priority: 'high' },
      { pattern: /failed|Failed|FAILED/, type: 'error', priority: 'medium' },
      { pattern: /warning|Warning|WARNING/, type: 'warning', priority: 'medium' },
      { pattern: /deprecated|Deprecated|DEPRECATED/, type: 'info', priority: 'low' },
      { pattern: /memory|Memory|MEMORY/, type: 'performance', priority: 'medium' },
      { pattern: /timeout|Timeout|TIMEOUT/, type: 'performance', priority: 'medium' },
      { pattern: /connection|Connection|CONNECTION/, type: 'network', priority: 'medium' },
      { pattern: /database|Database|DATABASE/, type: 'database', priority: 'medium' }
    ];

    for (const { pattern, type, priority } of criticalPatterns) {
      if (pattern.test(line)) {
        this.generateSuggestion({
          type: 'debug',
          priority: priority as any,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Detected`,
          description: `Detected ${type} in ${source}: ${line.substring(0, 100)}...`,
          reasoning: `Pattern "${pattern}" matched in ${source} output`,
          confidence: 0.8,
          command: this.generateFixCommand(line, type)
        });
        break;
      }
    }
  }

  /**
   * Generate fix command based on error type
   */
  private generateFixCommand(line: string, type: string): string | undefined {
    const fixCommands: Record<string, string> = {
      'error': 'echo "Error detected - checking logs for details"',
      'warning': 'echo "Warning detected - may need attention"',
      'performance': 'echo "Performance issue detected - monitoring resources"',
      'network': 'echo "Network issue detected - checking connectivity"',
      'database': 'echo "Database issue detected - checking connection"'
    };

    return fixCommands[type];
  }

  /**
   * Start periodic analysis of accumulated logs
   */
  private startPeriodicAnalysis(): void {
    const analyze = () => {
      if (!this.isRunning) return;
      
      if (this.analysisQueue.length > 0) {
        this.performDeepAnalysis();
      }
      
      setTimeout(analyze, 5000); // Analyze every 5 seconds
    };
    
    analyze();
  }

  /**
   * Perform deep analysis of recent logs
   */
  private performDeepAnalysis(): void {
    const recentLogs = this.analysisQueue.splice(0, 10); // Process 10 at a time
    const logText = recentLogs.join('\n');

    // Analyze for patterns and generate suggestions
    this.analyzePatterns(logText);
    this.analyzePerformance(logText);
    this.analyzeDependencies(logText);
    this.analyzeSecurity(logText);
  }

  /**
   * Analyze log patterns for suggestions
   */
  private analyzePatterns(logText: string): void {
    // Common development patterns
    const patterns = [
      {
        pattern: /npm.*not found|command not found/i,
        suggestion: {
          type: 'command' as const,
          priority: 'high' as const,
          title: 'Missing Command',
          description: 'A command or package is not found',
          command: 'npm install',
          reasoning: 'Command not found error detected',
          confidence: 0.9
        }
      },
      {
        pattern: /port.*already in use|EADDRINUSE/i,
        suggestion: {
          type: 'fix' as const,
          priority: 'medium' as const,
          title: 'Port Already in Use',
          description: 'The specified port is already occupied',
          command: 'lsof -ti:3000 | xargs kill -9',
          reasoning: 'Port conflict detected',
          confidence: 0.95
        }
      },
      {
        pattern: /permission denied|EACCES/i,
        suggestion: {
          type: 'fix' as const,
          priority: 'medium' as const,
          title: 'Permission Denied',
          description: 'Insufficient permissions for operation',
          command: 'sudo chmod +x',
          reasoning: 'Permission error detected',
          confidence: 0.8
        }
      },
      {
        pattern: /out of memory|ENOMEM/i,
        suggestion: {
          type: 'optimization' as const,
          priority: 'high' as const,
          title: 'Memory Issue',
          description: 'Application running out of memory',
          command: 'node --max-old-space-size=4096',
          reasoning: 'Memory exhaustion detected',
          confidence: 0.9
        }
      }
    ];

    for (const { pattern, suggestion } of patterns) {
      if (pattern.test(logText)) {
        this.generateSuggestion(suggestion);
      }
    }
  }

  /**
   * Analyze performance patterns
   */
  private analyzePerformance(logText: string): void {
    const slowPattern = /slow|Slow|SLOW|timeout|Timeout/i;
    const memoryPattern = /memory|Memory|MEMORY|heap|Heap/i;
    
    if (slowPattern.test(logText)) {
      this.generateSuggestion({
        type: 'optimization',
        priority: 'medium',
        title: 'Performance Optimization',
        description: 'Slow operations detected - consider optimization',
        command: 'echo "Consider profiling and optimizing slow operations"',
        reasoning: 'Performance degradation detected',
        confidence: 0.7
      });
    }

    if (memoryPattern.test(logText)) {
      this.generateSuggestion({
        type: 'optimization',
        priority: 'medium',
        title: 'Memory Optimization',
        description: 'Memory usage patterns detected',
        command: 'echo "Monitor memory usage and consider optimization"',
        reasoning: 'Memory-related issues detected',
        confidence: 0.6
      });
    }
  }

  /**
   * Analyze dependency issues
   */
  private analyzeDependencies(logText: string): void {
    const depPattern = /dependency|Dependency|DEPENDENCY|package|Package/i;
    const versionPattern = /version|Version|VERSION|conflict|Conflict/i;
    
    if (depPattern.test(logText) && versionPattern.test(logText)) {
      this.generateSuggestion({
        type: 'fix',
        priority: 'medium',
        title: 'Dependency Issue',
        description: 'Dependency or version conflict detected',
        command: 'npm audit fix',
        reasoning: 'Dependency conflict detected',
        confidence: 0.8
      });
    }
  }

  /**
   * Analyze security issues
   */
  private analyzeSecurity(logText: string): void {
    const securityPattern = /vulnerability|Vulnerability|VULNERABILITY|security|Security|SECURITY/i;
    
    if (securityPattern.test(logText)) {
      this.generateSuggestion({
        type: 'fix',
        priority: 'high',
        title: 'Security Issue',
        description: 'Security vulnerability detected',
        command: 'npm audit',
        reasoning: 'Security issue detected',
        confidence: 0.9
      });
    }
  }

  /**
   * Generate and store suggestion
   */
  private generateSuggestion(suggestion: Omit<TerminalSuggestion, 'id' | 'timestamp' | 'executed'>): void {
    const id = `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullSuggestion: TerminalSuggestion = {
      ...suggestion,
      id,
      timestamp: new Date(),
      executed: false
    };

    // Check if suggestion should be filtered
    if (this.shouldFilterSuggestion(fullSuggestion)) {
      return;
    }

    // Check confidence threshold
    if (fullSuggestion.confidence < this.config.suggestionThreshold) {
      return;
    }

    // Store suggestion
    this.suggestions.set(id, fullSuggestion);

    // Emit suggestion event
    this.emit('suggestion', fullSuggestion);

    // Auto-execute if enabled
    if (this.config.autoExecute && fullSuggestion.command) {
      this.executeSuggestion(id);
    }

    // Limit suggestions
    if (this.suggestions.size > this.config.maxSuggestions) {
      const oldestId = Array.from(this.suggestions.keys())[0];
      this.suggestions.delete(oldestId);
    }

    console.log(chalk.cyan(`💡 Suggestion: ${fullSuggestion.title}`));
    console.log(chalk.gray(`   ${fullSuggestion.description}`));
  }

  /**
   * Check if suggestion should be filtered
   */
  private shouldFilterSuggestion(suggestion: TerminalSuggestion): boolean {
    // Check blocklist
    if (this.blocklist.has(suggestion.id) || 
        this.blocklist.has(suggestion.title) ||
        this.blocklist.has(suggestion.type)) {
      return true;
    }

    // Check allowlist (if not empty, only allow listed items)
    if (this.allowlist.size > 0) {
      return !this.allowlist.has(suggestion.id) && 
             !this.allowlist.has(suggestion.title) &&
             !this.allowlist.has(suggestion.type);
    }

    return false;
  }

  /**
   * Execute a suggestion command
   */
  async executeSuggestion(suggestionId: string): Promise<boolean> {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion || !suggestion.command) {
      return false;
    }

    console.log(chalk.blue(`🚀 Executing: ${suggestion.command}`));
    
    try {
      const result = await this.executeCommand(suggestion.command);
      suggestion.executed = true;
      suggestion.result = result.success ? 'success' : 'failure';
      
      this.emit('suggestionExecuted', suggestion, result);
      
      if (result.success) {
        console.log(chalk.green(`✅ Command executed successfully`));
      } else {
        console.log(chalk.red(`❌ Command failed: ${result.error}`));
      }
      
      return result.success;
    } catch (error) {
      suggestion.executed = true;
      suggestion.result = 'failure';
      console.log(chalk.red(`❌ Execution error: ${error}`));
      return false;
    }
  }

  /**
   * Execute command in terminal
   */
  private executeCommand(command: string): Promise<{ success: boolean; output: string; error?: string }> {
    return new Promise((resolve) => {
      const child = spawn('sh', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: this.config.executionTimeout
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
        resolve({
          success: code === 0,
          output,
          error: error || undefined
        });
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          output,
          error: err.message
        });
      });
    });
  }

  /**
   * Add suggestion to allowlist
   */
  addToAllowlist(item: string): void {
    this.allowlist.add(item);
    this.saveFilters();
    console.log(chalk.green(`✅ Added "${item}" to allowlist`));
  }

  /**
   * Remove suggestion from allowlist
   */
  removeFromAllowlist(item: string): void {
    this.allowlist.delete(item);
    this.saveFilters();
    console.log(chalk.yellow(`🗑️ Removed "${item}" from allowlist`));
  }

  /**
   * Add suggestion to blocklist
   */
  addToBlocklist(item: string): void {
    this.blocklist.add(item);
    this.saveFilters();
    console.log(chalk.red(`🚫 Added "${item}" to blocklist`));
  }

  /**
   * Remove suggestion from blocklist
   */
  removeFromBlocklist(item: string): void {
    this.blocklist.delete(item);
    this.saveFilters();
    console.log(chalk.green(`✅ Removed "${item}" from blocklist`));
  }

  /**
   * Get current suggestions
   */
  getSuggestions(): TerminalSuggestion[] {
    return Array.from(this.suggestions.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get suggestions by type
   */
  getSuggestionsByType(type: string): TerminalSuggestion[] {
    return this.getSuggestions().filter(s => s.type === type);
  }

  /**
   * Clear all suggestions
   */
  clearSuggestions(): void {
    this.suggestions.clear();
    console.log(chalk.yellow('🗑️ Cleared all suggestions'));
  }

  /**
   * Load filters from files
   */
  private loadFilters(): void {
    try {
      if (existsSync(this.config.allowlistFile)) {
        const data = JSON.parse(readFileSync(this.config.allowlistFile, 'utf8'));
        this.allowlist = new Set(data.items || []);
      }
      
      if (existsSync(this.config.blocklistFile)) {
        const data = JSON.parse(readFileSync(this.config.blocklistFile, 'utf8'));
        this.blocklist = new Set(data.items || []);
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not load filter files'));
    }
  }

  /**
   * Save filters to files
   */
  private saveFilters(): void {
    try {
      const allowlistData = { items: Array.from(this.allowlist) };
      const blocklistData = { items: Array.from(this.blocklist) };
      
      writeFileSync(this.config.allowlistFile, JSON.stringify(allowlistData, null, 2));
      writeFileSync(this.config.blocklistFile, JSON.stringify(blocklistData, null, 2));
    } catch (error) {
      console.log(chalk.red('❌ Could not save filter files'));
    }
  }

  /**
   * Analyze process exit
   */
  private analyzeProcessExit(code: number | null): void {
    if (code !== 0) {
      this.generateSuggestion({
        type: 'debug',
        priority: 'high',
        title: 'Process Exit Error',
        description: `Process exited with code ${code}`,
        command: 'echo "Process exited with error code - check logs"',
        reasoning: `Process exited with non-zero code: ${code}`,
        confidence: 0.9
      });
    }
  }

  /**
   * Analyze process error
   */
  private analyzeProcessError(error: Error): void {
    this.generateSuggestion({
      type: 'debug',
      priority: 'critical',
      title: 'Process Error',
      description: `Process error: ${error.message}`,
      command: 'echo "Process error occurred - check system resources"',
      reasoning: `Process error: ${error.message}`,
      confidence: 1.0
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TerminalFeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(chalk.blue('⚙️ Terminal feedback configuration updated'));
  }

  /**
   * Get current configuration
   */
  getConfig(): TerminalFeedbackConfig {
    return { ...this.config };
  }
}
