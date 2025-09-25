import { LogEntry, HarvestedLogs } from './harvester';
import { TestResult } from './tester';
import { TradingTestSuite } from './trading-tester';

export interface TradingLogAnalysis {
  financialData: {
    priceUpdates: number;
    volumeUpdates: number;
    dataSourceErrors: number;
    validationFailures: number;
  };
  
  tradingOperations: {
    backtestsRun: number;
    strategiesExecuted: number;
    tradesSimulated: number;
    performanceCalculations: number;
  };
  
  apiPerformance: {
    averageResponseTime: number;
    slowEndpoints: string[];
    errorRates: Record<string, number>;
    throughput: number;
  };
  
  alerts: {
    priceAlerts: number;
    volumeAlerts: number;
    errorAlerts: number;
    performanceAlerts: number;
  };
  
  recommendations: string[];
  criticalIssues: string[];
}

export class TradingAnalyzer {
  analyzeLogs(logs: HarvestedLogs, testResults: any): TradingLogAnalysis {
    const analysis: TradingLogAnalysis = {
      financialData: {
        priceUpdates: 0,
        volumeUpdates: 0,
        dataSourceErrors: 0,
        validationFailures: 0
      },
      
      tradingOperations: {
        backtestsRun: 0,
        strategiesExecuted: 0,
        tradesSimulated: 0,
        performanceCalculations: 0
      },
      
      apiPerformance: {
        averageResponseTime: 0,
        slowEndpoints: [],
        errorRates: {},
        throughput: 0
      },
      
      alerts: {
        priceAlerts: 0,
        volumeAlerts: 0,
        errorAlerts: 0,
        performanceAlerts: 0
      },
      
      recommendations: [],
      criticalIssues: []
    };

    // Analyze financial data operations
    this.analyzeFinancialData(logs, analysis);
    
    // Analyze trading operations
    this.analyzeTradingOperations(logs, analysis);
    
    // Analyze API performance
    this.analyzeApiPerformance(logs, analysis);
    
    // Analyze alerts
    this.analyzeAlerts(logs, analysis);
    
    // Generate recommendations
    this.generateRecommendations(analysis);
    
    // Identify critical issues
    this.identifyCriticalIssues(logs, analysis);

    return analysis;
  }

  private analyzeFinancialData(logs: HarvestedLogs, analysis: TradingLogAnalysis): void {
    logs.entries.forEach(log => {
      const message = log.message.toLowerCase();
      
      if (message.includes('price update') || message.includes('price data')) {
        analysis.financialData.priceUpdates++;
      }
      
      if (message.includes('volume update') || message.includes('volume data')) {
        analysis.financialData.volumeUpdates++;
      }
      
      if (message.includes('data source error') || message.includes('api error')) {
        analysis.financialData.dataSourceErrors++;
      }
      
      if (message.includes('validation failed') || message.includes('invalid data')) {
        analysis.financialData.validationFailures++;
      }
    });
  }

  private analyzeTradingOperations(logs: HarvestedLogs, analysis: TradingLogAnalysis): void {
    logs.entries.forEach(log => {
      const message = log.message.toLowerCase();
      
      if (message.includes('backtest') || message.includes('backtesting')) {
        analysis.tradingOperations.backtestsRun++;
      }
      
      if (message.includes('strategy') && (message.includes('execute') || message.includes('run'))) {
        analysis.tradingOperations.strategiesExecuted++;
      }
      
      if (message.includes('trade') && (message.includes('simulate') || message.includes('execute'))) {
        analysis.tradingOperations.tradesSimulated++;
      }
      
      if (message.includes('performance') && (message.includes('calculate') || message.includes('metric'))) {
        analysis.tradingOperations.performanceCalculations++;
      }
    });
  }

