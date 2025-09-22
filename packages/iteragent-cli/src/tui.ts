import inquirer from 'inquirer';
import chalk from 'chalk';
import { Summary } from './summarizer';
import { promises as fs } from 'fs';
import path from 'path';
import { CursorAIInteractive } from './cursor-ai-interactive';

export class TUI {
  private cursorInboxPath: string;
  private cursorAIInteractive: CursorAIInteractive;

  constructor(cursorInboxPath: string = '.cursor/inbox') {
    this.cursorInboxPath = cursorInboxPath;
    this.cursorAIInteractive = new CursorAIInteractive(cursorInboxPath);
  }

  async showSummary(summary: Summary): Promise<boolean> {
    console.clear();
    
    // Display header
    console.log(chalk.blue.bold('🔄 IterAgent - Development Loop'));
    console.log(chalk.gray('=' .repeat(50)));
    console.log();

    // Display server health
    const healthColor = summary.serverHealth === 'healthy' ? chalk.green : 
                       summary.serverHealth === 'unhealthy' ? chalk.red : chalk.yellow;
    console.log(`${healthColor.bold('Server Health:')} ${healthColor(summary.serverHealth.toUpperCase())}`);
    console.log();

    // Display quick stats
    console.log(chalk.blue.bold('📊 Quick Stats:'));
    console.log(`  Log Entries: ${summary.logAnalysis.summary.totalEntries}`);
    console.log(`  Errors: ${chalk.red(summary.logAnalysis.summary.errorCount)}`);
    console.log(`  Warnings: ${chalk.yellow(summary.logAnalysis.summary.warningCount)}`);
    
    if (summary.testResults) {
      const testColor = summary.testResults.summary.failed > 0 ? chalk.red : chalk.green;
      console.log(`  Tests: ${testColor(`${summary.testResults.summary.passed}/${summary.testResults.summary.total}`)}`);
      console.log(`  Avg Response: ${summary.testResults.summary.averageResponseTime.toFixed(2)}ms`);
    }
    console.log();

    // Display critical issues
    if (summary.criticalIssues.length > 0) {
      console.log(chalk.red.bold('🚨 Critical Issues:'));
      summary.criticalIssues.forEach(issue => {
        console.log(`  ${chalk.red('•')} ${issue}`);
      });
      console.log();
    }

    // Display recent errors
    if (summary.logAnalysis.errors.length > 0) {
      console.log(chalk.red.bold('❌ Recent Errors:'));
      summary.logAnalysis.errors.slice(-3).forEach(error => {
        console.log(`  ${chalk.red('•')} ${error.message}`);
      });
      console.log();
    }

    // Display recommendations
    if (summary.recommendations.length > 0) {
      console.log(chalk.blue.bold('🔧 Recommendations:'));
      summary.recommendations.forEach(rec => {
        console.log(`  ${chalk.blue('•')} ${rec}`);
      });
      console.log();
    }

    // Display action menu
    console.log(chalk.gray('=' .repeat(50)));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          {
            name: '🤖 Interactive Cursor AI Commands (Recommended)',
            value: 'interactive_commands',
            short: 'Interactive AI'
          },
          {
            name: '📝 Send fix request to Cursor (Legacy)',
            value: 'fix_request',
            short: 'Send to Cursor'
          },
          {
            name: '📊 View detailed report',
            value: 'view_report',
            short: 'View Report'
          },
          {
            name: '🔄 Continue monitoring',
            value: 'continue',
            short: 'Continue'
          },
          {
            name: '❌ Exit',
            value: 'exit',
            short: 'Exit'
          }
        ]
      }
    ]);

    switch (action) {
      case 'interactive_commands':
        await this.sendInteractiveCommandsToCursor(summary);
        return true; // Continue the loop
        
      case 'fix_request':
        await this.sendFixRequestToCursor(summary);
        return true; // Continue the loop
        
      case 'view_report':
        await this.showDetailedReport(summary);
        return await this.showSummary(summary); // Show menu again
        
      case 'continue':
        return true; // Continue the loop
        
      case 'exit':
        return false; // Exit the loop
        
      default:
        return true;
    }
  }

  private async sendInteractiveCommandsToCursor(summary: Summary): Promise<void> {
    console.log(chalk.blue('🤖 Creating interactive commands for Cursor AI...'));
    
    try {
      await this.cursorAIInteractive.sendInteractiveCommands(summary);
      
      console.log(chalk.green('✅ Interactive commands created successfully!'));
      console.log();
      console.log(chalk.yellow('💡 How to use in Cursor AI chat:'));
      console.log(chalk.gray('   1. Open Cursor AI chat'));
      console.log(chalk.gray('   2. Look for the "intertools-interactive.md" file'));
      console.log(chalk.gray('   3. Select a command ID from the list'));
      console.log(chalk.gray('   4. Type: "Execute command: [COMMAND_ID]"'));
      console.log(chalk.gray('   5. Cursor AI will run the command and provide results'));
      console.log();
      console.log(chalk.cyan('🎯 Available command types:'));
      console.log(chalk.gray('   • Fix errors automatically'));
      console.log(chalk.gray('   • Analyze warnings'));
      console.log(chalk.gray('   • Apply optimizations'));
      console.log(chalk.gray('   • Continue development loop'));
      console.log();
      
      // Wait for user to press Enter
      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: 'Press Enter to continue...',
          default: ''
        }
      ]);
      
    } catch (error) {
      console.error(chalk.red('❌ Error creating interactive commands:'), error);
    }
  }

  private async sendFixRequestToCursor(summary: Summary): Promise<void> {
    console.log(chalk.blue('📝 Preparing fix request for Cursor...'));
    
    try {
      // Ensure cursor inbox directory exists
      await fs.mkdir(this.cursorInboxPath, { recursive: true });
      
      // Create a timestamped fix request file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fix-request-${timestamp}.md`;
      const filepath = path.join(this.cursorInboxPath, filename);
      
      // Write the fix request
      await fs.writeFile(filepath, summary.fixRequest);
      
      console.log(chalk.green(`✅ Fix request sent to Cursor!`));
      console.log(chalk.gray(`   File: ${filepath}`));
      console.log();
      console.log(chalk.yellow('💡 Cursor should now detect the fix request and help you resolve the issues.'));
      console.log(chalk.yellow('   Press Enter in Cursor to apply the suggested fixes.'));
      console.log();
      
      // Wait for user to press Enter
      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: 'Press Enter to continue...',
          default: ''
        }
      ]);
      
    } catch (error) {
      console.error(chalk.red('❌ Error sending fix request:'), error);
    }
  }

  private async showDetailedReport(summary: Summary): Promise<void> {
    console.clear();
    
    console.log(chalk.blue.bold('📊 Detailed Report'));
    console.log(chalk.gray('=' .repeat(50)));
    console.log();

    // Server Health Details
    console.log(chalk.blue.bold('🏥 Server Health Analysis:'));
    console.log(`  Status: ${summary.serverHealth}`);
    console.log(`  Total Log Entries: ${summary.logAnalysis.summary.totalEntries}`);
    console.log(`  Error Rate: ${((summary.logAnalysis.summary.errorCount / summary.logAnalysis.summary.totalEntries) * 100).toFixed(2)}%`);
    console.log();

    // Log Categories Breakdown
    console.log(chalk.blue.bold('📝 Log Categories:'));
    Object.entries(summary.logAnalysis.summary.categories).forEach(([category, count]) => {
      const percentage = ((count / summary.logAnalysis.summary.totalEntries) * 100).toFixed(1);
      console.log(`  ${category}: ${count} (${percentage}%)`);
    });
    console.log();

    // Test Results Details
    if (summary.testResults) {
      console.log(chalk.blue.bold('🧪 Test Results:'));
      summary.testResults.results.forEach(result => {
        const statusEmoji = result.status === 'pass' ? '✅' : 
                           result.status === 'fail' ? '❌' : '⚠️';
        console.log(`  ${statusEmoji} ${result.url}`);
        console.log(`    Response Time: ${result.responseTime}ms`);
        if (result.errors.length > 0) {
          console.log(`    Errors: ${result.errors.join(', ')}`);
        }
        if (result.warnings.length > 0) {
          console.log(`    Warnings: ${result.warnings.join(', ')}`);
        }
        if (result.accessibility) {
          console.log(`    Accessibility Score: ${result.accessibility.score}/100`);
        }
        console.log();
      });
    }

    // All Errors
    if (summary.logAnalysis.errors.length > 0) {
      console.log(chalk.red.bold('❌ All Errors:'));
      summary.logAnalysis.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.timestamp.toISOString()}] ${error.message}`);
      });
      console.log();
    }

    // All Warnings
    if (summary.logAnalysis.warnings.length > 0) {
      console.log(chalk.yellow.bold('⚠️ All Warnings:'));
      summary.logAnalysis.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. [${warning.timestamp.toISOString()}] ${warning.message}`);
      });
      console.log();
    }

    console.log(chalk.gray('=' .repeat(50)));
    
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to return to main menu...',
        default: ''
      }
    ]);
  }

  // Utility method to check if Cursor inbox exists
  async checkCursorInbox(): Promise<boolean> {
    try {
      await fs.access(this.cursorInboxPath);
      return true;
    } catch {
      return false;
    }
  }

  // Utility method to list recent fix requests
  async listRecentFixRequests(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.cursorInboxPath);
      return files
        .filter(file => file.startsWith('fix-request-') && file.endsWith('.md'))
        .sort()
        .reverse()
        .slice(0, 5);
    } catch {
      return [];
    }
  }
}
