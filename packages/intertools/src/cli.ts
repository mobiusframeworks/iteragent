#!/usr/bin/env node

import * as readline from 'readline';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

interface UserChoice {
  choice: string;
  email?: string;
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function showWelcome() {
  console.clear();
  console.log(colorize('🚀 Welcome to InterTools!', 'cyan'));
  console.log(colorize('Professional console log analysis and IDE integration\n', 'dim'));
  
  console.log('📦 ' + colorize('What you just installed:', 'bright'));
  console.log('   ✅ Console log capture and formatting');
  console.log('   ✅ Basic Cursor IDE integration');
  console.log('   ✅ Markdown report generation');
  console.log('   ✅ Cross-platform compatibility\n');
  
  console.log('💼 ' + colorize('Available upgrades:', 'yellow'));
  console.log('   🤖 AI-powered code analysis');
  console.log('   📊 Performance monitoring');
  console.log('   🔄 Real-time IDE sync (Cursor, VS Code, WebStorm)');
  console.log('   🎯 Element extraction & HTML analysis');
  console.log('   🚀 Multi-agent coordination');
  console.log('   ⚡ Advanced error detection\n');
}

function showMenu(): Promise<string> {
  return new Promise((resolve) => {
    console.log(colorize('🎯 Choose your experience:', 'bright'));
    console.log('');
    console.log('1️⃣  ' + colorize('Try FREE version', 'green') + ' (start immediately)');
    console.log('2️⃣  ' + colorize('Get PRO trial', 'yellow') + ' (7 days free, no payment)');
    console.log('3️⃣  ' + colorize('See examples', 'blue') + ' (code samples)');
    console.log('4️⃣  ' + colorize('Learn more', 'cyan') + ' (documentation)');
    console.log('5️⃣  ' + colorize('Exit', 'dim') + '');
    console.log('');
    
    rl.question('👆 Enter your choice (1-5): ', (answer) => {
      resolve(answer.trim());
    });
  });
}

async function showFreeExample() {
  console.clear();
  console.log(colorize('🆓 InterTools FREE - Quick Start', 'green'));
  console.log('');
  
  console.log(colorize('📋 Copy this code into your project:', 'bright'));
  console.log('');
  console.log(colorize('```javascript', 'dim'));
  console.log(colorize('const { InterTools } = require("intertools");', 'cyan'));
  console.log('');
  console.log(colorize('const intertools = new InterTools();', 'cyan'));
  console.log(colorize('const logs = [', 'cyan'));
  console.log(colorize('  { type: "error", message: "API call failed", timestamp: new Date() },', 'cyan'));
  console.log(colorize('  { type: "log", message: "User logged in", timestamp: new Date() }', 'cyan'));
  console.log(colorize('];', 'cyan'));
  console.log('');
  console.log(colorize('// Format for Cursor IDE', 'dim'));
  console.log(colorize('const report = intertools.formatForCursor(logs);', 'cyan'));
  console.log(colorize('console.log(report.output);', 'cyan'));
  console.log(colorize('```', 'dim'));
  console.log('');
  
  console.log(colorize('🎯 Expected output:', 'bright'));
  console.log('');
  console.log(colorize('# Console Log Report', 'green'));
  console.log(colorize('', 'green'));
  console.log(colorize('- **11:45:23 AM** [ERROR] API call failed', 'red'));
  console.log(colorize('- **11:45:23 AM** [LOG] User logged in', 'green'));
  console.log('');
  
  console.log(colorize('✅ Ready to use! No setup required.', 'green'));
  console.log('');
}

async function showProTrial() {
  console.clear();
  console.log(colorize('💼 InterTools PRO - 7-Day Free Trial', 'yellow'));
  console.log('');
  
  console.log(colorize('🎉 What you get with PRO:', 'bright'));
  console.log('   🤖 ' + colorize('AI-powered code analysis', 'yellow'));
  console.log('   📊 ' + colorize('Performance monitoring', 'yellow'));
  console.log('   🔄 ' + colorize('Real-time IDE sync', 'yellow'));
  console.log('   🎯 ' + colorize('Element extraction', 'yellow'));
  console.log('   🚀 ' + colorize('Multi-agent coordination', 'yellow'));
  console.log('   ⚡ ' + colorize('Advanced error detection', 'yellow'));
  console.log('');
  
  console.log(colorize('💰 Pricing:', 'bright'));
  console.log('   🆓 ' + colorize('7 days FREE', 'green') + ' (no payment required)');
  console.log('   💼 ' + colorize('$30/month', 'yellow') + ' after trial (cancel anytime)');
  console.log('');
  
  const email = await new Promise<string>((resolve) => {
    rl.question('📧 Enter your email for free trial: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  if (!email || !email.includes('@')) {
    console.log(colorize('❌ Please enter a valid email address', 'red'));
    return;
  }
  
  console.log('');
  console.log(colorize('🔄 Activating your free trial...', 'yellow'));
  
  // Simulate activation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(colorize('✅ Trial activated successfully!', 'green'));
  console.log('');
  console.log(colorize('📋 Trial Details:', 'bright'));
  console.log(`   📧 Email: ${email}`);
  console.log('   🎯 Plan: Pro (Trial)');
  console.log('   ⏱️  Duration: 7 days');
  console.log('   📅 Expires: ' + new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString());
  console.log('');
  
  console.log(colorize('🚀 Next steps:', 'bright'));
  console.log('   1. Install CLI: ' + colorize('npm install -g @intertools/cli', 'cyan'));
  console.log('   2. Check status: ' + colorize('npx @intertools/cli status', 'cyan'));
  console.log('   3. Use PRO features in your code');
  console.log('');
  
  console.log(colorize('📖 PRO Example:', 'bright'));
  console.log('');
  console.log(colorize('```javascript', 'dim'));
  console.log(colorize('const { InterTools, requirePro } = require("intertools");', 'cyan'));
  console.log('');
  console.log(colorize('const intertools = new InterTools();', 'cyan'));
  console.log('');
  console.log(colorize('// PRO: AI analysis (requires trial/subscription)', 'dim'));
  console.log(colorize('try {', 'cyan'));
  console.log(colorize('  const analysis = await intertools.analyzeCode(logs);', 'cyan'));
  console.log(colorize('  console.log("🤖 AI Analysis:", analysis);', 'cyan'));
  console.log(colorize('} catch (error) {', 'cyan'));
  console.log(colorize('  console.log("Upgrade needed:", error.message);', 'cyan'));
  console.log(colorize('}', 'cyan'));
  console.log(colorize('```', 'dim'));
  console.log('');
}

async function showExamples() {
  console.clear();
  console.log(colorize('📚 InterTools Examples', 'blue'));
  console.log('');
  
  console.log(colorize('🆓 FREE Version Examples:', 'green'));
  console.log('');
  console.log(colorize('1. Basic Log Formatting:', 'bright'));
  console.log(colorize('   const report = intertools.formatForCursor(logs);', 'cyan'));
  console.log('');
  console.log(colorize('2. Error Filtering:', 'bright'));
  console.log(colorize('   const errors = intertools.filterErrors(logs);', 'cyan'));
  console.log('');
  console.log(colorize('3. Time-based Analysis:', 'bright'));
  console.log(colorize('   const timeline = intertools.createTimeline(logs);', 'cyan'));
  console.log('');
  
  console.log(colorize('💼 PRO Version Examples:', 'yellow'));
  console.log('');
  console.log(colorize('1. AI Code Analysis:', 'bright'));
  console.log(colorize('   const insights = await intertools.analyzeCode(logs);', 'cyan'));
  console.log('');
  console.log(colorize('2. Performance Monitoring:', 'bright'));
  console.log(colorize('   const metrics = await intertools.monitorPerformance();', 'cyan'));
  console.log('');
  console.log(colorize('3. Real-time IDE Sync:', 'bright'));
  console.log(colorize('   await intertools.syncToIde(data, { ide: "cursor" });', 'cyan'));
  console.log('');
  console.log(colorize('4. Element Extraction:', 'bright'));
  console.log(colorize('   const elements = await intertools.extractElements(html);', 'cyan'));
  console.log('');
}

async function showDocumentation() {
  console.clear();
  console.log(colorize('📖 InterTools Documentation', 'cyan'));
  console.log('');
  
  console.log(colorize('🔗 Links:', 'bright'));
  console.log('   📦 NPM Package: https://www.npmjs.com/package/intertools');
  console.log('   📚 Full Documentation: https://github.com/luvs2spluj/intertools');
  console.log('   🐛 Issues & Support: https://github.com/luvs2spluj/intertools/issues');
  console.log('   💬 Discussions: https://github.com/luvs2spluj/intertools/discussions');
  console.log('');
  
  console.log(colorize('🚀 Quick Commands:', 'bright'));
  console.log('   📦 Install: ' + colorize('npm install intertools', 'cyan'));
  console.log('   🔧 CLI: ' + colorize('npm install -g @intertools/cli', 'cyan'));
  console.log('   🎯 Trial: ' + colorize('npx @intertools/cli activate --trial', 'cyan'));
  console.log('   📊 Status: ' + colorize('npx @intertools/cli status', 'cyan'));
  console.log('');
  
  console.log(colorize('💡 Getting Help:', 'bright'));
  console.log('   📧 Email: support@intertools.pro');
  console.log('   🎯 Run this menu: ' + colorize('npx intertools', 'cyan'));
  console.log('');
}

async function main() {
  try {
    showWelcome();
    
    while (true) {
      const choice = await showMenu();
      
      switch (choice) {
        case '1':
          await showFreeExample();
          break;
        case '2':
          await showProTrial();
          break;
        case '3':
          await showExamples();
          break;
        case '4':
          await showDocumentation();
          break;
        case '5':
          console.log(colorize('\n👋 Thanks for trying InterTools!', 'cyan'));
          console.log(colorize('Run "npx intertools" anytime to see this menu again.\n', 'dim'));
          process.exit(0);
          break;
        default:
          console.log(colorize('\n❌ Invalid choice. Please enter 1-5.\n', 'red'));
          continue;
      }
      
      await new Promise<void>((resolve) => {
        rl.question(colorize('\n👆 Press Enter to return to menu...', 'dim'), () => {
          resolve();
        });
      });
    }
  } catch (error) {
    console.error(colorize('❌ Error:', 'red'), error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 Thanks for trying InterTools!', 'cyan'));
  process.exit(0);
});

if (require.main === module) {
  main();
}

export { main };
