#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { Runner } from './runner';
import { Harvester } from './harvester';
import { Tester } from './tester';
import { Summarizer } from './summarizer';
import { TUI } from './tui';
import { loadConfig } from './utils';

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
  .action(async () => {
    try {
      console.log(chalk.blue('🔧 Initializing IterAgent...'));
      await initializeProject();
      console.log(chalk.green('✅ IterAgent initialized!'));
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
      if (tester) {
        console.log(chalk.blue('🧪 Running tests...'));
        testResults = await tester.runTests();
      }
      
      // 5. Generate summary
      console.log(chalk.blue('📊 Generating summary...'));
      const summary = await summarizer.generateSummary(logs, testResults, config);
      
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

async function initializeProject() {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const configPath = '.iteragentrc.json';
  const config = {
    port: 3000,
    startCommand: 'npm run dev',
    routes: ['/'],
    logCaptureDuration: 5000,
    testTimeout: 30000,
    cursorInboxPath: '.cursor/inbox'
  };
  
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
}

program.parse();
