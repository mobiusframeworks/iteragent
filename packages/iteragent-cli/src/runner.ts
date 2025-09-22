import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { EventEmitter } from 'events';

export interface ServerConfig {
  port: number;
  startCommand: string;
  workingDirectory?: string;
  env?: Record<string, string>;
}

export class Runner extends EventEmitter {
  private serverProcess: ChildProcess | null = null;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    super();
    this.config = config;
  }

  async startServer(): Promise<ChildProcess> {
    if (this.serverProcess) {
      await this.stopServer();
    }

    console.log(chalk.yellow(`🚀 Starting server: ${this.config.startCommand}`));
    
    const [command, ...args] = this.config.startCommand.split(' ');
    
    this.serverProcess = spawn(command, args, {
      cwd: this.config.workingDirectory || process.cwd(),
      env: { ...process.env, ...this.config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.serverProcess.on('error', (error) => {
      console.error(chalk.red('❌ Server error:'), error);
      this.emit('error', error);
    });

    this.serverProcess.on('exit', (code, signal) => {
      console.log(chalk.yellow(`📡 Server exited with code ${code}, signal ${signal}`));
      this.emit('exit', code, signal);
    });

    // Capture stdout and stderr
    this.serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log(chalk.gray(`[SERVER] ${output.trim()}`));
      this.emit('stdout', output);
    });

    this.serverProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      console.log(chalk.red(`[SERVER ERROR] ${output.trim()}`));
      this.emit('stderr', output);
    });

    return this.serverProcess;
  }

  async stopServer(): Promise<void> {
    if (this.serverProcess) {
      console.log(chalk.yellow('🛑 Stopping server...'));
      
      return new Promise((resolve) => {
        this.serverProcess!.on('exit', () => {
          this.serverProcess = null;
          resolve();
        });
        
        this.serverProcess!.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.serverProcess) {
            this.serverProcess.kill('SIGKILL');
          }
        }, 5000);
      });
    }
  }

  async waitForServer(port: number, timeout: number = 30000): Promise<void> {
    console.log(chalk.blue(`⏳ Waiting for server on port ${port}...`));
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://localhost:${port}`);
        if (response.ok) {
          console.log(chalk.green(`✅ Server is ready on port ${port}`));
          return;
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Server failed to start on port ${port} within ${timeout}ms`);
  }

  getServerProcess(): ChildProcess | null {
    return this.serverProcess;
  }

  isServerRunning(): boolean {
    return this.serverProcess !== null && !this.serverProcess.killed;
  }
}
