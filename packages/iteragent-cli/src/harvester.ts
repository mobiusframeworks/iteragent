import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import chalk from 'chalk';

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'stdout' | 'stderr';
  message: string;
  category: 'startup' | 'request' | 'error' | 'build' | 'other';
  metadata?: Record<string, any>;
}

export interface HarvestedLogs {
  entries: LogEntry[];
  errors: LogEntry[];
  warnings: LogEntry[];
  summary: {
    totalEntries: number;
    errorCount: number;
    warningCount: number;
    categories: Record<string, number>;
  };
}

export class Harvester extends EventEmitter {
  private logs: LogEntry[] = [];
  private isCapturing = false;

  async captureLogs(serverProcess: ChildProcess, duration: number = 5000): Promise<HarvestedLogs> {
    console.log(chalk.blue(`📝 Capturing logs for ${duration}ms...`));
    
    this.logs = [];
    this.isCapturing = true;

    // Set up log listeners
    const stdoutListener = (data: Buffer) => {
      this.processLogEntry(data.toString(), 'stdout');
    };

    const stderrListener = (data: Buffer) => {
      this.processLogEntry(data.toString(), 'stderr');
    };

    serverProcess.stdout?.on('data', stdoutListener);
    serverProcess.stderr?.on('data', stderrListener);

    // Capture for specified duration
    await new Promise(resolve => setTimeout(resolve, duration));

    // Clean up listeners
    serverProcess.stdout?.off('data', stdoutListener);
    serverProcess.stderr?.off('data', stderrListener);
    
    this.isCapturing = false;

    return this.generateSummary();
  }

  private processLogEntry(rawLog: string, source: 'stdout' | 'stderr'): void {
    if (!this.isCapturing) return;

    const lines = rawLog.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const entry = this.parseLogLine(line, source);
      if (entry) {
        this.logs.push(entry);
        this.emit('log', entry);
      }
    }
  }

  private parseLogLine(line: string, source: 'stdout' | 'stderr'): LogEntry | null {
    const timestamp = new Date();
    
    // Determine log level
    let level: LogEntry['level'] = 'info';
    if (source === 'stderr') {
      level = 'error';
    } else if (line.toLowerCase().includes('warn')) {
      level = 'warn';
    } else if (line.toLowerCase().includes('error')) {
      level = 'error';
    } else if (line.toLowerCase().includes('debug')) {
      level = 'debug';
    }

    // Categorize the log entry
    const category = this.categorizeLog(line, level);

    // Extract metadata
    const metadata = this.extractMetadata(line);

    return {
      timestamp,
      level,
      source,
      message: line.trim(),
      category,
      metadata
    };
  }

  private categorizeLog(line: string, level: LogEntry['level']): LogEntry['category'] {
    const lowerLine = line.toLowerCase();

    if (level === 'error') {
      return 'error';
    }

    if (lowerLine.includes('started') || lowerLine.includes('listening') || lowerLine.includes('ready')) {
      return 'startup';
    }

    if (lowerLine.includes('get ') || lowerLine.includes('post ') || lowerLine.includes('put ') || 
        lowerLine.includes('delete ') || lowerLine.includes('request') || lowerLine.includes('response')) {
      return 'request';
    }

    if (lowerLine.includes('build') || lowerLine.includes('compiled') || lowerLine.includes('bundled') ||
        lowerLine.includes('webpack') || lowerLine.includes('vite')) {
      return 'build';
    }

    return 'other';
  }

  private extractMetadata(line: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract HTTP status codes
    const statusMatch = line.match(/\b(\d{3})\b/);
    if (statusMatch) {
      metadata.statusCode = parseInt(statusMatch[1]);
    }

    // Extract response times
    const timeMatch = line.match(/(\d+(?:\.\d+)?)ms/);
    if (timeMatch) {
      metadata.responseTime = parseFloat(timeMatch[1]);
    }

    // Extract file paths
    const pathMatch = line.match(/([\/\\][\w\-\.\/\\]+)/);
    if (pathMatch) {
      metadata.filePath = pathMatch[1];
    }

    // Extract line numbers
    const lineMatch = line.match(/:(\d+):/);
    if (lineMatch) {
      metadata.lineNumber = parseInt(lineMatch[1]);
    }

    return metadata;
  }

  private generateSummary(): HarvestedLogs {
    const errors = this.logs.filter(log => log.level === 'error');
    const warnings = this.logs.filter(log => log.level === 'warn');
    
    const categories: Record<string, number> = {};
    for (const log of this.logs) {
      categories[log.category] = (categories[log.category] || 0) + 1;
    }

    return {
      entries: this.logs,
      errors,
      warnings,
      summary: {
        totalEntries: this.logs.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        categories
      }
    };
  }

  // Utility method to filter logs by category
  getLogsByCategory(category: LogEntry['category']): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  // Utility method to get recent errors
  getRecentErrors(count: number = 10): LogEntry[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(-count);
  }

  // Utility method to check if server appears healthy
  isServerHealthy(): boolean {
    const recentErrors = this.getRecentErrors(5);
    const hasStartupMessage = this.logs.some(log => 
      log.category === 'startup' && 
      log.message.toLowerCase().includes('ready')
    );
    
    return hasStartupMessage && recentErrors.length === 0;
  }
}
