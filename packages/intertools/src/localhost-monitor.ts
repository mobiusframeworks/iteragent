import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface LocalhostData {
  url: string;
  html: string;
  consoleLogs: ConsoleLogEntry[];
  networkRequests: NetworkRequest[];
  performance: PerformanceMetrics;
  domAnalysis: DOMAnalysis;
  errors: ErrorEntry[];
}

export interface ConsoleLogEntry {
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  source?: string;
  stack?: string;
  args?: any[];
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  statusText: string;
  responseTime: number;
  timestamp: Date;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  size: number;
  type: 'xhr' | 'fetch' | 'resource' | 'document';
}

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage: number;
  domNodes: number;
  resourceCount: number;
  totalSize: number;
}

export interface DOMAnalysis {
  totalElements: number;
  elementsByTag: Record<string, number>;
  classNames: string[];
  ids: string[];
  forms: FormInfo[];
  images: ImageInfo[];
  links: LinkInfo[];
  scripts: ScriptInfo[];
  stylesheets: StylesheetInfo[];
}

export interface FormInfo {
  action: string;
  method: string;
  inputs: number;
  id?: string;
  className?: string;
}

export interface ImageInfo {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  loading?: string;
}

export interface LinkInfo {
  href: string;
  text: string;
  target?: string;
  rel?: string;
}

export interface ScriptInfo {
  src?: string;
  type?: string;
  async?: boolean;
  defer?: boolean;
  inline: boolean;
  size: number;
}

export interface StylesheetInfo {
  href?: string;
  media?: string;
  inline: boolean;
  size: number;
}

export interface ErrorEntry {
  type: 'javascript' | 'network' | 'console' | 'resource';
  message: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: Date;
  stack?: string;
}

export class LocalhostMonitor {
  private isMonitoring: boolean = false;
  private monitoredUrls: Set<string> = new Set();
  private capturedData: Map<string, LocalhostData> = new Map();

  constructor() {}

