import { IterAgentConfig } from './utils';

export interface TradingBotConfig extends IterAgentConfig {
  // Trading-specific configurations
  trading: {
    apiEndpoints: string[];
    dataValidation: boolean;
    backtestRoutes: string[];
    financialDataRoutes: string[];
    alertThresholds: {
      priceChange: number;
      volumeSpike: number;
      errorRate: number;
    };
  };
  
  // Financial data monitoring
  financial: {
    dataSources: string[];
    updateFrequency: number;
    validationRules: {
      priceRange: { min: number; max: number };
      volumeRange: { min: number; max: number };
      timestampValidation: boolean;
    };
  };
  
  // Trading strategy testing
  strategies: {
    enabled: boolean;
    testStrategies: string[];
    backtestPeriods: number[];
    performanceThresholds: {
      minSharpeRatio: number;
      maxDrawdown: number;
      minWinRate: number;
    };
  };
}

export const createTradingBotConfig = (projectPath: string): TradingBotConfig => {
  return {
    port: 8000, // Default FastAPI port
    startCommand: 'python main.py',
    routes: [
      '/',
      '/docs',
      '/api/health',
      '/api/backtest',
      '/api/strategies',
      '/api/tickers',
      '/api/btc',
      '/api/tesla'
    ],
    logCaptureDuration: 10000, // Longer capture for trading data
    testTimeout: 60000, // Longer timeout for financial calculations
    cursorInboxPath: '.cursor/inbox',
    outputDir: '.iteragent',
    headless: true,
    takeScreenshots: true,
    workingDirectory: projectPath,
    env: {
      NODE_ENV: 'development',
      PYTHONPATH: projectPath
    },
    
    // Trading-specific configurations
    trading: {
      apiEndpoints: [
        '/api/backtest',
        '/api/strategies',
        '/api/tickers',
        '/api/btc',
        '/api/tesla',
        '/api/benchmarks',
        '/api/optimize'
      ],
      dataValidation: true,
      backtestRoutes: ['/api/backtest', '/api/strategies'],
      financialDataRoutes: ['/api/tickers', '/api/btc', '/api/tesla'],
      alertThresholds: {
        priceChange: 0.05, // 5% price change
        volumeSpike: 2.0,  // 2x volume spike
        errorRate: 0.01    // 1% error rate
      }
    },
    
    // Financial data monitoring
    financial: {
      dataSources: ['yfinance', 'fred', 'stooq', 'bitcoin_data'],
      updateFrequency: 300000, // 5 minutes
      validationRules: {
        priceRange: { min: 0.01, max: 1000000 },
        volumeRange: { min: 0, max: 1000000000 },
        timestampValidation: true
      }
    },
    
    // Trading strategy testing
    strategies: {
      enabled: true,
      testStrategies: ['bollinger', 'macd_rsi', 'sma_cross'],
      backtestPeriods: [30, 90, 365], // days
      performanceThresholds: {
        minSharpeRatio: 1.0,
        maxDrawdown: 0.15,
        minWinRate: 0.55
      }
    }
  };
};

export const detectTradingBotProject = (projectPath: string): boolean => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Check for common trading bot indicators
    const indicators = [
      'requirements.txt',
      'main.py',
      'app/main.py',
      'strategies/',
      'backtest',
      'trading',
      'financial',
      'api/backtest',
      'models/strategy',
      'models/backtest'
    ];
    
    const projectFiles = fs.readdirSync(projectPath, { recursive: true });
    const filePaths = projectFiles.map((file: any) => 
      typeof file === 'string' ? file : String(file)
    );
    
    const matches = indicators.filter(indicator => 
      filePaths.some((filePath: string) => 
        filePath.toLowerCase().includes(indicator.toLowerCase())
      )
    );
    
    return matches.length >= 3; // At least 3 indicators suggest a trading bot
  } catch (error) {
    return false;
  }
};
