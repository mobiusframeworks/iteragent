import { chromium, Browser, Page, BrowserContext } from 'playwright';
import chalk from 'chalk';

export interface TradingTestResult {
  url: string;
  status: 'pass' | 'fail' | 'error';
  responseTime: number;
  errors: string[];
  warnings: string[];
  financialData?: {
    hasPriceData: boolean;
    hasVolumeData: boolean;
    dataFreshness: number; // minutes since last update
    dataValidation: boolean;
  };
  apiEndpoints?: {
    endpoint: string;
    status: number;
    responseTime: number;
    hasData: boolean;
  }[];
  tradingFeatures?: {
    backtestAvailable: boolean;
    strategiesAvailable: boolean;
    chartsRendering: boolean;
    alertsWorking: boolean;
  };
}

export interface TradingTestSuite {
  results: TradingTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    averageResponseTime: number;
    financialDataHealth: number; // percentage
    tradingFeaturesHealth: number; // percentage
  };
}

export class TradingTester {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: {
    port: number;
    routes: string[];
    timeout: number;
    headless: boolean;
    takeScreenshots: boolean;
    apiEndpoints: string[];
  };

  constructor(config: any) {
    this.config = {
      port: config.port || 8000,
      routes: config.routes || ['/'],
      timeout: config.testTimeout || 60000,
      headless: config.headless !== false,
      takeScreenshots: config.takeScreenshots !== false,
      apiEndpoints: config.trading?.apiEndpoints || []
    };
  }

  async runTests(): Promise<TradingTestSuite> {
    console.log(chalk.blue('🧪 Starting Trading Bot Tests...'));
    
    try {
      await this.initializeBrowser();
      
      const results: TradingTestResult[] = [];
      
      // Test main routes
      for (const route of this.config.routes) {
        console.log(chalk.yellow(`Testing route: ${route}`));
        const result = await this.testTradingRoute(route);
        results.push(result);
      }
      
      // Test API endpoints
      for (const endpoint of this.config.apiEndpoints) {
        console.log(chalk.yellow(`Testing API endpoint: ${endpoint}`));
        const result = await this.testApiEndpoint(endpoint);
        results.push(result);
      }
      
      const summary = this.generateTradingSummary(results);
      
      console.log(chalk.green(`✅ Trading tests completed: ${summary.passed}/${summary.total} passed`));
      console.log(chalk.blue(`📊 Financial data health: ${summary.financialDataHealth}%`));
      console.log(chalk.blue(`📈 Trading features health: ${summary.tradingFeaturesHealth}%`));
      
      return { results, summary };
      
    } catch (error) {
      console.error(chalk.red('❌ Trading test error:'), error);
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

  private async testTradingRoute(route: string): Promise<TradingTestResult> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const url = `http://localhost:${this.config.port}${route}`;
    const startTime = Date.now();
    
    const result: TradingTestResult = {
      url,
      status: 'pass',
      responseTime: 0,
      errors: [],
      warnings: [],
      financialData: {
        hasPriceData: false,
        hasVolumeData: false,
        dataFreshness: 0,
        dataValidation: true
      },
      tradingFeatures: {
        backtestAvailable: false,
        strategiesAvailable: false,
        chartsRendering: false,
        alertsWorking: false
      }
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
      } else {
        // Test financial data
        await this.testFinancialData(page, result);
        
        // Test trading features
        await this.testTradingFeatures(page, result);
        
        // Test API endpoints from the page
        await this.testPageApiEndpoints(page, result);
      }

      await page.close();

    } catch (error) {
      result.status = 'error';
      result.errors.push(`Test error: ${error}`);
      result.responseTime = Date.now() - startTime;
    }

    return result;
  }