  private analyzeApiPerformance(logs: HarvestedLogs, analysis: TradingLogAnalysis): void {
    const requestLogs = logs.entries.filter(log => log.category === 'request');
    const responseTimes: number[] = [];
    const endpointCounts: Record<string, number> = {};
    const endpointErrors: Record<string, number> = {};

    requestLogs.forEach(log => {
      // Extract response time
      if (log.metadata?.responseTime) {
        responseTimes.push(log.metadata.responseTime);
      }

      // Extract endpoint
      const endpoint = this.extractEndpoint(log.message);
      if (endpoint) {
        endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
        
        if (log.level === 'error') {
          endpointErrors[endpoint] = (endpointErrors[endpoint] || 0) + 1;
        }
      }
    });

    // Calculate average response time
    if (responseTimes.length > 0) {
      analysis.apiPerformance.averageResponseTime = 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    // Identify slow endpoints (>2 seconds)
    analysis.apiPerformance.slowEndpoints = Object.entries(endpointCounts)
      .filter(([endpoint, count]) => {
        const avgTime = responseTimes.filter((_, i) => 
          requestLogs[i] && this.extractEndpoint(requestLogs[i].message) === endpoint
        ).reduce((sum, time) => sum + time, 0) / count;
        return avgTime > 2000;
      })
      .map(([endpoint]) => endpoint);

    // Calculate error rates
    Object.entries(endpointCounts).forEach(([endpoint, total]) => {
      const errors = endpointErrors[endpoint] || 0;
      analysis.apiPerformance.errorRates[endpoint] = errors / total;
    });

    // Calculate throughput (requests per minute)
    const timeSpan = this.calculateTimeSpan(logs);
    if (timeSpan > 0) {
      analysis.apiPerformance.throughput = requestLogs.length / (timeSpan / 60000);
    }
  }

  private analyzeAlerts(logs: HarvestedLogs, analysis: TradingLogAnalysis): void {
    logs.entries.forEach(log => {
      const message = log.message.toLowerCase();
      
      if (message.includes('price alert') || message.includes('price threshold')) {
        analysis.alerts.priceAlerts++;
      }
      
      if (message.includes('volume alert') || message.includes('volume spike')) {
        analysis.alerts.volumeAlerts++;
      }
      
      if (message.includes('error alert') || message.includes('critical error')) {
        analysis.alerts.errorAlerts++;
      }
      
      if (message.includes('performance alert') || message.includes('slow performance')) {
        analysis.alerts.performanceAlerts++;
      }
    });
  }

  private generateRecommendations(analysis: TradingLogAnalysis): void {
    // Data source recommendations
    if (analysis.financialData.dataSourceErrors > 5) {
      analysis.recommendations.push('High number of data source errors detected. Consider implementing retry logic and fallback data sources.');
    }

    if (analysis.financialData.validationFailures > 3) {
      analysis.recommendations.push('Data validation failures detected. Review validation rules and data quality checks.');
    }

    // Performance recommendations
    if (analysis.apiPerformance.averageResponseTime > 1000) {
      analysis.recommendations.push('API response times are slow. Consider optimizing database queries and implementing caching.');
    }

    if (analysis.apiPerformance.slowEndpoints.length > 0) {
      analysis.recommendations.push(`Slow endpoints detected: ${analysis.apiPerformance.slowEndpoints.join(', ')}. Consider optimization.`);
    }

    // Trading strategy recommendations
    if (analysis.tradingOperations.backtestsRun === 0) {
      analysis.recommendations.push('No backtests were run. Consider implementing automated backtesting for strategy validation.');
    }

    if (analysis.tradingOperations.strategiesExecuted < 2) {
      analysis.recommendations.push('Limited strategy execution detected. Consider implementing more trading strategies.');
    }

    // Alert recommendations
    if (analysis.alerts.priceAlerts === 0 && analysis.alerts.volumeAlerts === 0) {
      analysis.recommendations.push('No price or volume alerts triggered. Consider adjusting alert thresholds for better market monitoring.');
    }
  }

  private identifyCriticalIssues(logs: HarvestedLogs, analysis: TradingLogAnalysis): void {
    // Critical data source issues
    if (analysis.financialData.dataSourceErrors > 10) {
      analysis.criticalIssues.push('Critical: Excessive data source errors may cause trading decisions based on stale or incorrect data.');
    }

    // Critical performance issues
    if (analysis.apiPerformance.averageResponseTime > 5000) {
      analysis.criticalIssues.push('Critical: API response times exceed 5 seconds, which may cause trading delays and missed opportunities.');
    }

    // Critical error rates
    const highErrorEndpoints = Object.entries(analysis.apiPerformance.errorRates)
      .filter(([_, rate]) => rate > 0.1)
      .map(([endpoint]) => endpoint);

    if (highErrorEndpoints.length > 0) {
      analysis.criticalIssues.push(`Critical: High error rates detected for endpoints: ${highErrorEndpoints.join(', ')}`);
    }

    // Critical trading issues
    if (analysis.tradingOperations.tradesSimulated === 0) {
      analysis.criticalIssues.push('Critical: No trades were simulated, indicating potential issues with trading logic or data flow.');
    }

    // Critical alert issues
    if (analysis.alerts.errorAlerts > 5) {
      analysis.criticalIssues.push('Critical: Multiple error alerts triggered, indicating system instability.');
    }
  }

  private extractEndpoint(message: string): string | null {
    // Extract endpoint from log message
    const match = message.match(/(GET|POST|PUT|DELETE)\s+([^\s]+)/);
    return match ? match[2] : null;
  }

  private calculateTimeSpan(logs: HarvestedLogs): number {
    if (logs.entries.length < 2) return 0;
    
    const timestamps = logs.entries.map(log => log.timestamp.getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    return maxTime - minTime;
  }
}
