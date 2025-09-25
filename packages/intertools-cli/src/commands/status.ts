import chalk from 'chalk';
import ora from 'ora';
import { getStoredToken, loadConfig, getConfigPath } from '../utils/storage';
import { verifyToken } from '../utils/api';
import { decodeToken, isTokenExpired, formatTimeRemaining, isTrialToken, getPlanDisplayName } from '../utils/token';

export async function statusCommand() {
  console.log(chalk.blue.bold('📊 InterTools Pro License Status'));
  console.log('');

  // Check for stored token
  const token = getStoredToken();
  
  if (!token) {
    console.log(chalk.red('❌ No license found'));
    console.log('');
    console.log(chalk.cyan('💡 To activate your license:'));
    console.log('   • Run: npx intertools activate');
    console.log('   • Or set INTERTOOLS_LICENSE environment variable');
    console.log('');
    console.log(chalk.gray(`   Config file: ${getConfigPath()}`));
    return;
  }

  // Decode token for basic info
  const claims = decodeToken(token);
  
  if (!claims) {
    console.log(chalk.red('❌ Invalid token format'));
    console.log('');
    console.log(chalk.cyan('💡 Try activating a new license:'));
    console.log('   npx intertools activate');
    return;
  }

  // Display basic token info
  console.log(chalk.white('📋 License Information:'));
  console.log(`   Email: ${chalk.cyan(claims.email)}`);
  console.log(`   Plan: ${chalk.green(getPlanDisplayName(claims.plan))}${isTrialToken(claims) ? chalk.yellow(' (Trial)') : ''}`);
  console.log(`   User ID: ${chalk.gray(claims.sub)}`);
  
  // Check expiry
  const expired = isTokenExpired(claims);
  if (expired) {
    console.log(`   Status: ${chalk.red('EXPIRED')}`);
    console.log(`   Expired: ${chalk.red(new Date(claims.exp * 1000).toLocaleString())}`);
  } else {
    console.log(`   Status: ${chalk.green('ACTIVE')}`);
    console.log(`   Expires: ${chalk.yellow(new Date(claims.exp * 1000).toLocaleString())}`);
    console.log(`   Time Remaining: ${chalk.yellow(formatTimeRemaining(claims))}`);
  }

  console.log('');

  // Verify token online
  const spinner = ora('Verifying license with server...').start();
  const verification = await verifyToken(token);
  
  if (!verification.success) {
    spinner.fail('Online verification failed');
    console.log(chalk.yellow('⚠️  Could not verify license online'));
    console.log(chalk.gray(`   Error: ${verification.error}`));
    console.log(chalk.gray('   Using offline verification only'));
  } else {
    const verifyData = verification.data;
    if (verifyData.valid) {
      spinner.succeed('License verified online');
      
      if (verifyData.isExpiringSoon) {
        console.log(chalk.yellow('⚠️  License expires soon!'));
      }
    } else {
      spinner.fail('License verification failed');
      console.log(chalk.red('❌ License is invalid or revoked'));
      console.log(chalk.gray(`   Reason: ${verifyData.error}`));
    }
  }

  console.log('');

  // Display entitlements
  if (claims.entitlements && claims.entitlements.length > 0) {
    console.log(chalk.white('🛠️  Available Features:'));
    claims.entitlements.forEach(feature => {
      const status = expired ? chalk.red('EXPIRED') : chalk.green('AVAILABLE');
      console.log(`   ${status} ${formatFeatureName(feature)}`);
    });
  } else {
    console.log(chalk.gray('   No Pro features available'));
  }

  console.log('');

  // Display configuration info
  const config = loadConfig();
  console.log(chalk.white('⚙️  Configuration:'));
  console.log(`   Config File: ${chalk.gray(getConfigPath())}`);
  console.log(`   Server URL: ${chalk.gray(config.serverUrl || 'default')}`);
  console.log(`   Token Source: ${getStoredToken() === process.env.INTERTOOLS_LICENSE ? 'Environment Variable' : 'Config File'}`);

  console.log('');

  // Action recommendations
  if (expired) {
    console.log(chalk.cyan('💡 Your license has expired. To renew:'));
    console.log('   • Run: npx intertools activate');
    console.log('   • Visit your billing portal to update payment');
  } else if (isTrialToken(claims)) {
    console.log(chalk.cyan('💡 You are on a trial license. To upgrade:'));
    console.log('   • Run: npx intertools activate');
    console.log('   • Choose "Subscribe now" to continue after trial');
  } else {
    console.log(chalk.green('✅ Your Pro license is active and ready to use!'));
  }
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