  private async testApiEndpoint(endpoint: string): Promise<TradingTestResult> {
    const url = `http://localhost:${this.config.port}${endpoint}`;
    const startTime = Date.now();
    
    const result: TradingTestResult = {
      url,
      status: 'pass',
      responseTime: 0,
      errors: [],
      warnings: [],
      apiEndpoints: [{
        endpoint,
        status: 0,
        responseTime: 0,
        hasData: false
      }]
    };

    try {
      const response = await fetch(url);
      result.responseTime = Date.now() - startTime;
      
      if (result.apiEndpoints) {
        result.apiEndpoints[0].status = response.status;
        result.apiEndpoints[0].responseTime = result.responseTime;
      }

      if (!response.ok) {
        result.status = 'fail';
        result.errors.push(`API endpoint ${endpoint} returned ${response.status}`);
      } else {
        const data = await response.json();
        
        if (result.apiEndpoints) {
          result.apiEndpoints[0].hasData = this.validateFinancialData(data);
        }
        
        // Validate response structure for trading endpoints
        this.validateTradingApiResponse(endpoint, data, result);
      }

    } catch (error) {
      result.status = 'error';
      result.errors.push(`API test error: ${error}`);
      result.responseTime = Date.now() - startTime;
    }

    return result;
  }

  private async testFinancialData(page: Page, result: TradingTestResult): Promise<void> {
    try {
      // Check for price data elements
      const priceElements = await page.$$('[data-testid*="price"], .price, [class*="price"]');
      result.financialData!.hasPriceData = priceElements.length > 0;

      // Check for volume data elements
      const volumeElements = await page.$$('[data-testid*="volume"], .volume, [class*="volume"]');
      result.financialData!.hasVolumeData = volumeElements.length > 0;

      // Check for charts
      const charts = await page.$$('canvas, svg, [class*="chart"]');
      result.tradingFeatures!.chartsRendering = charts.length > 0;

      // Check data freshness
      const timestampElements = await page.$$('[data-testid*="timestamp"], .timestamp, [class*="timestamp"]');
      if (timestampElements.length > 0) {
        const timestampText = await timestampElements[0].textContent();
        result.financialData!.dataFreshness = this.parseDataFreshness(timestampText || '');
      }

    } catch (error) {
      result.warnings.push(`Financial data test error: ${error}`);
    }
  }

  private async testTradingFeatures(page: Page, result: TradingTestResult): Promise<void> {
    try {
      // Check for backtest functionality
      const backtestElements = await page.$$('[data-testid*="backtest"], .backtest, [class*="backtest"]');
      result.tradingFeatures!.backtestAvailable = backtestElements.length > 0;

      // Check for strategy selection
      const strategyElements = await page.$$('[data-testid*="strategy"], .strategy, [class*="strategy"]');
      result.tradingFeatures!.strategiesAvailable = strategyElements.length > 0;

      // Check for alert functionality
      const alertElements = await page.$$('[data-testid*="alert"], .alert, [class*="alert"]');
      result.tradingFeatures!.alertsWorking = alertElements.length > 0;

    } catch (error) {
      result.warnings.push(`Trading features test error: ${error}`);
    }
  }

  private async testPageApiEndpoints(page: Page, result: TradingTestResult): Promise<void> {
    try {
      // Monitor network requests
      const requests: any[] = [];
      
      page.on('request', (request) => {
        if (request.url().includes('/api/')) {
          requests.push({
            url: request.url(),
            method: request.method()
          });
        }
      });

      // Wait for API calls to complete
      await page.waitForTimeout(2000);

      // Test each API endpoint found
      for (const request of requests) {
        try {
          const response = await fetch(request.url);
          if (!response.ok) {
            result.warnings.push(`API endpoint ${request.url} returned ${response.status}`);
          }
        } catch (error) {
          result.warnings.push(`API endpoint ${request.url} failed: ${error}`);
        }
      }

    } catch (error) {
      result.warnings.push(`Page API test error: ${error}`);
    }
  }

  private validateFinancialData(data: any): boolean {
    // Basic validation for financial data structure
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    // Check for common financial data fields
    const financialFields = ['price', 'volume', 'timestamp', 'symbol', 'open', 'high', 'low', 'close'];
    const hasFinancialFields = financialFields.some(field => 
      data.hasOwnProperty(field) || 
      (Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty(field))
    );

    return hasFinancialFields;
  }

