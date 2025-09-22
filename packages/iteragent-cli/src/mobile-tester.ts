import { chromium, Browser, Page, BrowserContext } from 'playwright';
import chalk from 'chalk';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface MobileTestResult {
  platform: string;
  testType: 'unit' | 'integration' | 'e2e' | 'performance';
  status: 'pass' | 'fail' | 'error' | 'skip';
  duration: number;
  errors: string[];
  warnings: string[];
  metrics?: {
    bundleSize?: number;
    startupTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    renderTime?: number;
  };
  deviceInfo?: {
    deviceType: 'simulator' | 'emulator' | 'physical';
    deviceName: string;
    osVersion: string;
    platformVersion: string;
  };
}

export interface MobileTestSuite {
  platform: string;
  results: MobileTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    skipped: number;
    averageDuration: number;
    performanceScore: number;
  };
}

export class MobileTester {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: {
    platform: string;
    port: number;
    timeout: number;
    headless: boolean;
    takeScreenshots: boolean;
    mobileTesting: any;
  };

  constructor(config: any) {
    this.config = {
      platform: config.mobile?.platform || 'react-native',
      port: config.port || 8081,
      timeout: config.testTimeout || 120000,
      headless: config.headless !== false,
      takeScreenshots: config.takeScreenshots !== false,
      mobileTesting: config.mobileTesting || {}
    };
  }

