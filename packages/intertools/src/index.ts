// InterTools - Professional Console Log Analysis and IDE Integration
// Full-access model: 7-day trial, then PRO subscription

import { checkTrialStatus, isTrialExpired, getInstallDate, showUpgradePrompt, getTrialStats } from './trial-manager';
import { TerminalMonitor, TerminalLogEntry, BuildProcessInfo } from './terminal-monitor';
import { LocalhostMonitor, LocalhostData, ConsoleLogEntry, NetworkRequest, PerformanceMetrics } from './localhost-monitor';
import { ProductionMonitor, ProductionData, ProductionError, AnalyticsData } from './production-monitor';
import { ChatOrchestrator, ChatMessage, ChatContext, ChatAnalysis } from './chat-orchestrator';
import { GoogleAnalyticsIntegration, GoogleAnalyticsConfig, AnalyticsReport } from './analytics-integration';

// Export all types
export {
  TerminalLogEntry,
  BuildProcessInfo,
  LocalhostData,
  ConsoleLogEntry,
  NetworkRequest,
  PerformanceMetrics,
  ProductionData,
  ProductionError,
  AnalyticsData,
  ChatMessage,
  ChatContext,
  ChatAnalysis,
  GoogleAnalyticsConfig,
  AnalyticsReport
};

// Export utility functions
export { checkTrialStatus, isTrialExpired, getInstallDate, showUpgradePrompt, getTrialStats };

export interface InterToolsConfig {
  debug?: boolean;
  autoStart?: boolean;
  features?: {
    terminal?: boolean;
    localhost?: boolean;
    production?: boolean;
    chat?: boolean;
    analytics?: boolean;
  };
}

export interface LogEntry {
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  source?: 'terminal' | 'localhost' | 'production' | 'manual';
  stack?: string;
  metadata?: Record<string, any>;
}

export interface CursorReport {
  output: string;
  summary: string;
  errors: LogEntry[];
  warnings: LogEntry[];
  insights?: string[];
  recommendations?: string[];
}

export interface DevelopmentMonitoringOptions {
  terminal?: boolean;
  localhost?: string;
  production?: string;
  analytics?: string;
  ide?: 'cursor' | 'vscode' | 'webstorm';
}

export class InterTools {
  private config: InterToolsConfig;
  private installDate: Date;
  private isTrialActive: boolean;
  private trialStats: any;
  
  // Component instances
  private terminalMonitor: TerminalMonitor;
  private localhostMonitor: LocalhostMonitor;
  private productionMonitor: ProductionMonitor;
  private chatOrchestrator: ChatOrchestrator | null = null;
  private analyticsIntegration: GoogleAnalyticsIntegration | null = null;

  constructor(config: InterToolsConfig = {}) {
    this.config = {
      debug: false,
      autoStart: true,
      features: {
        terminal: true,
        localhost: true,
        production: true,
        chat: true,
        analytics: true
      },
      ...config
    };

    // Initialize trial management
    this.installDate = getInstallDate();
    this.isTrialActive = !isTrialExpired();
    this.trialStats = getTrialStats();
    
    // Initialize components
    this.terminalMonitor = new TerminalMonitor();
    this.localhostMonitor = new LocalhostMonitor();
    this.productionMonitor = new ProductionMonitor();
    
    // Check trial status and show welcome message
    if (this.config.autoStart) {
      this.showWelcomeMessage();
      checkTrialStatus();
    }

    if (this.config.debug) {
      console.log('🔧 InterTools Debug Mode Enabled');
      console.log('📊 Trial Stats:', this.trialStats);
    }
  }

  // ===========================================
  // CORE FEATURES (Always Available)
  // ===========================================

