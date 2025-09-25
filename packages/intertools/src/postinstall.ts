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
console.log(colorize('🚀 Quick Start:', 'bright'));
console.log('   ' + colorize('npx intertools', 'cyan') + ' - Interactive setup menu');
console.log('   ' + colorize('npx @intertools/cli activate --trial', 'cyan') + ' - Get 7-day PRO trial');
console.log('');
console.log(colorize('📚 What you can do:', 'bright'));
console.log('   🆓 ' + colorize('FREE:', 'green') + ' Console log formatting, basic IDE integration');
console.log('   💼 ' + colorize('PRO:', 'yellow') + ' AI analysis, performance monitoring, real-time sync');
console.log('');
console.log(colorize('💡 Try it now:', 'dim') + ' ' + colorize('npx intertools', 'cyan'));
console.log('');