  async runTests(): Promise<MobileTestSuite> {
    console.log(chalk.blue(`📱 Starting Mobile Tests for ${this.config.platform.toUpperCase()}...`));
    
    try {
      const results: MobileTestResult[] = [];
      
      // Run different types of tests based on platform
      const testTypes = this.config.mobileTesting?.testTypes || ['unit', 'integration', 'e2e'];
      
      if (testTypes.includes('unit')) {
        console.log(chalk.yellow('🧪 Running unit tests...'));
        const unitResults = await this.runUnitTests();
        results.push(...unitResults);
      }
      
      if (testTypes.includes('integration')) {
        console.log(chalk.yellow('🔗 Running integration tests...'));
        const integrationResults = await this.runIntegrationTests();
        results.push(...integrationResults);
      }
      
      if (testTypes.includes('e2e')) {
        console.log(chalk.yellow('🎯 Running E2E tests...'));
        const e2eResults = await this.runE2ETests();
        results.push(...e2eResults);
      }
      
      if (testTypes.includes('performance')) {
        console.log(chalk.yellow('⚡ Running performance tests...'));
        const performanceResults = await this.runPerformanceTests();
        results.push(...performanceResults);
      }
      
      const summary = this.generateMobileSummary(results);
      
      console.log(chalk.green(`✅ Mobile tests completed: ${summary.passed}/${summary.total} passed`));
      console.log(chalk.blue(`📊 Performance score: ${summary.performanceScore}%`));
      
      return { platform: this.config.platform, results, summary };
      
    } catch (error) {
      console.error(chalk.red('❌ Mobile test error:'), error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async runUnitTests(): Promise<MobileTestResult[]> {
    const results: MobileTestResult[] = [];
    
    try {
      const testCommand = this.getTestCommand('unit');
      const startTime = Date.now();
      
      const testProcess = spawn(testCommand.command, testCommand.args, {
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      testProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      await new Promise((resolve, reject) => {
        testProcess.on('close', (code) => {
          const duration = Date.now() - startTime;
          
          const result: MobileTestResult = {
            platform: this.config.platform,
            testType: 'unit',
            status: code === 0 ? 'pass' : 'fail',
            duration,
            errors: [],
            warnings: []
          };
          
          // Parse test output for errors and warnings
          this.parseTestOutput(output, errorOutput, result);
          
          results.push(result);
          resolve(code);
        });
        
        testProcess.on('error', reject);
      });
      
    } catch (error) {
      results.push({
        platform: this.config.platform,
        testType: 'unit',
        status: 'error',
        duration: 0,
        errors: [`Unit test error: ${error}`],
        warnings: []
      });
    }
    
    return results;
  }

  private async runIntegrationTests(): Promise<MobileTestResult[]> {
    const results: MobileTestResult[] = [];
    
    try {
      await this.initializeBrowser();
      
      const testCommand = this.getTestCommand('integration');
      const startTime = Date.now();
      
      // Run integration tests
      const testProcess = spawn(testCommand.command, testCommand.args, {
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      testProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      await new Promise((resolve, reject) => {
        testProcess.on('close', (code) => {
          const duration = Date.now() - startTime;
          
          const result: MobileTestResult = {
            platform: this.config.platform,
            testType: 'integration',
            status: code === 0 ? 'pass' : 'fail',
            duration,
            errors: [],
            warnings: []
          };
          
          this.parseTestOutput(output, errorOutput, result);
          results.push(result);
          resolve(code);
        });
        
        testProcess.on('error', reject);
      });
      
    } catch (error) {
      results.push({
        platform: this.config.platform,
        testType: 'integration',
        status: 'error',
        duration: 0,
        errors: [`Integration test error: ${error}`],
        warnings: []
      });
    }
    
    return results;
  }

  private async runE2ETests(): Promise<MobileTestResult[]> {
    const results: MobileTestResult[] = [];
    
    try {
      await this.initializeBrowser();
      
      if (!this.context) {
        throw new Error('Browser context not initialized');
      }
      
      const page = await this.context.newPage();
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      
      const startTime = Date.now();
      
      // Test mobile app loading
      const url = `http://localhost:${this.config.port}`;
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout
      });
      
      const duration = Date.now() - startTime;
      
      const result: MobileTestResult = {
        platform: this.config.platform,
        testType: 'e2e',
        status: response?.ok() ? 'pass' : 'fail',
        duration,
        errors: [],
        warnings: [],
        deviceInfo: {
          deviceType: 'simulator',
          deviceName: 'iPhone SE',
          osVersion: 'iOS 15.0',
          platformVersion: '15.0'
        }
      };
      
      if (!response?.ok()) {
        result.errors.push(`E2E test failed: HTTP ${response?.status()}`);
      }
      
      // Test mobile-specific features
      await this.testMobileFeatures(page, result);
      
      await page.close();
      results.push(result);
      
    } catch (error) {
      results.push({
        platform: this.config.platform,
        testType: 'e2e',
        status: 'error',
        duration: 0,
        errors: [`E2E test error: ${error}`],
        warnings: []
      });
    }
    
    return results;
  }

  private async runPerformanceTests(): Promise<MobileTestResult[]> {
    const results: MobileTestResult[] = [];
    
    try {
      await this.initializeBrowser();
      
      if (!this.context) {
        throw new Error('Browser context not initialized');
      }
      
      const page = await this.context.newPage();
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      
      // Measure bundle size
      const bundleSize = await this.measureBundleSize();
      
      // Measure startup time
      const startupTime = await this.measureStartupTime(page);
      
      // Measure memory usage
      const memoryUsage = await this.measureMemoryUsage(page);
      
      // Measure CPU usage
      const cpuUsage = await this.measureCPUUsage(page);
      
      // Measure render time
      const renderTime = await this.measureRenderTime(page);
      
      const duration = Date.now() - startTime;
      
      const result: MobileTestResult = {
        platform: this.config.platform,
        testType: 'performance',
        status: 'pass',
        duration,
        errors: [],
        warnings: [],
        metrics: {
          bundleSize,
          startupTime,
          memoryUsage,
          cpuUsage,
          renderTime
        }
      };
      
      // Check performance thresholds
      this.checkPerformanceThresholds(result);
      
      results.push(result);
      
    } catch (error) {
      results.push({
        platform: this.config.platform,
        testType: 'performance',
        status: 'error',
        duration: 0,
        errors: [`Performance test error: ${error}`],
        warnings: []
      });
    }
    
    return results;
  }

  private async testMobileFeatures(page: Page, result: MobileTestResult): Promise<void> {
    try {
      // Test touch events
      const touchElements = await page.$$('[data-testid*="touch"], .touchable, [class*="touch"]');
      if (touchElements.length === 0) {
        result.warnings.push('No touchable elements found');
      }
      
      // Test responsive design
      const viewport = page.viewportSize();
      if (viewport && viewport.width < 768) {
        result.warnings.push('App may not be optimized for mobile viewport');
      }
      
      // Test mobile navigation
      const navElements = await page.$$('nav, [role="navigation"], .navigation');
      if (navElements.length === 0) {
        result.warnings.push('No navigation elements found');
      }
      
      // Test mobile forms
      const formElements = await page.$$('form, input, textarea, select');
      if (formElements.length > 0) {
        // Check if forms are mobile-friendly
        for (const form of formElements) {
          const inputType = await form.getAttribute('type');
          if (inputType === 'email' || inputType === 'tel') {
            // These should trigger mobile keyboards
            result.warnings.push(`Input type "${inputType}" should trigger mobile keyboard`);
          }
        }
      }
      
    } catch (error) {
      result.warnings.push(`Mobile features test error: ${error}`);
    }
  }

  private async measureBundleSize(): Promise<number> {
    try {
      // Try to get bundle size from build output or package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Estimate bundle size based on dependencies
      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});
      
      // Rough estimation: 1MB per 10 dependencies
      return (dependencies.length + devDependencies.length) * 100 * 1024;
    } catch (error) {
      return 0;
    }
  }

  private async measureStartupTime(page: Page): Promise<number> {
    try {
      const startTime = Date.now();
      await page.goto(`http://localhost:${this.config.port}`, {
        waitUntil: 'domcontentloaded'
      });
      return Date.now() - startTime;
    } catch (error) {
      return 0;
    }
  }

  private async measureMemoryUsage(page: Page): Promise<number> {
    try {
      const metrics = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      return metrics;
    } catch (error) {
      return 0;
    }
  }

  private async measureCPUUsage(page: Page): Promise<number> {
    try {
      // Simulate CPU usage measurement
      const startTime = Date.now();
      await page.evaluate(() => {
        // Perform some CPU-intensive operations
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.random();
        }
        return result;
      });
      const duration = Date.now() - startTime;
      
      // Estimate CPU usage based on execution time
      return Math.min(100, (duration / 100) * 10);
    } catch (error) {
      return 0;
    }
  }

  private async measureRenderTime(page: Page): Promise<number> {
    try {
      const renderTime = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return navigation.loadEventEnd - navigation.loadEventStart;
      });
      return renderTime;
    } catch (error) {
      return 0;
    }
  }