  /**
   * Format logs for Cursor IDE integration
   */
  formatForCursor(logs: LogEntry[]): CursorReport {
    const errors = logs.filter(log => log.type === 'error');
    const warnings = logs.filter(log => log.type === 'warn');
    
    const output = logs.map(log => {
      const timestamp = log.timestamp.toLocaleTimeString();
      const source = log.source ? ` [${log.source.toUpperCase()}]` : '';
      return `- **${timestamp}**${source} [${log.type.toUpperCase()}] ${log.message}`;
    }).join('\n');

    const insights = this.generateBasicInsights(logs);
    const recommendations = this.generateBasicRecommendations(errors, warnings);

    return {
      output: `# 🛠️ InterTools Console Log Report\n\n${output}`,
      summary: `Found ${errors.length} errors and ${warnings.length} warnings from ${logs.length} total logs`,
      errors,
      warnings,
      insights,
      recommendations
    };
  }

  /**
   * Filter logs by type
   */
  filterErrors(logs: LogEntry[]): LogEntry[] {
    return logs.filter(log => log.type === 'error');
  }

  /**
   * Filter logs by source
   */
  filterBySource(logs: LogEntry[], source: string): LogEntry[] {
    return logs.filter(log => log.source === source);
  }

  /**
   * Create timeline analysis
   */
  createTimeline(logs: LogEntry[]): { timestamp: Date; count: number; types: Record<string, number> }[] {
    const timeline = new Map<string, { count: number; types: Record<string, number> }>();
    
    logs.forEach(log => {
      const key = log.timestamp.toISOString().slice(0, 16); // Group by minute
      const existing = timeline.get(key) || { count: 0, types: {} };
      existing.count++;
      existing.types[log.type] = (existing.types[log.type] || 0) + 1;
      timeline.set(key, existing);
    });

    return Array.from(timeline.entries()).map(([timestamp, data]) => ({
      timestamp: new Date(timestamp),
      count: data.count,
      types: data.types
    }));
  }

  /**
   * Basic IDE sync (always available)
   */
  async syncToIde(data: any, options: { ide?: 'cursor' | 'vscode' | 'webstorm'; format?: 'markdown' | 'json' } = {}): Promise<void> {
    const ide = options.ide || 'cursor';
    const format = options.format || 'markdown';
    
    console.log(`📋 Syncing to ${ide} (${format} format)`);
    
    if (this.config.debug) {
      console.log('📤 Sync Data:', data);
    }
    
    // Basic sync functionality always available
  }

  // ===========================================
  // FULL FEATURES (7-day trial, then PRO)
  // ===========================================

