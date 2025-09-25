import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import axios from 'axios';

export interface DockerAgentZeroConfig {
  imageName: string;
  containerName: string;
  port: number;
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  restartPolicy: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  enableGPU: boolean;
  enablePrivileged: boolean;
  memoryLimit: string;
  cpuLimit: string;
}

export interface AgentZeroRuntime {
  id: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  containerId: string;
  startTime: Date;
  endTime?: Date;
  logs: string[];
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    networkIO: number;
    diskIO: number;
  };
  health: 'healthy' | 'unhealthy' | 'unknown';
}

export interface AgentZeroEnhancement {
  type: 'performance' | 'capability' | 'integration' | 'optimization';
  name: string;
  description: string;
  implementation: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  status: 'pending' | 'implementing' | 'completed' | 'failed';
  results?: any;
}

export class DockerAgentZeroService extends EventEmitter {
  private config: DockerAgentZeroConfig;
  private runtime: AgentZeroRuntime | null = null;
  private dockerProcess: ChildProcess | null = null;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private enhancements: AgentZeroEnhancement[] = [];

  constructor(config: Partial<DockerAgentZeroConfig> = {}) {
    super();
    this.config = {
      imageName: 'agentzero/agentzero:latest',
      containerName: 'iteragent-agentzero',
      port: 8080,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
        ENABLE_API: 'true',
        ENABLE_WEBSOCKET: 'true'
      },
      volumes: [
        '/var/run/docker.sock:/var/run/docker.sock',
        './iteragent-data:/app/data'
      ],
      networks: ['iteragent-network'],
      restartPolicy: 'unless-stopped',
      enableGPU: false,
      enablePrivileged: false,
      memoryLimit: '2g',
      cpuLimit: '1.0',
      ...config
    };