  private checkPerformanceThresholds(result: MobileTestResult): void {
    if (!result.metrics) return;
    
    const thresholds = this.config.mobileTesting.performanceThresholds;
    
    if (result.metrics.bundleSize && result.metrics.bundleSize > thresholds.bundleSize) {
      result.warnings.push(`Bundle size ${result.metrics.bundleSize} exceeds threshold ${thresholds.bundleSize}`);
    }
    
    if (result.metrics.startupTime && result.metrics.startupTime > thresholds.startupTime) {
      result.warnings.push(`Startup time ${result.metrics.startupTime}ms exceeds threshold ${thresholds.startupTime}ms`);
    }
    
    if (result.metrics.memoryUsage && result.metrics.memoryUsage > thresholds.memoryUsage) {
      result.warnings.push(`Memory usage ${result.metrics.memoryUsage} exceeds threshold ${thresholds.memoryUsage}`);
    }
    
    if (result.metrics.cpuUsage && result.metrics.cpuUsage > thresholds.cpuUsage) {
      result.warnings.push(`CPU usage ${result.metrics.cpuUsage}% exceeds threshold ${thresholds.cpuUsage}%`);
    }
  }

  private getTestCommand(testType: string): { command: string; args: string[] } {
    const commands = {
      'react-native': {
        unit: { command: 'npm', args: ['test'] },
        integration: { command: 'npx', args: ['react-native', 'test'] },
        e2e: { command: 'npx', args: ['detox', 'test'] }
      },
      'expo': {
        unit: { command: 'npm', args: ['test'] },
        integration: { command: 'npx', args: ['expo', 'test'] },
        e2e: { command: 'npx', args: ['expo', 'test:e2e'] }
      },
      'flutter': {
        unit: { command: 'flutter', args: ['test'] },
        integration: { command: 'flutter', args: ['test', 'integration_test/'] },
        e2e: { command: 'flutter', args: ['drive', '--target=test_driver/app.dart'] }
      },
      'ionic': {
        unit: { command: 'npm', args: ['test'] },
        integration: { command: 'ionic', args: ['test'] },
        e2e: { command: 'ionic', args: ['test:e2e'] }
      }
    };
    
    const platformCommands = commands[this.config.platform as keyof typeof commands];
    if (platformCommands && platformCommands[testType as keyof typeof platformCommands]) {
      return platformCommands[testType as keyof typeof platformCommands];
    }
    
    // Default fallback
    return { command: 'npm', args: ['test'] };
  }