  /**
   * Capture terminal logs in real-time
   */
  async captureTerminalLogs(): Promise<TerminalLogEntry[]> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Terminal log monitoring');
      return [];
    }

    if (!this.config.features?.terminal) {
      throw new Error('Terminal monitoring is disabled in configuration');
    }

    return await this.terminalMonitor.captureTerminalLogs();
  }

  /**
   * Start terminal monitoring
   */
  async startTerminalMonitoring(): Promise<void> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Terminal monitoring');
      return;
    }

    await this.terminalMonitor.startMonitoring();
  }

  /**
   * Monitor localhost development server
   */
  async monitorLocalhost(url: string): Promise<LocalhostData> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Localhost monitoring');
      return {
        url,
        html: '',
        consoleLogs: [],
        networkRequests: [],
        performance: { loadTime: 0, domContentLoaded: 0, firstContentfulPaint: 0, largestContentfulPaint: 0, cumulativeLayoutShift: 0, firstInputDelay: 0, memoryUsage: 0, domNodes: 0, resourceCount: 0, totalSize: 0 },
        domAnalysis: { totalElements: 0, elementsByTag: {}, classNames: [], ids: [], forms: [], images: [], links: [], scripts: [], stylesheets: [] },
        errors: []
      };
    }

    if (!this.config.features?.localhost) {
      throw new Error('Localhost monitoring is disabled in configuration');
    }

    return await this.localhostMonitor.monitorLocalhost(url);
  }

  /**
   * Start localhost monitoring
   */
  async startLocalhostMonitoring(url: string): Promise<void> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Localhost monitoring');
      return;
    }

    await this.localhostMonitor.startMonitoring(url);
  }

  /**
   * Analyze build processes
   */
  async analyzeBuildProcess(): Promise<BuildProcessInfo> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Build process analysis');
      return {
        buildTime: 0,
        bundleSize: '0 MB',
        warnings: 0,
        errors: 0,
        optimizations: [],
        dependencies: 0,
        outputFiles: []
      };
    }

    return await this.terminalMonitor.analyzeBuildProcess();
  }

  /**
   * Start AI Chat Orchestrator
   */
  async startChatOrchestrator(): Promise<ChatOrchestrator> {
    if (!this.isTrialActive) {
      showUpgradePrompt('AI Chat Orchestrator');
      throw new Error('AI Chat Orchestrator requires active trial or PRO subscription');
    }

    if (!this.config.features?.chat) {
      throw new Error('Chat orchestrator is disabled in configuration');
    }

    if (!this.chatOrchestrator) {
      this.chatOrchestrator = new ChatOrchestrator();
    }

    return await this.chatOrchestrator.start();
  }

  /**
   * Ask AI chat a question
   */
  async askAI(question: string, context?: Partial<ChatContext>): Promise<string> {
    if (!this.chatOrchestrator) {
      await this.startChatOrchestrator();
    }

    return await this.chatOrchestrator!.ask(question, context);
  }

  /**
   * Monitor production site
   */
  async monitorProductionSite(url: string): Promise<ProductionData> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Production site monitoring');
      return {
        url,
        errors: [],
        analytics: { pageViews: 0, uniqueUsers: 0, bounceRate: 0, conversionRate: 0, sessionDuration: 0, topPages: [], userBehavior: [], trafficSources: [], deviceBreakdown: [], geographicData: [] },
        performance: { responseTime: 0, throughput: 0, errorRate: 0, availability: 0, memoryUsage: 0, cpuUsage: 0, diskUsage: 0, networkLatency: 0, cacheHitRate: 0, databaseResponseTime: 0, webVitals: { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0 } },
        uptime: 0,
        security: { sslCertificate: { valid: false, expiresAt: new Date(), issuer: '' }, securityHeaders: {}, vulnerabilities: [], malwareDetected: false, blacklistStatus: false },
        seo: { title: '', description: '', keywords: [], headings: [], images: { total: 0, withAlt: 0, withoutAlt: 0, oversized: 0 }, links: { internal: 0, external: 0, broken: 0 }, structuredData: false, mobileOptimized: false, pageSpeed: 0, issues: [] },
        accessibility: { score: 0, issues: [], wcagCompliance: { level: 'none', violations: 0 }, screenReaderCompatible: false, keyboardNavigable: false, colorContrast: { passed: 0, failed: 0 } }
      };
    }

    if (!this.config.features?.production) {
      throw new Error('Production monitoring is disabled in configuration');
    }

    return await this.productionMonitor.monitorProductionSite(url);
  }

  /**
   * Start production monitoring
   */
  async startProductionMonitoring(url: string, interval?: number): Promise<void> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Production monitoring');
      return;
    }

    await this.productionMonitor.startMonitoring(url, interval);
  }

  /**
   * Integrate with Google Analytics
   */
  async integrateGoogleAnalytics(config: GoogleAnalyticsConfig): Promise<GoogleAnalyticsIntegration> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Google Analytics integration');
      throw new Error('Google Analytics integration requires active trial or PRO subscription');
    }

    if (!this.config.features?.analytics) {
      throw new Error('Analytics integration is disabled in configuration');
    }

    this.analyticsIntegration = new GoogleAnalyticsIntegration(config);
    await this.analyticsIntegration.initialize();
    
    return this.analyticsIntegration;
  }

  /**
   * Get Google Analytics data
   */
  async getAnalyticsData(startDate: Date, endDate: Date): Promise<AnalyticsReport> {
    if (!this.analyticsIntegration) {
      throw new Error('Google Analytics not initialized. Call integrateGoogleAnalytics() first.');
    }

    return await this.analyticsIntegration.generateReport(startDate, endDate);
  }

  /**
   * Start comprehensive development monitoring
   */
  async startDevelopmentMonitoring(options: DevelopmentMonitoringOptions): Promise<void> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Development monitoring');
      return;
    }

    console.log('🚀 Starting comprehensive InterTools monitoring...');
    
    const promises: Promise<void>[] = [];
    
    if (options.terminal && this.config.features?.terminal) {
      console.log('📟 Terminal monitoring: STARTING');
      promises.push(this.startTerminalMonitoring());
    }
    
    if (options.localhost && this.config.features?.localhost) {
      console.log(`🌐 Localhost monitoring: ${options.localhost}`);
      promises.push(this.startLocalhostMonitoring(options.localhost));
    }
    
    if (options.production && this.config.features?.production) {
      console.log(`📊 Production monitoring: ${options.production}`);
      promises.push(this.startProductionMonitoring(options.production));
    }
    
    if (options.analytics && this.config.features?.analytics) {
      console.log(`📈 Analytics integration: ${options.analytics}`);
      promises.push(
        this.integrateGoogleAnalytics({ trackingId: options.analytics }).then(() => {})
      );
    }
    
    if (this.config.features?.chat) {
      console.log('🤖 AI Chat Orchestrator: STARTING');
      promises.push(this.startChatOrchestrator().then(() => {}));
    }
    
    await Promise.all(promises);
    
    console.log('✅ InterTools comprehensive monitoring active!');
    console.log('');
    console.log('🎯 Available commands:');
    console.log('   📊 View dashboard: npx intertools dashboard');
    console.log('   💬 Chat with AI: intertools.askAI("your question")');
    console.log('   📈 Get insights: intertools.generateInsights()');
  }

  /**
   * Generate comprehensive insights
   */
  async generateInsights(): Promise<{
    terminal: any;
    localhost: any;
    production: any;
    analytics: any;
    recommendations: string[];
  }> {
    if (!this.isTrialActive) {
      showUpgradePrompt('Insights generation');
      return {
        terminal: null,
        localhost: null,
        production: null,
        analytics: null,
        recommendations: ['Upgrade to PRO to access comprehensive insights']
      };
    }

    const insights = {
      terminal: this.terminalMonitor.getStats(),
      localhost: this.localhostMonitor.getStats(),
      production: this.productionMonitor.getStats(),
      analytics: this.analyticsIntegration?.getStatus() || null,
      recommendations: await this.generateRecommendations()
    };

    return insights;
  }

  /**
   * Get trial status
   */
  getTrialStatus(): {
    active: boolean;
    daysRemaining: number;
    installDate: Date;
    features: string[];
  } {
    const stats = getTrialStats();
    
    return {
      active: this.isTrialActive,
      daysRemaining: stats.daysRemaining,
      installDate: this.installDate,
      features: this.isTrialActive ? [
        'Terminal monitoring',
        'Localhost analysis',
        'AI chat orchestrator',
        'Production monitoring',
        'Google Analytics integration',
        'Advanced insights'
      ] : [
        'Basic log formatting',
        'Simple error filtering',
        'Basic IDE sync'
      ]
    };
  }

  /**
   * Get InterTools status
   */
  getStatus(): {
    version: string;
    trial: any;
    features: Record<string, boolean>;
    components: Record<string, any>;
  } {
    return {
      version: '1.0.15',
      trial: this.getTrialStatus(),
      features: this.config.features || {},
      components: {
        terminalMonitor: this.terminalMonitor ? 'initialized' : 'not_initialized',
        localhostMonitor: this.localhostMonitor ? 'initialized' : 'not_initialized',
        productionMonitor: this.productionMonitor ? 'initialized' : 'not_initialized',
        chatOrchestrator: this.chatOrchestrator ? 'active' : 'inactive',
        analyticsIntegration: this.analyticsIntegration ? 'connected' : 'disconnected'
      }
    };
  }

  // ===========================================
  // PRIVATE HELPER METHODS
  // ===========================================

  /**
   * Show welcome message
   */
  private showWelcomeMessage(): void {
    if (this.isTrialActive) {
      const daysRemaining = this.trialStats.daysRemaining;
      console.log('🎉 Welcome to InterTools Pro!');
      console.log(`⏰ Trial: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`);
      console.log('✨ All features unlocked - explore everything!');
    } else {
      console.log('🛠️ InterTools (FREE version)');
      console.log('💼 Upgrade to PRO: npx @intertools/cli activate');
    }
  }

  /**
   * Generate basic insights from logs
   */
  private generateBasicInsights(logs: LogEntry[]): string[] {
    const insights: string[] = [];
    
    const errorCount = logs.filter(l => l.type === 'error').length;
    const warningCount = logs.filter(l => l.type === 'warn').length;
    
    if (errorCount > 0) {
      insights.push(`🔴 Found ${errorCount} error${errorCount > 1 ? 's' : ''} requiring attention`);
    }
    
    if (warningCount > 0) {
      insights.push(`🟡 Found ${warningCount} warning${warningCount > 1 ? 's' : ''} to review`);
    }
    
    if (errorCount === 0 && warningCount === 0) {
      insights.push('✅ No errors or warnings detected');
    }
    
    // Source analysis
    const sources = [...new Set(logs.map(l => l.source).filter(Boolean))];
    if (sources.length > 1) {
      insights.push(`📊 Logs from ${sources.length} sources: ${sources.join(', ')}`);
    }
    
    return insights;
  }

  /**
   * Generate basic recommendations
   */
  private generateBasicRecommendations(errors: LogEntry[], warnings: LogEntry[]): string[] {
    const recommendations: string[] = [];
    
    if (errors.length > 0) {
      recommendations.push('🔧 Fix critical errors first to improve stability');
      recommendations.push('📋 Add error handling and user-friendly messages');
    }
    
    if (warnings.length > 0) {
      recommendations.push('⚠️ Review warnings to prevent future issues');
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      recommendations.push('🎯 Consider adding more comprehensive logging');
      recommendations.push('🧪 Implement automated testing to catch issues early');
    }
    
    recommendations.push('💼 Upgrade to PRO for AI-powered insights and recommendations');
    
    return recommendations;
  }

  /**
   * Generate advanced recommendations (PRO feature)
   */
  private async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Terminal recommendations
    const terminalStats = this.terminalMonitor.getStats();
    if (terminalStats.errorsFound > 0) {
      recommendations.push('🔧 Address terminal errors to improve development workflow');
    }
    
    // Localhost recommendations
    const localhostStats = this.localhostMonitor.getStats();
    if (localhostStats.averageLoadTime > 2000) {
      recommendations.push('⚡ Optimize localhost performance - load time exceeds 2 seconds');
    }
    
    // Production recommendations
    const productionStats = this.productionMonitor.getStats();
    if (productionStats.criticalIssues > 0) {
      recommendations.push('🚨 Address critical production issues immediately');
    }
    
    if (productionStats.performanceScore < 70) {
      recommendations.push('📈 Improve production performance score');
    }
    
    // General recommendations
    recommendations.push('📊 Set up monitoring dashboards for continuous insights');
    recommendations.push('🤖 Use AI chat for specific debugging assistance');
    recommendations.push('📈 Review analytics data for user experience improvements');
    
    return recommendations;
  }
}

// Default export
export default InterTools;

// Convenience functions
export async function createInterTools(config?: InterToolsConfig): Promise<InterTools> {
  return new InterTools(config);
}

/**
 * Quick start function for immediate use
 */
export async function quickStart(options?: {
  localhost?: string;
  production?: string;
  analytics?: string;
}): Promise<InterTools> {
  const intertools = new InterTools({ autoStart: true });
  
  if (options) {
    await intertools.startDevelopmentMonitoring({
      terminal: true,
      localhost: options.localhost,
      production: options.production,
      analytics: options.analytics,
      ide: 'cursor'
    });
  }
  
  return intertools;
}