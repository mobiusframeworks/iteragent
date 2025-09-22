#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { Runner } from './runner';
import { Harvester } from './harvester';
import { Tester } from './tester';
import { Summarizer } from './summarizer';
import { TUI } from './tui';
import { loadConfig } from './utils';
import { createTradingBotConfig, detectTradingBotProject, TradingBotConfig } from './trading-config';
import { TradingTester } from './trading-tester';
import { TradingAnalyzer } from './trading-analyzer';

const program = new Command();

program
  .name('iteragent')
  .description('Iterative testing agent for Cursor IDE')
  .version('1.0.0');

program
  .command('run')
  .description('Start the iterative testing loop')
  .option('-p, --port <port>', 'Port to run the dev server on', '3000')
  .option('-c, --config <path>', 'Path to config file', '.iteragentrc.json')
  .option('--no-tests', 'Skip Playwright tests')
  .option('--no-tui', 'Skip interactive TUI')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting IterAgent...'));
      
      const config = await loadConfig(options.config);
      
      // Initialize components
      const runner = new Runner(config);
      const harvester = new Harvester();
      const tester = options.tests !== false ? new Tester(config) : null;
      const summarizer = new Summarizer();
      const tui = options.tui !== false ? new TUI() : null;

      // Start the iterative loop
      await startIterativeLoop(runner, harvester, tester, summarizer, tui, config);
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize IterAgent configuration for current project')
  .option('--trading', 'Initialize with trading bot configuration')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔧 Initializing IterAgent...'));
      await initializeProject(options.trading);
      console.log(chalk.green('✅ IterAgent initialized!'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('init-trading')
  .description('Initialize IterAgent specifically for trading bot projects')
  .action(async () => {
    try {
      console.log(chalk.cyan('📈 Initializing IterAgent for Trading Bot...'));
      await initializeProject(true);
      console.log(chalk.green('✅ Trading Bot IterAgent initialized!'));
      console.log(chalk.cyan('📊 Specialized features enabled:'));
      console.log(chalk.cyan('  • Financial data validation and monitoring'));
      console.log(chalk.cyan('  • Trading strategy backtesting validation'));
      console.log(chalk.cyan('  • API endpoint performance monitoring'));
      console.log(chalk.cyan('  • Real-time trading signal analysis'));
      console.log(chalk.cyan('  • Risk metrics and alert monitoring'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

async function startIterativeLoop(
  runner: Runner,
  harvester: Harvester,
  tester: Tester | null,
  summarizer: Summarizer,
  tui: TUI | null,
  config: any
) {
  console.log(chalk.yellow('🔄 Starting iterative loop...'));
  
  // Detect if this is a trading bot project
  const isTradingBot = detectTradingBotProject(process.cwd());
  let tradingTester: TradingTester | null = null;
  let tradingAnalyzer: TradingAnalyzer | null = null;
  
  if (isTradingBot) {
    console.log(chalk.cyan('📈 Trading bot detected! Enabling specialized features...'));
    tradingTester = new TradingTester(config);
    tradingAnalyzer = new TradingAnalyzer();
  }
  
  while (true) {
    try {
      // 1. Start/Restart the dev server
      console.log(chalk.blue('📡 Starting dev server...'));
      const serverProcess = await runner.startServer();
      
      // 2. Wait for server to be ready
      await runner.waitForServer(config.port);
      
      // 3. Capture logs
      console.log(chalk.blue('📝 Capturing logs...'));
      const logs = await harvester.captureLogs(serverProcess, config.logCaptureDuration || 5000);
      
      // 4. Run tests if enabled
      let testResults = null;
      let tradingTestResults = null;
      
      if (tester) {
        console.log(chalk.blue('🧪 Running standard tests...'));
        testResults = await tester.runTests();
      }
      
      if (tradingTester) {
        console.log(chalk.cyan('📊 Running trading-specific tests...'));
        tradingTestResults = await tradingTester.runTests();
      }
      
      // 5. Generate summary
      console.log(chalk.blue('📊 Generating summary...'));
      let summary = await summarizer.generateSummary(logs, testResults, config);
      
      // Add trading-specific analysis if available
      if (tradingAnalyzer && tradingTestResults) {
        const tradingAnalysis = tradingAnalyzer.analyzeLogs(logs, testResults);
        (summary as any).tradingAnalysis = tradingAnalysis;
        (summary as any).tradingTestResults = tradingTestResults;
      }
      
      // 6. Show TUI if enabled
      if (tui) {
        console.log(chalk.blue('🎮 Opening TUI...'));
        const shouldContinue = await tui.showSummary(summary);
        if (!shouldContinue) {
          break;
        }
      } else {
        // Auto-continue if no TUI
        console.log(chalk.green('✅ Cycle complete. Continuing...'));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error in loop:'), error);
      console.log(chalk.yellow('🔄 Retrying in 3 seconds...'));
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log(chalk.blue('👋 IterAgent stopped.'));
}

async function initializeProject(isTradingBot: boolean = false) {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const configPath = '.iteragentrc.json';
  let config: any;
  
  if (isTradingBot || detectTradingBotProject(process.cwd())) {
    console.log(chalk.cyan('📈 Detected trading bot project! Creating specialized configuration...'));
    config = createTradingBotConfig(process.cwd());
  } else {
    config = {
      port: 3000,
      startCommand: 'npm run dev',
      routes: ['/'],
      logCaptureDuration: 5000,
      testTimeout: 30000,
      cursorInboxPath: '.cursor/inbox'
    };
  }
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  
  // Create .cursor/inbox directory
  const inboxDir = '.cursor/inbox';
  try {
    await fs.mkdir(inboxDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  console.log(chalk.green(`✅ Created ${configPath}`));
  console.log(chalk.green(`✅ Created ${inboxDir}/ directory`));
  
  if (isTradingBot || detectTradingBotProject(process.cwd())) {
    console.log(chalk.cyan('📊 Trading bot features enabled:'));
    console.log(chalk.cyan('  • Financial data validation'));
    console.log(chalk.cyan('  • Trading strategy testing'));
    console.log(chalk.cyan('  • API endpoint monitoring'));
    console.log(chalk.cyan('  • Performance metrics analysis'));
  }
}

program.parse();
