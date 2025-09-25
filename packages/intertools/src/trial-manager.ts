import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface TrialData {
  installDate: string;
  trialStarted: boolean;
  upgradePrompted: boolean;
}

const TRIAL_DURATION_DAYS = 7;
const CONFIG_DIR = path.join(os.homedir(), '.config', 'intertools');
const TRIAL_FILE = path.join(CONFIG_DIR, 'trial.json');

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Get install date from package or create new trial data
 */
export function getInstallDate(): Date {
  ensureConfigDir();
  
  try {
    if (fs.existsSync(TRIAL_FILE)) {
      const data: TrialData = JSON.parse(fs.readFileSync(TRIAL_FILE, 'utf8'));
      return new Date(data.installDate);
    }
  } catch (error) {
    console.warn('Warning: Could not read trial data, creating new trial');
  }
  
  // Create new trial data
  const now = new Date();
  const trialData: TrialData = {
    installDate: now.toISOString(),
    trialStarted: true,
    upgradePrompted: false
  };
  
  try {
    fs.writeFileSync(TRIAL_FILE, JSON.stringify(trialData, null, 2));
  } catch (error) {
    console.warn('Warning: Could not save trial data');
  }
  
  return now;
}

/**
 * Check if trial has expired
 */
export function isTrialExpired(): boolean {
  const installDate = getInstallDate();
  const daysSinceInstall = (Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceInstall > TRIAL_DURATION_DAYS;
}

/**
 * Get days remaining in trial
 */
export function getDaysRemaining(): number {
  const installDate = getInstallDate();
  const daysSinceInstall = (Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, TRIAL_DURATION_DAYS - Math.floor(daysSinceInstall));
}

/**
 * Show upgrade prompt for expired trial
 */
export function showUpgradePrompt(featureName: string): void {
  const daysRemaining = getDaysRemaining();
  
  if (daysRemaining > 0) {
    console.log(`\n🎯 ${featureName} - ${daysRemaining} days remaining in trial`);
    return;
  }
  
  console.log(`\n🔒 ${featureName} requires InterTools PRO`);
  console.log('');
  console.log('📊 Your 7-day trial has ended.');
  console.log('');
  console.log('💼 Continue with InterTools PRO ($30/month):');
  console.log('   🚀 All advanced features');
  console.log('   🤖 AI chat orchestrator');
  console.log('   📊 Production monitoring');
  console.log('   📈 Google Analytics integration');
  console.log('   🏆 Priority support');
  console.log('');
  console.log('💡 Upgrade now: npx @intertools/cli activate');
  console.log('📚 Learn more: npx intertools info');
  console.log('');
}

/**
 * Check trial status and show appropriate messages
 */
export function checkTrialStatus(): void {
  const installDate = getInstallDate();
  const daysRemaining = getDaysRemaining();
  const isExpired = isTrialExpired();
  
  if (!isExpired) {
    if (daysRemaining <= 1) {
      console.log(`\n⏰ Trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}!`);
      console.log('💼 Upgrade to PRO: npx @intertools/cli activate');
    } else if (daysRemaining <= 3) {
      console.log(`\n🔔 ${daysRemaining} days left in your InterTools trial`);
    }
  } else {
    // Mark as upgrade prompted to avoid spam
    try {
      if (fs.existsSync(TRIAL_FILE)) {
        const data: TrialData = JSON.parse(fs.readFileSync(TRIAL_FILE, 'utf8'));
        if (!data.upgradePrompted) {
          console.log('\n🎉 Thank you for trying InterTools!');
          console.log('');
          console.log('📊 Your usage during the 7-day trial:');
          console.log('   🔧 Terminal monitoring');
          console.log('   🌐 Localhost analysis');
          console.log('   🤖 AI insights');
          console.log('   📈 Performance tracking');
          console.log('');
          console.log('💼 Continue with InterTools PRO ($30/month):');
          console.log('   ✅ Keep all features you\'ve been using');
          console.log('   ✅ Production site monitoring');
          console.log('   ✅ Google Analytics integration');
          console.log('   ✅ Priority support');
          console.log('');
          console.log('🚀 Upgrade now: npx @intertools/cli activate');
          console.log('');
          
          // Mark as prompted
          data.upgradePrompted = true;
          fs.writeFileSync(TRIAL_FILE, JSON.stringify(data, null, 2));
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
}

/**
 * Reset trial (for testing)
 */
export function resetTrial(): void {
  try {
    if (fs.existsSync(TRIAL_FILE)) {
      fs.unlinkSync(TRIAL_FILE);
    }
  } catch (error) {
    console.warn('Warning: Could not reset trial data');
  }
}

/**
 * Get trial statistics
 */
export function getTrialStats(): {
  installDate: Date;
  daysElapsed: number;
  daysRemaining: number;
  isExpired: boolean;
  isActive: boolean;
} {
  const installDate = getInstallDate();
  const daysElapsed = Math.floor((Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = getDaysRemaining();
  const isExpired = isTrialExpired();
  
  return {
    installDate,
    daysElapsed,
    daysRemaining,
    isExpired,
    isActive: !isExpired
  };
}