  private validateTradingApiResponse(endpoint: string, data: any, result: TradingTestResult): void {
    // Endpoint-specific validation
    if (endpoint.includes('backtest')) {
      this.validateBacktestResponse(data, result);
    } else if (endpoint.includes('strategy')) {
      this.validateStrategyResponse(data, result);
    } else if (endpoint.includes('ticker') || endpoint.includes('btc') || endpoint.includes('tesla')) {
      this.validateTickerResponse(data, result);
    }
  }

  private validateBacktestResponse(data: any, result: TradingTestResult): void {
    const requiredFields = ['total_return', 'sharpe_ratio', 'max_drawdown', 'total_trades', 'win_rate'];
    const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      result.warnings.push(`Backtest response missing fields: ${missingFields.join(', ')}`);
    }

    // Validate performance metrics
    if (data.total_return !== undefined && (data.total_return < -1 || data.total_return > 10)) {
      result.warnings.push(`Suspicious total return value: ${data.total_return}`);
    }

    if (data.sharpe_ratio !== undefined && (data.sharpe_ratio < -5 || data.sharpe_ratio > 10)) {
      result.warnings.push(`Suspicious Sharpe ratio value: ${data.sharpe_ratio}`);
    }
  }

  private validateStrategyResponse(data: any, result: TradingTestResult): void {
    if (!Array.isArray(data) && typeof data !== 'object') {
      result.warnings.push('Strategy response should be an array or object');
      return;
    }

    const strategies = Array.isArray(data) ? data : [data];
    
    strategies.forEach((strategy, index) => {
      if (!strategy.name && !strategy.id) {
        result.warnings.push(`Strategy ${index} missing name or id`);
      }
    });
  }

  private validateTickerResponse(data: any, result: TradingTestResult): void {
    const requiredFields = ['symbol', 'price'];
    const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      result.warnings.push(`Ticker response missing fields: ${missingFields.join(', ')}`);
    }

    // Validate price data
    if (data.price !== undefined && (data.price <= 0 || data.price > 1000000)) {
      result.warnings.push(`Suspicious price value: ${data.price}`);
    }
  }

  private parseDataFreshness(timestampText: string): number {
    // Parse various timestamp formats and return minutes since last update
    const now = new Date();
    
    // Try to parse ISO timestamp
    const isoMatch = timestampText.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    if (isoMatch) {
      const timestamp = new Date(isoMatch[0]);
      return Math.floor((now.getTime() - timestamp.getTime()) / 60000);
    }

    // Try to parse relative time (e.g., "5 minutes ago")
    const relativeMatch = timestampText.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
    if (relativeMatch) {
      const value = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2];
      
      switch (unit) {
        case 'minute': return value;
        case 'hour': return value * 60;
        case 'day': return value * 1440;
        default: return 0;
      }
    }

    return 0; // Unknown format
  }

  private generateTradingSummary(results: TradingTestResult[]): TradingTestSuite['summary'] {
    const total = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    const totalResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0);
    const averageResponseTime = total > 0 ? totalResponseTime / total : 0;

    // Calculate financial data health
    const financialDataResults = results.filter(r => r.financialData);
    const financialDataHealth = financialDataResults.length > 0 
      ? (financialDataResults.filter(r => r.financialData!.hasPriceData && r.financialData!.hasVolumeData).length / financialDataResults.length) * 100
      : 0;

    // Calculate trading features health
    const tradingFeaturesResults = results.filter(r => r.tradingFeatures);
    const tradingFeaturesHealth = tradingFeaturesResults.length > 0
      ? (tradingFeaturesResults.filter(r => 
          r.tradingFeatures!.chartsRendering && 
          (r.tradingFeatures!.backtestAvailable || r.tradingFeatures!.strategiesAvailable)
        ).length / tradingFeaturesResults.length) * 100
      : 0;

    return {
      total,
      passed,
      failed,
      errors,
      averageResponseTime,
      financialDataHealth,
      tradingFeaturesHealth
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
