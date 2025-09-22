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
import { createMobileConfig, detectMobileProject, MobileConfig } from './mobile-config';
import { MobileTester } from './mobile-tester';
import { MobileAnalyzer } from './mobile-analyzer';
import { TerminalFeedback } from './terminal-feedback';
import { CursorAgentIntegration } from './cursor-agent-integration';
import { CursorAIFunctionExecutor, SpeedOptimizationSuggestion } from './cursor-ai-executor';
import { CursorAIFunctionPanel } from './cursor-ai-panel';
import { AgentZeroManager } from './agent-zero-manager';
import { DockerAgentZeroService } from './docker-agent-zero';

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

program
  .command('init-mobile')
  .description('Initialize IterAgent specifically for mobile development projects')
  .option('-p, --platform <platform>', 'Mobile platform (react-native, flutter, expo, ionic)', 'auto')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📱 Initializing IterAgent for Mobile Development...'));
      await initializeMobileProject(options.platform);
      console.log(chalk.green('✅ Mobile Development IterAgent initialized!'));
      console.log(chalk.blue('📱 Specialized features enabled:'));
      console.log(chalk.blue('  • Mobile platform detection and configuration'));
      console.log(chalk.blue('  • Cross-platform testing (iOS, Android, Web)'));
      console.log(chalk.blue('  • Performance monitoring and optimization'));
      console.log(chalk.blue('  • Device compatibility testing'));
      console.log(chalk.blue('  • Mobile-specific log analysis'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('feedback')
  .description('Manage terminal feedback and Cursor agent integration')
  .option('--enable', 'Enable terminal feedback')
  .option('--disable', 'Disable terminal feedback')
  .option('--status', 'Show feedback status')
  .action(async (options) => {
    try {
      if (options.enable) {
        console.log(chalk.green('✅ Terminal feedback enabled'));
      } else if (options.disable) {
        console.log(chalk.yellow('⏹️ Terminal feedback disabled'));
      } else if (options.status) {
        console.log(chalk.blue('📊 Terminal feedback status: Active'));
      } else {
        console.log(chalk.blue('🔍 Terminal feedback management'));
        console.log(chalk.gray('Use --enable, --disable, or --status'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('allowlist')
  .description('Manage suggestion allowlist')
  .argument('<action>', 'add or remove')
  .argument('<item>', 'Item to add/remove from allowlist')
  .action(async (action, item) => {
    try {
      if (action === 'add') {
        console.log(chalk.green(`✅ Added "${item}" to allowlist`));
      } else if (action === 'remove') {
        console.log(chalk.yellow(`🗑️ Removed "${item}" from allowlist`));
      } else {
        console.log(chalk.red('❌ Invalid action. Use "add" or "remove"'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('blocklist')
  .description('Manage suggestion blocklist')
  .argument('<action>', 'add or remove')
  .argument('<item>', 'Item to add/remove from blocklist')
  .action(async (action, item) => {
    try {
      if (action === 'add') {
        console.log(chalk.red(`🚫 Added "${item}" to blocklist`));
      } else if (action === 'remove') {
        console.log(chalk.green(`✅ Removed "${item}" from blocklist`));
      } else {
        console.log(chalk.red('❌ Invalid action. Use "add" or "remove"'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('suggestions')
  .description('View and manage current suggestions')
  .option('--clear', 'Clear all suggestions')
  .option('--type <type>', 'Filter by suggestion type')
  .action(async (options) => {
    try {
      if (options.clear) {
        console.log(chalk.yellow('🗑️ Cleared all suggestions'));
      } else {
        console.log(chalk.blue('📋 Current suggestions:'));
        console.log(chalk.gray('Use --type to filter or --clear to clear all'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('cursor-ai')
  .description('Manage Cursor AI function execution')
  .option('--enable', 'Enable Cursor AI function execution')
  .option('--disable', 'Disable Cursor AI function execution')
  .option('--status', 'Show Cursor AI execution status')
  .option('--panel', 'Show function management panel')
  .option('--performance', 'Show performance monitoring')
  .action(async (options) => {
    try {
      const executor = new CursorAIFunctionExecutor();
      
      if (options.enable) {
        executor.updateConfig({ enableAutoExecution: true });
        console.log(chalk.green('✅ Cursor AI function execution enabled'));
      } else if (options.disable) {
        executor.updateConfig({ enableAutoExecution: false });
        console.log(chalk.yellow('⏹️ Cursor AI function execution disabled'));
      } else if (options.status) {
        const config = executor.getConfig();
        console.log(chalk.blue('📊 Cursor AI Execution Status:'));
        console.log(chalk.gray(`Auto Execution: ${config.enableAutoExecution ? 'Enabled' : 'Disabled'}`));
        console.log(chalk.gray(`Functions: ${executor.getFunctions().length}`));
        console.log(chalk.gray(`Allowlist: ${config.allowlist.length} items`));
        console.log(chalk.gray(`Blocklist: ${config.blocklist.length} items`));
        console.log(chalk.gray(`Performance Monitoring: ${config.performanceMonitoring.enabled ? 'Enabled' : 'Disabled'}`));
      } else if (options.panel) {
        const panel = new CursorAIFunctionPanel();
        panel.updateFunctions(executor.getFunctions());
        panel.show();
      } else if (options.performance) {
        executor.startPerformanceMonitoring();
        console.log(chalk.blue('📊 Performance monitoring started'));
        console.log(chalk.gray('Press Ctrl+C to stop monitoring'));
      } else {
        console.log(chalk.blue('🤖 Cursor AI Function Management'));
        console.log(chalk.gray('Use --enable, --disable, --status, --panel, or --performance'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('functions')
  .description('Manage Cursor AI functions')
  .option('--list', 'List all available functions')
  .option('--allowlist <functionId>', 'Add function to allowlist')
  .option('--blocklist <functionId>', 'Add function to blocklist')
  .option('--remove-allowlist <functionId>', 'Remove function from allowlist')
  .option('--remove-blocklist <functionId>', 'Remove function from blocklist')
  .option('--execute <functionId>', 'Execute a specific function')
  .action(async (options) => {
    try {
      const executor = new CursorAIFunctionExecutor();
      
      if (options.list) {
        const functions = executor.getFunctions();
        console.log(chalk.blue('📋 Available Functions:'));
        functions.forEach((func, index) => {
          const riskColor = func.riskLevel === 'low' ? chalk.green : 
                          func.riskLevel === 'medium' ? chalk.yellow : 
                          func.riskLevel === 'high' ? chalk.red : chalk.red.bold;
          console.log(chalk.gray(`${index + 1}.`), chalk.white.bold(func.name));
          console.log(chalk.gray(`   ID: ${func.id}`));
          console.log(chalk.gray(`   Category: ${func.category}`));
          console.log(riskColor(`   Risk: ${func.riskLevel}`));
          console.log(chalk.gray(`   Command: ${func.command}`));
          console.log(chalk.gray('─'.repeat(40)));
        });
      } else if (options.allowlist) {
        executor.addToAllowlist(options.allowlist);
      } else if (options.blocklist) {
        executor.addToBlocklist(options.blocklist);
      } else if (options.removeAllowlist) {
        executor.removeFromAllowlist(options.removeAllowlist);
      } else if (options.removeBlocklist) {
        executor.removeFromBlocklist(options.removeBlocklist);
      } else if (options.execute) {
        const result = await executor.executeFunction(options.execute);
        if (result.success) {
          console.log(chalk.green(`✅ Function executed successfully`));
          console.log(chalk.gray(`Output: ${result.output}`));
        } else {
          console.log(chalk.red(`❌ Function execution failed`));
          console.log(chalk.gray(`Error: ${result.error}`));
        }
      } else {
        console.log(chalk.blue('🔧 Function Management'));
        console.log(chalk.gray('Use --list, --allowlist, --blocklist, --remove-allowlist, --remove-blocklist, or --execute'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('speed-optimization')
  .description('Manage speed optimization suggestions')
  .option('--enable', 'Enable speed optimization monitoring')
  .option('--disable', 'Disable speed optimization monitoring')
  .option('--suggestions', 'Show current speed optimization suggestions')
  .option('--apply <suggestionId>', 'Apply a specific speed optimization suggestion')
  .action(async (options) => {
    try {
      const executor = new CursorAIFunctionExecutor();
      
      if (options.enable) {
        executor.updateConfig({ 
          speedOptimization: { 
            enabled: true, 
            suggestionInterval: 300000, 
            autoApply: false, 
            minImprovementThreshold: 10 
          } 
        });
        executor.startPerformanceMonitoring();
        console.log(chalk.green('✅ Speed optimization monitoring enabled'));
      } else if (options.disable) {
        executor.updateConfig({ 
          speedOptimization: { 
            enabled: false, 
            suggestionInterval: 300000, 
            autoApply: false, 
            minImprovementThreshold: 10 
          } 
        });
        console.log(chalk.yellow('⏹️ Speed optimization monitoring disabled'));
      } else if (options.suggestions) {
        const suggestions = executor.getSpeedSuggestions();
        if (suggestions.length === 0) {
          console.log(chalk.yellow('No speed optimization suggestions available'));
          console.log(chalk.gray('Run performance monitoring to generate suggestions'));
        } else {
          console.log(chalk.cyan('⚡ Speed Optimization Suggestions:'));
          suggestions.forEach((suggestion, index) => {
            const impactColor = suggestion.impact === 'low' ? chalk.green : 
                              suggestion.impact === 'medium' ? chalk.yellow : chalk.red;
            console.log(chalk.gray(`${index + 1}.`), chalk.white.bold(suggestion.title));
            console.log(chalk.gray(`   ${suggestion.description}`));
            console.log(impactColor(`   Impact: ${suggestion.impact}`));
            console.log(chalk.green(`   Estimated Improvement: ${suggestion.estimatedImprovement}%`));
            console.log(chalk.gray(`   ${suggestion.reasoning}`));
            if (suggestion.command) {
              console.log(chalk.blue(`   Command: ${suggestion.command}`));
            }
            console.log(chalk.gray('─'.repeat(40)));
          });
        }
      } else if (options.apply) {
        const suggestions = executor.getSpeedSuggestions();
        const suggestion = suggestions.find(s => s.id === options.apply);
        if (suggestion) {
          if (suggestion.command) {
            console.log(chalk.blue(`🚀 Applying suggestion: ${suggestion.title}`));
            const result = await executor.executeFunction('execute-command', { command: suggestion.command });
            if (result.success) {
              console.log(chalk.green('✅ Suggestion applied successfully'));
            } else {
              console.log(chalk.red('❌ Failed to apply suggestion'));
            }
          } else {
            console.log(chalk.yellow('⚠️ This suggestion cannot be automatically applied'));
          }
        } else {
          console.log(chalk.red('❌ Suggestion not found'));
        }
      } else {
        console.log(chalk.blue('⚡ Speed Optimization Management'));
        console.log(chalk.gray('Use --enable, --disable, --suggestions, or --apply'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('agent-zero')
  .description('Agent Zero mode - Connect to Docker Agent Zero runtime')
  .option('--start', 'Start Agent Zero mode')
  .option('--stop', 'Stop Agent Zero mode')
  .option('--status', 'Show Agent Zero status')
  .option('--dashboard', 'Open Agent Zero dashboard')
  .option('--logs', 'Show Agent Zero logs')
  .option('--enhancements', 'Show available enhancements')
  .option('--apply-enhancement <name>', 'Apply specific enhancement')
  .action(async (options) => {
    try {
      const agentZeroManager = new AgentZeroManager();
      const dockerService = new DockerAgentZeroService();
      
      if (options.start) {
        console.log(chalk.blue('🚀 Starting Agent Zero mode...'));
        await dockerService.start();
        await agentZeroManager.start();
        console.log(chalk.green('✅ Agent Zero mode started successfully'));
        console.log(chalk.blue(`📊 Dashboard: http://localhost:${agentZeroManager.getConfig().dashboardPort}`));
        console.log(chalk.blue(`🔌 API: http://localhost:${agentZeroManager.getConfig().port}`));
      } else if (options.stop) {
        console.log(chalk.yellow('⏹️ Stopping Agent Zero mode...'));
        await agentZeroManager.stop();
        await dockerService.stop();
        console.log(chalk.green('✅ Agent Zero mode stopped successfully'));
      } else if (options.status) {
        const runtime = dockerService.getRuntime();
        const config = agentZeroManager.getConfig();
        
        console.log(chalk.blue('📊 Agent Zero Status:'));
        console.log(chalk.gray(`Status: ${runtime?.status || 'Not running'}`));
        console.log(chalk.gray(`Health: ${runtime?.health || 'Unknown'}`));
        console.log(chalk.gray(`Container: ${config.containerName}`));
        console.log(chalk.gray(`Port: ${config.port}`));
        console.log(chalk.gray(`Dashboard Port: ${config.dashboardPort}`));
        console.log(chalk.gray(`Projects: ${agentZeroManager.getProjects().length}`));
        console.log(chalk.gray(`Sessions: ${agentZeroManager.getSessions().length}`));
        console.log(chalk.gray(`Logs: ${agentZeroManager.getLogs().length}`));
        
        if (runtime?.metrics) {
          console.log(chalk.cyan('📈 Performance Metrics:'));
          console.log(chalk.gray(`CPU Usage: ${runtime.metrics.cpuUsage.toFixed(1)}%`));
          console.log(chalk.gray(`Memory Usage: ${runtime.metrics.memoryUsage.toFixed(1)}%`));
          console.log(chalk.gray(`Network IO: ${runtime.metrics.networkIO.toFixed(1)} MB`));
          console.log(chalk.gray(`Disk IO: ${runtime.metrics.diskIO.toFixed(1)} MB`));
        }
      } else if (options.dashboard) {
        const config = agentZeroManager.getConfig();
        console.log(chalk.blue('🌐 Opening Agent Zero dashboard...'));
        console.log(chalk.green(`Dashboard URL: http://localhost:${config.dashboardPort}`));
        console.log(chalk.gray('The dashboard will open in your default browser'));
        
        // Open dashboard in browser
        const { exec } = require('child_process');
        exec(`open http://localhost:${config.dashboardPort}`);
      } else if (options.logs) {
        const logs = agentZeroManager.getLogs();
        console.log(chalk.blue('📝 Agent Zero Logs:'));
        
        if (logs.length === 0) {
          console.log(chalk.yellow('No logs available'));
        } else {
          logs.slice(-20).forEach(log => {
            const timestamp = log.timestamp.toLocaleString();
            const typeColor = log.type === 'error' ? chalk.red : 
                            log.type === 'performance' ? chalk.cyan :
                            log.type === 'execution' ? chalk.green : chalk.white;
            console.log(chalk.gray(`[${timestamp}]`), typeColor(`[${log.type}]`), chalk.white(log.message));
          });
        }
      } else if (options.enhancements) {
        const enhancements = dockerService.getEnhancements();
        console.log(chalk.blue('⚡ Available Enhancements:'));
        
        enhancements.forEach((enhancement, index) => {
          const statusColor = enhancement.status === 'completed' ? chalk.green :
                            enhancement.status === 'implementing' ? chalk.yellow :
                            enhancement.status === 'failed' ? chalk.red : chalk.gray;
          const impactColor = enhancement.impact === 'high' ? chalk.red :
                             enhancement.impact === 'medium' ? chalk.yellow : chalk.green;
          
          console.log(chalk.gray(`${index + 1}.`), chalk.white.bold(enhancement.name));
          console.log(chalk.gray(`   ${enhancement.description}`));
          console.log(impactColor(`   Impact: ${enhancement.impact}`));
          console.log(chalk.gray(`   Effort: ${enhancement.effort}`));
          console.log(statusColor(`   Status: ${enhancement.status}`));
          console.log(chalk.gray('─'.repeat(40)));
        });
      } else if (options.applyEnhancement) {
        console.log(chalk.blue(`🚀 Applying enhancement: ${options.applyEnhancement}`));
        try {
          await dockerService.applyEnhancement(options.applyEnhancement);
          console.log(chalk.green(`✅ Enhancement "${options.applyEnhancement}" applied successfully`));
        } catch (error) {
          console.log(chalk.red(`❌ Failed to apply enhancement: ${error}`));
        }
      } else {
        console.log(chalk.blue('🤖 Agent Zero Mode'));
        console.log(chalk.gray('Use --start, --stop, --status, --dashboard, --logs, --enhancements, or --apply-enhancement'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('visualize')
  .description('Open IterAgent visualization dashboard')
  .option('--port <port>', 'Dashboard port', '3000')
  .option('--open', 'Open dashboard in browser')
  .action(async (options) => {
    try {
      const agentZeroManager = new AgentZeroManager({
        dashboardPort: parseInt(options.port),
        enableVisualization: true,
        enableLogging: true,
        enableSettings: true
      });
      
      console.log(chalk.blue('🎨 Starting IterAgent visualization dashboard...'));
      await agentZeroManager.start();
      
      console.log(chalk.green('✅ Visualization dashboard started'));
      console.log(chalk.blue(`📊 Dashboard: http://localhost:${options.port}`));
      
      if (options.open) {
        const { exec } = require('child_process');
        exec(`open http://localhost:${options.port}`);
      }
      
      // Keep the process running
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n⏹️ Stopping dashboard...'));
        await agentZeroManager.stop();
        process.exit(0);
      });
      
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
  
  // Initialize terminal feedback and Cursor agent integration
  const terminalFeedback = new TerminalFeedback({
    enableSuggestions: true,
    suggestionThreshold: 0.7,
    autoExecute: false,
    maxSuggestions: 10,
    enableCodeExecution: true
  });
  
  const cursorAgent = new CursorAgentIntegration({
    enableAutoExecution: false,
    maxMessages: 50,
    enableCodeInjection: true,
    enableTerminalControl: true
  });
  
  await cursorAgent.initialize();
  
  // Initialize Cursor AI function executor
  const cursorAIExecutor = new CursorAIFunctionExecutor({
    enableAutoExecution: true,
    allowlist: [],
    blocklist: [],
    defaultBlocklist: [
      'git push',
      'git push origin',
      'git push --force',
      'rm -rf',
      'sudo rm',
      'format c:',
      'del /f /s /q',
      'shutdown',
      'reboot',
      'halt'
    ],
    performanceMonitoring: {
      enabled: true,
      interval: 30000,
      thresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        responseTime: 5000
      }
    },
    speedOptimization: {
      enabled: true,
      suggestionInterval: 300000,
      autoApply: false,
      minImprovementThreshold: 10
    },
    ui: {
      showFunctionPanel: true,
      panelPosition: 'top-right',
      autoHide: true,
      hideDelay: 5000
    }
  });
  
  // Initialize function panel
  const functionPanel = new CursorAIFunctionPanel({
    position: 'top-right',
    width: 400,
    height: 600,
    autoHide: true,
    hideDelay: 5000,
    theme: 'dark',
    showCategories: true,
    showStatistics: true
  });
  
  // Set up event listeners
  cursorAIExecutor.on('functionExecuted', (func, result) => {
    console.log(chalk.green(`✅ Cursor AI function executed: ${func.name}`));
    if (result.output) {
      console.log(chalk.gray(`Output: ${result.output}`));
    }
  });
  
  cursorAIExecutor.on('functionFailed', (func, result) => {
    console.log(chalk.red(`❌ Cursor AI function failed: ${func.name}`));
    if (result.error) {
      console.log(chalk.gray(`Error: ${result.error}`));
    }
  });
  
  cursorAIExecutor.on('functionBlocked', (func, result) => {
    console.log(chalk.yellow(`🚫 Cursor AI function blocked: ${func.name}`));
    console.log(chalk.gray('Use iteragent functions --allowlist to enable'));
  });
  
  cursorAIExecutor.on('functionRequiresConfirmation', (func, result) => {
    console.log(chalk.yellow(`⚠️ Cursor AI function requires confirmation: ${func.name}`));
    console.log(chalk.gray('Use iteragent functions --allowlist to auto-approve'));
  });
  
  cursorAIExecutor.on('speedSuggestions', (suggestions: SpeedOptimizationSuggestion[]) => {
    console.log(chalk.cyan(`💡 Generated ${suggestions.length} speed optimization suggestions`));
    suggestions.forEach((suggestion: SpeedOptimizationSuggestion) => {
      console.log(chalk.gray(`• ${suggestion.title}: ${suggestion.estimatedImprovement}% improvement`));
    });
  });
  
  cursorAIExecutor.on('performanceMetrics', (metrics) => {
    if (metrics.cpuUsage > 80 || metrics.memoryUsage > 85 || metrics.responseTime > 5000) {
      console.log(chalk.yellow(`⚠️ Performance Alert:`));
      console.log(chalk.gray(`CPU: ${metrics.cpuUsage.toFixed(1)}% | Memory: ${metrics.memoryUsage.toFixed(1)}% | Response: ${metrics.responseTime}ms`));
    }
  });
  
  // Update function panel with functions
  functionPanel.updateFunctions(cursorAIExecutor.getFunctions());
  
  // Start performance monitoring
  cursorAIExecutor.startPerformanceMonitoring();
  
  // Detect project type
  const isTradingBot = detectTradingBotProject(process.cwd());
  const mobileProject = detectMobileProject(process.cwd());
  
  let tradingTester: TradingTester | null = null;
  let tradingAnalyzer: TradingAnalyzer | null = null;
  let mobileTester: MobileTester | null = null;
  let mobileAnalyzer: MobileAnalyzer | null = null;
  
  if (isTradingBot) {
    console.log(chalk.cyan('📈 Trading bot detected! Enabling specialized features...'));
    tradingTester = new TradingTester(config);
    tradingAnalyzer = new TradingAnalyzer();
  }
  
  if (mobileProject) {
    console.log(chalk.blue(`📱 Mobile project detected (${mobileProject.platform})! Enabling mobile features...`));
    mobileTester = new MobileTester(config);
    mobileAnalyzer = new MobileAnalyzer();
  }
  
  while (true) {
    try {
      // 1. Start/Restart the dev server
      console.log(chalk.blue('📡 Starting dev server...'));
      const serverProcess = await runner.startServer();
      
      // Start terminal feedback monitoring
      console.log(chalk.blue('🔍 Starting terminal feedback monitoring...'));
      await terminalFeedback.startMonitoring(serverProcess);
      
      // 2. Wait for server to be ready
      await runner.waitForServer(config.port);
      
      // 3. Capture logs
      console.log(chalk.blue('📝 Capturing logs...'));
      const logs = await harvester.captureLogs(serverProcess, config.logCaptureDuration || 5000);
      
      // 4. Run tests if enabled
      let testResults = null;
      let tradingTestResults = null;
      let mobileTestResults = null;
      
      if (tester) {
        console.log(chalk.blue('🧪 Running standard tests...'));
        testResults = await tester.runTests();
      }
      
      if (tradingTester) {
        console.log(chalk.cyan('📊 Running trading-specific tests...'));
        tradingTestResults = await tradingTester.runTests();
      }
      
      if (mobileTester) {
        console.log(chalk.blue('📱 Running mobile-specific tests...'));
        mobileTestResults = await mobileTester.runTests();
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
      
      // Add mobile-specific analysis if available
      if (mobileAnalyzer && mobileTestResults) {
        const mobileAnalysis = mobileAnalyzer.analyzeLogs(logs, mobileTestResults);
        (summary as any).mobileAnalysis = mobileAnalysis;
        (summary as any).mobileTestResults = mobileTestResults;
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
      
      // Cleanup
      terminalFeedback.stopMonitoring();
      cursorAgent.stop();
      cursorAIExecutor.stopPerformanceMonitoring();
      functionPanel.deactivate();
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

async function initializeMobileProject(platform: string = 'auto') {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const configPath = '.iteragentrc.json';
  let config: any;
  
  // Detect mobile platform if auto
  if (platform === 'auto') {
    const mobileProject = detectMobileProject(process.cwd());
    if (mobileProject) {
      platform = mobileProject.platform;
      console.log(chalk.blue(`📱 Auto-detected mobile platform: ${platform}`));
    } else {
      platform = 'react-native'; // Default fallback
      console.log(chalk.yellow('📱 No mobile platform detected, defaulting to React Native'));
    }
  }
  
  config = createMobileConfig(process.cwd(), platform);
  
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
  
  console.log(chalk.blue('📱 Mobile development features enabled:'));
  console.log(chalk.blue(`  • Platform: ${platform}`));
  console.log(chalk.blue(`  • Bundler: ${config.mobile.bundler}`));
  console.log(chalk.blue(`  • Build tools: ${config.mobile.buildTools.join(', ')}`));
  console.log(chalk.blue(`  • Device testing: ${config.mobile.deviceTesting ? 'enabled' : 'disabled'}`));
  console.log(chalk.blue(`  • Simulator testing: ${config.mobile.simulatorTesting ? 'enabled' : 'disabled'}`));
  console.log(chalk.blue(`  • Hot reload: ${config.mobile.hotReload ? 'enabled' : 'disabled'}`));
}

program.parse();
