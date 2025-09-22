import { chromium, Browser, Page, BrowserContext } from 'playwright';
import chalk from 'chalk';

export interface TestResult {
  url: string;
  status: 'pass' | 'fail' | 'error';
  responseTime: number;
  errors: string[];
  warnings: string[];
  screenshots?: string[];
  accessibility?: {
    violations: any[];
    score: number;
  };
  performance?: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
}

export interface TestSuite {
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    averageResponseTime: number;
  };
}

export class Tester {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: {
    port: number;
    routes: string[];
    timeout: number;
    headless: boolean;
    takeScreenshots: boolean;
  };

  constructor(config: any) {
    this.config = {
      port: config.port || 3000,
      routes: config.routes || ['/'],
      timeout: config.testTimeout || 30000,
      headless: config.headless !== false,
      takeScreenshots: config.takeScreenshots !== false
    };
  }

  async runTests(): Promise<TestSuite> {
    console.log(chalk.blue('🧪 Starting Playwright tests...'));
    
    try {
      await this.initializeBrowser();
      
      const results: TestResult[] = [];
      
      for (const route of this.config.routes) {
        console.log(chalk.yellow(`Testing route: ${route}`));
        const result = await this.testRoute(route);
        results.push(result);
      }
      
      const summary = this.generateSummary(results);
      
      console.log(chalk.green(`✅ Tests completed: ${summary.passed}/${summary.total} passed`));
      
      return { results, summary };
      
    } catch (error) {
      console.error(chalk.red('❌ Test error:'), error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async initializeBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });
  }

  private async testRoute(route: string): Promise<TestResult> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const url = `http://localhost:${this.config.port}${route}`;
    const startTime = Date.now();
    
    const result: TestResult = {
      url,
      status: 'pass',
      responseTime: 0,
      errors: [],
      warnings: []
    };

    try {
      const page = await this.context.newPage();
      
      // Set up error listeners
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          result.errors.push(`Console error: ${msg.text()}`);
        } else if (msg.type() === 'warning') {
          result.warnings.push(`Console warning: ${msg.text()}`);
        }
      });

      page.on('pageerror', (error) => {
        result.errors.push(`Page error: ${error.message}`);
      });

      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout
      });

      result.responseTime = Date.now() - startTime;

      if (!response || !response.ok()) {
        result.status = 'fail';
        result.errors.push(`HTTP ${response?.status()}: ${response?.statusText()}`);
      }

      // Take screenshot if enabled
      if (this.config.takeScreenshots) {
        const screenshot = await page.screenshot({ fullPage: true });
        result.screenshots = [screenshot.toString('base64')];
      }

      // Basic accessibility check
      try {
        const accessibility = await this.checkAccessibility(page);
        result.accessibility = accessibility;
      } catch (error) {
        result.warnings.push(`Accessibility check failed: ${error}`);
      }

      // Basic performance metrics
      try {
        const performance = await this.getPerformanceMetrics(page);
        result.performance = performance;
      } catch (error) {
        result.warnings.push(`Performance check failed: ${error}`);
      }

      // Check for common issues
      await this.checkForCommonIssues(page, result);

      await page.close();

    } catch (error) {
      result.status = 'error';
      result.errors.push(`Test error: ${error}`);
      result.responseTime = Date.now() - startTime;
    }

    return result;
  }

  private async checkAccessibility(page: Page): Promise<TestResult['accessibility']> {
    // Basic accessibility checks
    const violations: any[] = [];
    
    // Check for missing alt text on images
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
    if (imagesWithoutAlt > 0) {
      violations.push({
        type: 'missing-alt-text',
        count: imagesWithoutAlt,
        description: 'Images missing alt text'
      });
    }

    // Check for missing form labels
    const inputsWithoutLabels = await page.$$eval('input:not([aria-label]):not([aria-labelledby])', inputs => 
      inputs.filter(input => !input.closest('label')).length
    );
    if (inputsWithoutLabels > 0) {
      violations.push({
        type: 'missing-form-labels',
        count: inputsWithoutLabels,
        description: 'Form inputs missing labels'
      });
    }

    // Calculate basic accessibility score
    const totalElements = await page.$$eval('*', elements => elements.length);
    const score = Math.max(0, 100 - (violations.length * 10));

    return {
      violations,
      score
    };
  }

  private async getPerformanceMetrics(page: Page): Promise<TestResult['performance']> {
    const metrics = await page.evaluate(() => {
      try {
        const navigation = (performance as any).getEntriesByType('navigation')[0];
        const paint = (performance as any).getEntriesByType('paint') || [];
        
        const fcp = paint.find((entry: any) => entry.name === 'first-contentful-paint');
        const lcp = (performance as any).getEntriesByType('largest-contentful-paint')[0];
        
        return {
          loadTime: navigation ? (navigation.loadEventEnd - navigation.loadEventStart) : 0,
          firstContentfulPaint: fcp ? fcp.startTime : 0,
          largestContentfulPaint: lcp ? lcp.startTime : 0
        };
      } catch (error) {
        return {
          loadTime: 0,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0
        };
      }
    });

    return metrics;
  }

  private async checkForCommonIssues(page: Page, result: TestResult): Promise<void> {
    // Check for 404 links
    const brokenLinks = await page.$$eval('a[href]', links => 
      links.filter(link => {
        const href = link.getAttribute('href');
        return href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:');
      }).length
    );

    if (brokenLinks > 0) {
      result.warnings.push(`Found ${brokenLinks} potentially broken links`);
    }

    // Check for JavaScript errors
    const jsErrors = await page.evaluate(() => {
      return (window as any).console?.error ? 'JavaScript errors detected' : null;
    });

    if (jsErrors) {
      result.warnings.push(jsErrors);
    }

    // Check for missing favicon
    const favicon = await page.$('link[rel="icon"]');
    if (!favicon) {
      result.warnings.push('Missing favicon');
    }

    // Check for viewport meta tag
    const viewport = await page.$('meta[name="viewport"]');
    if (!viewport) {
      result.warnings.push('Missing viewport meta tag');
    }
  }

  private generateSummary(results: TestResult[]): TestSuite['summary'] {
    const total = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    const totalResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0);
    const averageResponseTime = total > 0 ? totalResponseTime / total : 0;

    return {
      total,
      passed,
      failed,
      errors,
      averageResponseTime
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
