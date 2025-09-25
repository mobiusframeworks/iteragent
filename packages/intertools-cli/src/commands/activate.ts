import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import open from 'open';
import { activateLicense, redeemTrial, checkServerHealth } from '../utils/api';
import { saveConfig, loadConfig } from '../utils/storage';
import { decodeToken, formatTimeRemaining } from '../utils/token';

export interface ActivateOptions {
  email?: string;
  trial?: boolean;
  server?: string;
}

export async function activateCommand(options: ActivateOptions = {}) {
  console.log(chalk.blue.bold('🚀 InterTools Pro License Activation'));
  console.log('');

  // Check server health first
  const healthSpinner = ora('Checking server connection...').start();
  const healthCheck = await checkServerHealth();
  
  if (!healthCheck.success) {
    healthSpinner.fail('Server connection failed');
    console.log(chalk.red('❌ Unable to connect to InterTools license server'));
    console.log(chalk.yellow(`   Server: ${options.server || 'http://localhost:3000'}`));
    console.log(chalk.yellow(`   Error: ${healthCheck.error}`));
    console.log('');
    console.log(chalk.cyan('💡 Solutions:'));
    console.log('   • Start the license server: cd apps/server && npm run dev');
    console.log('   • Check server URL with --server flag');
    console.log('   • Verify network connectivity');
    return;
  }
  
  healthSpinner.succeed('Server connection established');
  console.log('');

  // Get email
  let email = options.email;
  if (!email) {
    const emailPrompt = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Enter your email address:',
        validate: (input: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input) || 'Please enter a valid email address';
        }
      }
    ]);
    email = emailPrompt.email;
  }

  // Choose activation method (unless trial is specified)
  let activationMethod = options.trial ? 'trial' : null;
  
  if (!activationMethod) {
    const methodPrompt = await inquirer.prompt([
      {
        type: 'list',
        name: 'method',
        message: 'Choose activation method:',
        choices: [
          {
            name: '🆓 Start 7-day free trial (no payment required)',
            value: 'trial'
          },
          {
            name: '💳 Subscribe now via Stripe Checkout ($30/month after 7-day trial)',
            value: 'subscribe'
          }
        ]
      }
    ]);
    activationMethod = methodPrompt.method;
  }

  console.log('');

  if (activationMethod === 'trial') {
    await handleTrialActivation(email);
  } else {
    await handleSubscriptionActivation(email);
  }
}

async function handleTrialActivation(email: string) {
  console.log(chalk.cyan('🎯 Starting free trial activation...'));
  console.log('');

  const spinner = ora('Generating trial token...').start();
  
  const response = await redeemTrial(email);
  
  if (!response.success) {
    spinner.fail('Trial activation failed');
    console.log(chalk.red('❌ Failed to activate trial'));
    console.log(chalk.yellow(`   Error: ${response.error}`));
    
    if (response.message) {
      console.log(chalk.yellow(`   Details: ${response.message}`));
    }
    
    console.log('');
    console.log(chalk.cyan('💡 Try again later or contact support if the issue persists'));
    return;
  }

  spinner.succeed('Trial token generated successfully!');
  
  const { token, expiresAt, durationDays } = response.data;
  const claims = decodeToken(token);
  
  // Save configuration
  saveConfig({
    token,
    email,
    plan: 'pro',
    expiresAt,
    issuedAt: new Date().toISOString()
  });

  console.log('');
  console.log(chalk.green.bold('🎉 Trial Activated Successfully!'));
  console.log('');
  console.log(chalk.white('📋 Trial Details:'));
  console.log(`   Email: ${chalk.cyan(email)}`);
  console.log(`   Plan: ${chalk.green('Pro (Trial)')}`);
  console.log(`   Duration: ${chalk.yellow(`${durationDays} days`)}`);
  console.log(`   Expires: ${chalk.yellow(new Date(expiresAt).toLocaleString())}`);
  
  if (claims) {
    console.log(`   Time Remaining: ${chalk.yellow(formatTimeRemaining(claims))}`);
  }
  
  console.log('');
  console.log(chalk.white('🛠️  Pro Features Unlocked:'));
  if (claims?.entitlements) {
    claims.entitlements.forEach(feature => {
      console.log(`   ✅ ${formatFeatureName(feature)}`);
    });
  }
  
  console.log('');
  console.log(chalk.cyan('📖 Next Steps:'));
  console.log('   • Your Pro license is now active');
  console.log('   • Use InterTools Pro features in your projects');
  console.log('   • Run "intertools status" to check license status');
  console.log('   • Upgrade to paid subscription before trial expires');
  console.log('');
  console.log(chalk.yellow('💡 To upgrade: npx intertools activate --no-trial'));
}

async function handleSubscriptionActivation(email: string) {
  console.log(chalk.cyan('💳 Starting subscription activation...'));
  console.log('');

  const spinner = ora('Creating Stripe checkout session...').start();
  
  const response = await activateLicense(email);
  
  if (!response.success) {
    spinner.fail('Checkout session creation failed');
    console.log(chalk.red('❌ Failed to create checkout session'));
    console.log(chalk.yellow(`   Error: ${response.error}`));
    return;
  }

  const { checkoutUrl, sessionId } = response.data;
  spinner.succeed('Checkout session created');
  
  console.log('');
  console.log(chalk.green('🌐 Opening Stripe Checkout in your browser...'));
  console.log(chalk.gray(`   Session ID: ${sessionId}`));
  console.log('');

  try {
    await open(checkoutUrl);
    console.log(chalk.cyan('✅ Browser opened successfully'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not open browser automatically'));
    console.log(chalk.white('   Please visit this URL to complete checkout:'));
    console.log(chalk.blue(`   ${checkoutUrl}`));
  }

  console.log('');
  console.log(chalk.white('📋 Subscription Details:'));
  console.log(`   Plan: ${chalk.green('InterTools Pro')}`);
  console.log(`   Price: ${chalk.yellow('$30/month')}`);
  console.log(`   Trial: ${chalk.cyan('7 days free')}`);
  console.log('');
  console.log(chalk.cyan('⏳ Complete the checkout process in your browser...'));
  console.log('   Your license token will be automatically generated after payment');
  console.log('   You can close this terminal and return after checkout');
  console.log('');
  console.log(chalk.yellow('💡 Run "intertools status" after checkout to verify activation'));
}

function formatFeatureName(feature: string): string {
  const featureNames: Record<string, string> = {
    'ai-chat-orchestrator': 'AI Chat Orchestrator',
    'advanced-analysis': 'Advanced Code Analysis',
    'element-extraction': 'Element Extraction',
    'performance-monitoring': 'Performance Monitoring',
    'multi-agent-coordination': 'Multi-Agent Coordination',
    'real-time-ide-sync': 'Real-time IDE Sync',
    'priority-support': 'Priority Support',
    'custom-integrations': 'Custom Integrations'
  };
  
  return featureNames[feature] || feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