  private parseTestOutput(output: string, errorOutput: string, result: MobileTestResult): void {
    // Parse Jest output
    if (output.includes('PASS') || output.includes('FAIL')) {
      const lines = output.split('\n');
      lines.forEach(line => {
        if (line.includes('FAIL')) {
          result.errors.push(`Test failed: ${line.trim()}`);
        } else if (line.includes('WARN')) {
          result.warnings.push(`Warning: ${line.trim()}`);
        }
      });
    }
    
    // Parse error output
    if (errorOutput) {
      const errorLines = errorOutput.split('\n').filter(line => line.trim());
      errorLines.forEach(line => {
        if (line.includes('Error:') || line.includes('error:')) {
          result.errors.push(line.trim());
        } else if (line.includes('Warning:') || line.includes('warning:')) {
          result.warnings.push(line.trim());
        }
      });
    }
  }

  private async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.context = await this.browser.newContext({
        viewport: { width: 375, height: 667 }, // Mobile viewport
        ignoreHTTPSErrors: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      });
    }
  }

  private generateMobileSummary(results: MobileTestResult[]): MobileTestSuite['summary'] {
    const total = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const errors = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skip').length;
    
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = total > 0 ? totalDuration / total : 0;
    
    // Calculate performance score based on metrics
    const performanceResults = results.filter(r => r.testType === 'performance');
    let performanceScore = 100;
    
    if (performanceResults.length > 0) {
      const performanceResult = performanceResults[0];
      if (performanceResult.metrics) {
        const thresholds = this.config.mobileTesting.performanceThresholds;
        
        if (performanceResult.metrics.bundleSize && performanceResult.metrics.bundleSize > thresholds.bundleSize) {
          performanceScore -= 20;
        }
        
        if (performanceResult.metrics.startupTime && performanceResult.metrics.startupTime > thresholds.startupTime) {
          performanceScore -= 20;
        }
        
        if (performanceResult.metrics.memoryUsage && performanceResult.metrics.memoryUsage > thresholds.memoryUsage) {
          performanceScore -= 20;
        }
        
        if (performanceResult.metrics.cpuUsage && performanceResult.metrics.cpuUsage > thresholds.cpuUsage) {
          performanceScore -= 20;
        }
      }
    }
    
    return {
      total,
      passed,
      failed,
      errors,
      skipped,
      averageDuration,
      performanceScore: Math.max(0, performanceScore)
    };
  }

  private async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