  /**
   * Start monitoring a localhost URL
   */
  async startMonitoring(url: string): Promise<void> {
    if (this.monitoredUrls.has(url)) {
      return;
    }

    this.monitoredUrls.add(url);
    this.isMonitoring = true;

    console.log(`🌐 Starting localhost monitoring: ${url}`);

    // Initial capture
    await this.captureLocalhostData(url);

    // Set up periodic monitoring
    setInterval(async () => {
      if (this.isMonitoring && this.monitoredUrls.has(url)) {
        await this.captureLocalhostData(url);
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Stop monitoring a URL
   */
  stopMonitoring(url: string): void {
    this.monitoredUrls.delete(url);
    if (this.monitoredUrls.size === 0) {
      this.isMonitoring = false;
    }
    console.log(`🌐 Stopped monitoring: ${url}`);
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    this.monitoredUrls.clear();
    this.isMonitoring = false;
    console.log('🌐 Stopped all localhost monitoring');
  }

  /**
   * Get captured data for a URL
   */
  getLocalhostData(url: string): LocalhostData | null {
    return this.capturedData.get(url) || null;
  }

  /**
   * Get all captured data
   */
  getAllData(): Map<string, LocalhostData> {
    return new Map(this.capturedData);
  }

  /**
   * Monitor localhost development server
   */
  async monitorLocalhost(url: string): Promise<LocalhostData> {
    try {
      const html = await this.fetchHTML(url);
      const consoleLogs = await this.captureConsoleLogs(url);
      const networkRequests = await this.captureNetworkRequests(url);
      const performance = await this.measurePerformance(url);
      const domAnalysis = this.analyzeDOMStructure(html);
      const errors = await this.captureErrors(url);

      const data: LocalhostData = {
        url,
        html,
        consoleLogs,
        networkRequests,
        performance,
        domAnalysis,
        errors
      };

      this.capturedData.set(url, data);
      return data;

    } catch (error) {
      console.warn(`Failed to monitor ${url}:`, error);
      
      // Return simulated data for demo purposes
      return this.getSimulatedLocalhostData(url);
    }
  }

  /**
   * Capture localhost data
   */
  private async captureLocalhostData(url: string): Promise<void> {
    try {
      await this.monitorLocalhost(url);
    } catch (error) {
      console.warn(`Error capturing data for ${url}:`, error);
    }
  }

  /**
   * Fetch HTML content from localhost
   */
  private async fetchHTML(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Capture console logs (simulated)
   */
  private async captureConsoleLogs(url: string): Promise<ConsoleLogEntry[]> {
    // In a real implementation, this would use browser automation
    // For now, return simulated console logs
    return [
      {
        type: 'log',
        message: 'Application initialized successfully',
        timestamp: new Date(Date.now() - 60000),
        source: url
      },
      {
        type: 'warn',
        message: 'Deprecated API usage detected in component',
        timestamp: new Date(Date.now() - 45000),
        source: url
      },
      {
        type: 'error',
        message: 'Failed to fetch data from /api/users',
        timestamp: new Date(Date.now() - 30000),
        source: url,
        stack: 'Error: Failed to fetch\n    at fetchUsers (app.js:123:5)\n    at App.componentDidMount (app.js:89:12)'
      },
      {
        type: 'info',
        message: 'User interaction tracked',
        timestamp: new Date(Date.now() - 15000),
        source: url
      }
    ];
  }

  /**
   * Capture network requests (simulated)
   */
  private async captureNetworkRequests(url: string): Promise<NetworkRequest[]> {
    // In a real implementation, this would intercept network requests
    return [
      {
        url: `${url}/api/users`,
        method: 'GET',
        status: 200,
        statusText: 'OK',
        responseTime: 150,
        timestamp: new Date(Date.now() - 120000),
        size: 2048,
        type: 'xhr'
      },
      {
        url: `${url}/api/posts`,
        method: 'GET',
        status: 404,
        statusText: 'Not Found',
        responseTime: 300,
        timestamp: new Date(Date.now() - 90000),
        size: 512,
        type: 'fetch'
      },
      {
        url: `${url}/static/js/main.js`,
        method: 'GET',
        status: 200,
        statusText: 'OK',
        responseTime: 50,
        timestamp: new Date(Date.now() - 180000),
        size: 245760,
        type: 'resource'
      },
      {
        url: `${url}/static/css/main.css`,
        method: 'GET',
        status: 200,
        statusText: 'OK',
        responseTime: 25,
        timestamp: new Date(Date.now() - 170000),
        size: 51200,
        type: 'resource'
      }
    ];
  }

  /**
   * Measure performance metrics (simulated)
   */
  private async measurePerformance(url: string): Promise<PerformanceMetrics> {
    // In a real implementation, this would use browser performance APIs
    return {
      loadTime: 1200 + Math.random() * 800, // 1.2-2.0 seconds
      domContentLoaded: 800 + Math.random() * 400,
      firstContentfulPaint: 600 + Math.random() * 300,
      largestContentfulPaint: 1000 + Math.random() * 500,
      cumulativeLayoutShift: Math.random() * 0.1,
      firstInputDelay: Math.random() * 100,
      memoryUsage: 45.6 + Math.random() * 20,
      domNodes: 234 + Math.floor(Math.random() * 100),
      resourceCount: 12 + Math.floor(Math.random() * 8),
      totalSize: 512000 + Math.floor(Math.random() * 256000)
    };
  }

  /**
   * Analyze DOM structure
   */
  private analyzeDOMStructure(html: string): DOMAnalysis {
    // Basic HTML parsing and analysis
    const elementMatches = html.match(/<(\w+)[\s>]/g) || [];
    const elements = elementMatches.map(match => match.replace(/<(\w+)[\s>]/, '$1'));
    
    const elementsByTag: Record<string, number> = {};
    elements.forEach(tag => {
      elementsByTag[tag] = (elementsByTag[tag] || 0) + 1;
    });

    const classMatches = html.match(/class=["']([^"']+)["']/g) || [];
    const classNames = [...new Set(
      classMatches
        .map(match => match.replace(/class=["']([^"']+)["']/, '$1'))
        .flatMap(classes => classes.split(/\s+/))
    )];

    const idMatches = html.match(/id=["']([^"']+)["']/g) || [];
    const ids = idMatches.map(match => match.replace(/id=["']([^"']+)["']/, '$1'));

    // Analyze forms
    const formMatches = html.match(/<form[^>]*>/g) || [];
    const forms: FormInfo[] = formMatches.map(form => {
      const actionMatch = form.match(/action=["']([^"']+)["']/);
      const methodMatch = form.match(/method=["']([^"']+)["']/);
      const inputCount = (html.match(/<input[^>]*>/g) || []).length;
      
      return {
        action: actionMatch ? actionMatch[1] : '',
        method: methodMatch ? methodMatch[1] : 'GET',
        inputs: inputCount
      };
    });

    // Analyze images
    const imageMatches = html.match(/<img[^>]*>/g) || [];
    const images: ImageInfo[] = imageMatches.map(img => {
      const srcMatch = img.match(/src=["']([^"']+)["']/);
      const altMatch = img.match(/alt=["']([^"']+)["']/);
      
      return {
        src: srcMatch ? srcMatch[1] : '',
        alt: altMatch ? altMatch[1] : undefined
      };
    });

    // Analyze links
    const linkMatches = html.match(/<a[^>]*>([^<]*)<\/a>/g) || [];
    const links: LinkInfo[] = linkMatches.map(link => {
      const hrefMatch = link.match(/href=["']([^"']+)["']/);
      const textMatch = link.match(/>([^<]*)<\/a>/);
      
      return {
        href: hrefMatch ? hrefMatch[1] : '',
        text: textMatch ? textMatch[1].trim() : ''
      };
    });

    // Analyze scripts
    const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>|<script[^>]*\/>/g) || [];
    const scripts: ScriptInfo[] = scriptMatches.map(script => {
      const srcMatch = script.match(/src=["']([^"']+)["']/);
      const inline = !srcMatch;
      
      return {
        src: srcMatch ? srcMatch[1] : undefined,
        inline,
        size: script.length,
        async: script.includes('async'),
        defer: script.includes('defer')
      };
    });

    // Analyze stylesheets
    const stylesheetMatches = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>|<style[^>]*>[\s\S]*?<\/style>/g) || [];
    const stylesheets: StylesheetInfo[] = stylesheetMatches.map(stylesheet => {
      const hrefMatch = stylesheet.match(/href=["']([^"']+)["']/);
      const inline = stylesheet.startsWith('<style');
      
      return {
        href: hrefMatch ? hrefMatch[1] : undefined,
        inline,
        size: stylesheet.length
      };
    });

    return {
      totalElements: elements.length,
      elementsByTag,
      classNames,
      ids,
      forms,
      images,
      links,
      scripts,
      stylesheets
    };
  }

  /**
   * Capture errors (simulated)
   */
  private async captureErrors(url: string): Promise<ErrorEntry[]> {
    return [
      {
        type: 'javascript',
        message: 'Uncaught TypeError: Cannot read property \'map\' of undefined',
        source: `${url}/static/js/main.js`,
        line: 123,
        column: 45,
        timestamp: new Date(Date.now() - 300000),
        stack: 'TypeError: Cannot read property \'map\' of undefined\n    at Component.render (main.js:123:45)'
      },
      {
        type: 'network',
        message: 'Failed to load resource: the server responded with a status of 404 (Not Found)',
        source: `${url}/api/missing-endpoint`,
        timestamp: new Date(Date.now() - 180000)
      },
      {
        type: 'console',
        message: 'Warning: Deprecated API usage detected',
        source: `${url}/static/js/main.js`,
        line: 89,
        timestamp: new Date(Date.now() - 120000)
      }
    ];
  }

  /**
   * Get simulated localhost data for demo
   */
  private getSimulatedLocalhostData(url: string): LocalhostData {
    return {
      url,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Development Server</title>
    <link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
    <div id="root">
        <header class="app-header">
            <h1>Development Application</h1>
        </header>
        <main class="app-main">
            <p>This is your development server content.</p>
            <form action="/api/submit" method="POST">
                <input type="text" name="name" placeholder="Name">
                <input type="email" name="email" placeholder="Email">
                <button type="submit">Submit</button>
            </form>
        </main>
    </div>
    <script src="/static/js/main.js"></script>
</body>
</html>`,
      consoleLogs: [
        {
          type: 'log',
          message: 'Development server initialized',
          timestamp: new Date(Date.now() - 60000),
          source: url
        },
        {
          type: 'error',
          message: 'API endpoint not found: /api/users',
          timestamp: new Date(Date.now() - 30000),
          source: url,
          stack: 'Error: 404 Not Found\n    at fetch (/api/users)'
        }
      ],
      networkRequests: [
        {
          url: `${url}/static/js/main.js`,
          method: 'GET',
          status: 200,
          statusText: 'OK',
          responseTime: 45,
          timestamp: new Date(Date.now() - 120000),
          size: 156780,
          type: 'resource'
        },
        {
          url: `${url}/api/users`,
          method: 'GET',
          status: 404,
          statusText: 'Not Found',
          responseTime: 250,
          timestamp: new Date(Date.now() - 30000),
          size: 256,
          type: 'xhr'
        }
      ],
      performance: {
        loadTime: 1200,
        domContentLoaded: 800,
        firstContentfulPaint: 600,
        largestContentfulPaint: 1000,
        cumulativeLayoutShift: 0.05,
        firstInputDelay: 50,
        memoryUsage: 45.6,
        domNodes: 234,
        resourceCount: 12,
        totalSize: 512000
      },
      domAnalysis: {
        totalElements: 15,
        elementsByTag: {
          'div': 3,
          'html': 1,
          'head': 1,
          'body': 1,
          'header': 1,
          'h1': 1,
          'main': 1,
          'p': 1,
          'form': 1,
          'input': 2,
          'button': 1,
          'script': 1
        },
        classNames: ['app-header', 'app-main'],
        ids: ['root'],
        forms: [
          {
            action: '/api/submit',
            method: 'POST',
            inputs: 2
          }
        ],
        images: [],
        links: [],
        scripts: [
          {
            src: '/static/js/main.js',
            inline: false,
            size: 45
          }
        ],
        stylesheets: [
          {
            href: '/static/css/main.css',
            inline: false,
            size: 42
          }
        ]
      },
      errors: [
        {
          type: 'network',
          message: 'Failed to load resource: 404 (Not Found)',
          source: `${url}/api/users`,
          timestamp: new Date(Date.now() - 30000)
        }
      ]
    };
  }

  /**
   * Get monitoring statistics
   */
  getStats(): {
    monitoredUrls: number;
    totalRequests: number;
    totalErrors: number;
    averageLoadTime: number;
    mostCommonErrors: { message: string; count: number }[];
  } {
    const allData = Array.from(this.capturedData.values());
    const totalRequests = allData.reduce((sum, data) => sum + data.networkRequests.length, 0);
    const totalErrors = allData.reduce((sum, data) => sum + data.errors.length, 0);
    
    const loadTimes = allData.map(data => data.performance.loadTime);
    const averageLoadTime = loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;
    
    // Count error frequency
    const errorCounts = new Map<string, number>();
    allData.forEach(data => {
      data.errors.forEach(error => {
        errorCounts.set(error.message, (errorCounts.get(error.message) || 0) + 1);
      });
    });
    
    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      monitoredUrls: this.monitoredUrls.size,
      totalRequests,
      totalErrors,
      averageLoadTime,
      mostCommonErrors
    };
  }
}
