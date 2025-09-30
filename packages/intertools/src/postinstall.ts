#!/usr/bin/env node

// Post-install welcome message for InterTools
// This runs after npm install intertools

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

console.log('');
console.log(colorize('🎉 InterTools installed successfully!', 'green'));
console.log('');
console.log(colorize('✨ ALL FEATURES ARE FREE!', 'bright'));
console.log('   🤖 AI Chat Orchestrator');
console.log('   📟 Terminal Log Monitoring');
console.log('   🌐 Localhost Analysis');
console.log('   📊 Production Monitoring');
console.log('   📈 Google Analytics Integration');
console.log('   🔧 Build Process Analysis');
console.log('   📋 IDE Integration (Cursor, VS Code, WebStorm)');
console.log('');
console.log(colorize('🚀 Get Started:', 'bright'));
console.log('   ' + colorize('npx intertools', 'cyan') + ' - Interactive menu & examples');
console.log('   ' + colorize('const { InterTools } = require("intertools")', 'cyan') + ' - Use in code');
console.log('');
console.log(colorize('💡 No limits, no subscriptions, no payments required!', 'green'));
console.log(colorize('💡 Try it now:', 'dim') + ' ' + colorize('npx intertools', 'cyan'));
console.log('');