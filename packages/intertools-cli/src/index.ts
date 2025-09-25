#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { activateCommand } from './commands/activate';
import { statusCommand } from './commands/status';
import { clearConfig } from './utils/storage';

const program = new Command();

program
  .name('intertools')
  .description('InterTools Pro License Management CLI')
  .version('1.0.0');

// Activate command
program
  .command('activate')
  .description('Activate InterTools Pro license')
  .option('-e, --email <email>', 'Email address for activation')
  .option('-t, --trial', 'Start free trial (no payment required)')
  .option('-s, --server <url>', 'License server URL')
  .action(async (options) => {
    try {
      await activateCommand(options);
    } catch (error) {
      console.error(chalk.red('❌ Activation failed:'), error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check license status and information')
  .action(async () => {
    try {
      await statusCommand();
    } catch (error) {
      console.error(chalk.red('❌ Status check failed:'), error);
      process.exit(1);
    }
  });

// Clear command (for troubleshooting)
program
  .command('clear')
  .description('Clear stored license configuration')
  .action(async () => {
    try {
      clearConfig();
    } catch (error) {
      console.error(chalk.red('❌ Clear failed:'), error);
      process.exit(1);
    }
  });

// Default command (show help or activate)
program
  .action(async () => {
    console.log(chalk.blue.bold('🚀 InterTools Pro CLI'));
    console.log('');
    console.log(chalk.white('Available commands:'));
    console.log('  activate    Activate your InterTools Pro license');
    console.log('  status      Check your current license status');
    console.log('  clear       Clear stored license configuration');
    console.log('');
    console.log(chalk.cyan('Quick start:'));
    console.log('  npx intertools activate    # Start activation process');
    console.log('  npx intertools status      # Check license status');
    console.log('');
    console.log(chalk.gray('For more help: npx intertools --help'));
  });

// Global error handler
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('❌ Unhandled error:'), error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Goodbye!'));
  process.exit(0);
});

// Parse command line arguments
program.parse();

// If no command provided, show default help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