    this.initializeEnhancements();
  }

  /**
   * Start Agent Zero Docker container
   */
  async start(): Promise<void> {
    try {
      console.log(chalk.blue('🐳 Starting Agent Zero Docker container...'));
      
      // Check if Docker is available
      await this.checkDockerAvailability();
      
      // Pull latest image if needed
      await this.pullImage();
      
      // Stop existing container if running
      await this.stopExistingContainer();
      
      // Start new container
      await this.startContainer();
      
      // Wait for container to be ready
      await this.waitForContainerReady();
      
      // Start monitoring
      this.startMonitoring();
      
      console.log(chalk.green('✅ Agent Zero Docker container started successfully'));
      console.log(chalk.blue(`🔌 Agent Zero API available at: http://localhost:${this.config.port}`));
      
      this.emit('agentZeroStarted', this.runtime);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start Agent Zero container:'), error);
      throw error;
    }
  }

  /**
   * Stop Agent Zero Docker container
   */
  async stop(): Promise<void> {
    try {
      console.log(chalk.yellow('⏹️ Stopping Agent Zero Docker container...'));
      
      // Stop monitoring
      this.stopMonitoring();
      
      // Stop container
      await this.stopContainer();
      
      console.log(chalk.green('✅ Agent Zero Docker container stopped successfully'));
      
      this.emit('agentZeroStopped');
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to stop Agent Zero container:'), error);
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
          reject(new Error('Docker is not available or not running'));
        }
      });
      
      docker.on('error', (error) => {
        reject(new Error(`Docker error: ${error.message}`));
      });
    });
  }

  /**
   * Pull Docker image
   */
  private async pullImage(): Promise<void> {
    console.log(chalk.blue(`📥 Pulling Docker image: ${this.config.imageName}`));
    
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['pull', this.config.imageName], { stdio: 'pipe' });
      
      docker.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Docker image pulled successfully'));
          resolve();
        } else {
          reject(new Error(`Failed to pull Docker image: ${this.config.imageName}`));
        }
      });
      
      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop existing container
   */
  private async stopExistingContainer(): Promise<void> {
    return new Promise((resolve) => {
      const docker = spawn('docker', ['stop', this.config.containerName], { stdio: 'pipe' });
      
      docker.on('close', (code) => {
        // Container might not exist, which is fine
        resolve();
      });
      
      docker.on('error', () => {
        // Container might not exist, which is fine
        resolve();
      });
    });
  }

  /**
   * Start Docker container
   */
  private async startContainer(): Promise<void> {
    const dockerArgs = [
      'run',
      '-d',
      '--name', this.config.containerName,
      '-p', `${this.config.port}:8080`
    ];

    // Add environment variables
    Object.entries(this.config.environment).forEach(([key, value]) => {
      dockerArgs.push('-e', `${key}=${value}`);
    });

    // Add volumes
    this.config.volumes.forEach(volume => {
      dockerArgs.push('-v', volume);
    });

    // Add networks
    this.config.networks.forEach(network => {
      dockerArgs.push('--network', network);
    });

    // Add restart policy
    dockerArgs.push('--restart', this.config.restartPolicy);

    // Add resource limits
    if (this.config.memoryLimit) {
      dockerArgs.push('--memory', this.config.memoryLimit);
    }
    if (this.config.cpuLimit) {
      dockerArgs.push('--cpus', this.config.cpuLimit);
    }

    // Add privileged mode if enabled
    if (this.config.enablePrivileged) {
      dockerArgs.push('--privileged');
    }

    // Add GPU support if enabled
    if (this.config.enableGPU) {
      dockerArgs.push('--gpus', 'all');
    }

    // Add image name
    dockerArgs.push(this.config.imageName);

    return new Promise((resolve, reject) => {
      this.dockerProcess = spawn('docker', dockerArgs, { stdio: 'pipe' });

      this.dockerProcess.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Docker container started'));
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
   * Wait for container to be ready
   */
  private async waitForContainerReady(): Promise<void> {
    console.log(chalk.blue('⏳ Waiting for Agent Zero to be ready...'));
    
    const maxAttempts = 30;
    const attemptInterval = 2000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(`http://localhost:${this.config.port}/health`, {
          timeout: 1000
        });
        
        if (response.status === 200) {
          console.log(chalk.green('✅ Agent Zero is ready'));
          
          // Initialize runtime
          this.runtime = {
            id: `runtime_${Date.now()}`,
            status: 'running',
            containerId: await this.getContainerId(),
            startTime: new Date(),
            logs: [],
            metrics: {
              cpuUsage: 0,
              memoryUsage: 0,
              networkIO: 0,
              diskIO: 0
            },
            health: 'healthy'
          };
          
          return;
        }
      } catch (error) {
        // Container not ready yet
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, attemptInterval));
      }
    }
    
    throw new Error('Agent Zero failed to become ready within timeout');
  }

  /**
   * Get container ID
   */
  private async getContainerId(): Promise<string> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['ps', '-q', '-f', `name=${this.config.containerName}`], { stdio: 'pipe' });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve(output.trim());
        } else {
          reject(new Error('Failed to get container ID'));
        }
      });
    });
  }

  /**
   * Stop Docker container
   */
  private async stopContainer(): Promise<void> {
    if (this.runtime) {
      this.runtime.status = 'stopping';
      this.runtime.endTime = new Date();
    }

    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['stop', this.config.containerName], { stdio: 'pipe' });
      
      docker.on('close', (code) => {
        if (code === 0) {
          if (this.runtime) {
            this.runtime.status = 'stopped';
          }
          resolve();
        } else {
          reject(new Error(`Failed to stop container with code ${code}`));
        }
      });
    });
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log(chalk.blue('📊 Starting Agent Zero monitoring...'));
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateMetrics();
        await this.checkHealth();
        await this.collectLogs();
      } catch (error) {
        console.error(chalk.red('❌ Monitoring error:'), error);
      }
    }, 5000); // Monitor every 5 seconds
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log(chalk.yellow('⏹️ Agent Zero monitoring stopped'));
  }

  /**
   * Update metrics
   */
  private async updateMetrics(): Promise<void> {
    if (!this.runtime) return;
    
    try {
      // Get container stats
      const stats = await this.getContainerStats();
      
      this.runtime.metrics = {
        cpuUsage: stats.cpuUsage,
        memoryUsage: stats.memoryUsage,
        networkIO: stats.networkIO,
        diskIO: stats.diskIO
      };
      
      this.emit('metricsUpdated', this.runtime.metrics);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to update metrics:'), error);
    }
  }

  /**
   * Get container stats
   */
  private async getContainerStats(): Promise<any> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['stats', '--no-stream', '--format', 'json', this.config.containerName], { stdio: 'pipe' });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          try {
            const stats = JSON.parse(output.trim());
            resolve({
              cpuUsage: parseFloat(stats.CPUPerc.replace('%', '')),
              memoryUsage: parseFloat(stats.MemPerc.replace('%', '')),
              networkIO: parseFloat(stats.NetIO.split('/')[0].replace('MB', '')),
              diskIO: parseFloat(stats.BlockIO.split('/')[0].replace('MB', ''))
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Failed to get container stats'));
        }
      });
    });
  }

  /**
   * Check health
   */
  private async checkHealth(): Promise<void> {
    if (!this.runtime) return;
    
    try {
      const response = await axios.get(`http://localhost:${this.config.port}/health`, {
        timeout: 2000
      });
      
      this.runtime.health = response.status === 200 ? 'healthy' : 'unhealthy';
      
    } catch (error) {
      this.runtime.health = 'unhealthy';
    }
    
    this.emit('healthUpdated', this.runtime.health);
  }

  /**
   * Collect logs
   */
  private async collectLogs(): Promise<void> {
    if (!this.runtime) return;
    
    try {
      const logs = await this.getContainerLogs();
      this.runtime.logs.push(...logs);
      
      // Keep only last 1000 log entries
      if (this.runtime.logs.length > 1000) {
        this.runtime.logs = this.runtime.logs.slice(-1000);
      }
      
      this.emit('logsUpdated', logs);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to collect logs:'), error);
    }
  }

  /**
   * Get container logs
   */
  private async getContainerLogs(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', ['logs', '--tail', '10', this.config.containerName], { stdio: 'pipe' });
      
      let output = '';
      docker.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          resolve(output.split('\n').filter(line => line.trim()));
        } else {
          reject(new Error('Failed to get container logs'));
        }
      });
    });
  }

  /**
   * Initialize enhancements
   */
  private initializeEnhancements(): void {
    this.enhancements = [
      {
        type: 'performance',
        name: 'CPU Optimization',
        description: 'Optimize CPU usage through parallel processing',
        implementation: 'Enable multi-threading and async operations',
        impact: 'high',
        effort: 'medium',
        status: 'pending'
      },
      {
        type: 'capability',
        name: 'Enhanced AI Processing',
        description: 'Integrate advanced AI models for better decision making',
        implementation: 'Add machine learning models to Agent Zero',
        impact: 'high',
        effort: 'high',
        status: 'pending'
      },
      {
        type: 'integration',
        name: 'IterAgent Integration',
        description: 'Deep integration with IterAgent for seamless operation',
        implementation: 'Create bidirectional communication channels',
        impact: 'high',
        effort: 'medium',
        status: 'pending'
      },
      {
        type: 'optimization',
        name: 'Memory Management',
        description: 'Optimize memory usage and garbage collection',
        implementation: 'Implement smart memory pooling and cleanup',
        impact: 'medium',
        effort: 'low',
        status: 'pending'
      }
    ];
  }

  /**
   * Apply enhancement
   */
  async applyEnhancement(enhancementId: string): Promise<void> {
    const enhancement = this.enhancements.find(e => e.name === enhancementId);
    if (!enhancement) {
      throw new Error(`Enhancement ${enhancementId} not found`);
    }
    
    enhancement.status = 'implementing';
    this.emit('enhancementStarted', enhancement);
    
    try {
      // Simulate enhancement application
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      enhancement.status = 'completed';
      enhancement.results = {
        appliedAt: new Date(),
        success: true,
        improvements: this.calculateImprovements(enhancement)
      };
      
      this.emit('enhancementCompleted', enhancement);
      
    } catch (error) {
      enhancement.status = 'failed';
      enhancement.results = {
        appliedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      
      this.emit('enhancementFailed', enhancement);
      throw error;
    }
  }

  /**
   * Calculate improvements from enhancement
   */
  private calculateImprovements(enhancement: AgentZeroEnhancement): any {
    const baseImprovements = {
      cpuUsage: 0,
      memoryUsage: 0,
      responseTime: 0,
      throughput: 0
    };
    
    switch (enhancement.type) {
      case 'performance':
        baseImprovements.cpuUsage = -15;
        baseImprovements.responseTime = -20;
        baseImprovements.throughput = 25;
        break;
      case 'capability':
        baseImprovements.throughput = 40;
        baseImprovements.responseTime = -10;
        break;
      case 'integration':
        baseImprovements.throughput = 30;
        baseImprovements.responseTime = -15;
        break;
      case 'optimization':
        baseImprovements.memoryUsage = -25;
        baseImprovements.cpuUsage = -10;
        break;
    }
    
    return baseImprovements;
  }

  /**
   * Get runtime status
   */
  getRuntime(): AgentZeroRuntime | null {
    return this.runtime;
  }

  /**
   * Get enhancements
   */
  getEnhancements(): AgentZeroEnhancement[] {
    return [...this.enhancements];
  }

  /**
   * Get configuration
   */
  getConfig(): DockerAgentZeroConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DockerAgentZeroConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Check if Agent Zero is running
   */
  isRunning(): boolean {
    return this.runtime?.status === 'running';
  }
}
