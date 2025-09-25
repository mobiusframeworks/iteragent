import { LogEntry, HarvestedLogs } from './harvester';
import { MobileTestSuite } from './mobile-tester';

export interface MobileLogAnalysis {
  platform: {
    detectedPlatform: string;
    bundler: string;
    buildTools: string[];
    deviceSupport: string[];
  };
  
  buildProcess: {
    buildTime: number;
    buildErrors: number;
    buildWarnings: number;
    bundleSize: number;
    buildSuccess: boolean;
  };
  
  runtime: {
    startupTime: number;
    hotReloads: number;
    crashes: number;
    memoryLeaks: number;
    performanceIssues: number;
  };
  
  mobileFeatures: {
    touchEvents: number;
    gestures: number;
    navigationEvents: number;
    deviceOrientationChanges: number;
    networkRequests: number;
  };
  
  deviceCompatibility: {
    iosIssues: number;
    androidIssues: number;
    simulatorIssues: number;
    emulatorIssues: number;
    physicalDeviceIssues: number;
  };
  
  performance: {
    averageResponseTime: number;
    slowOperations: string[];
    memoryUsage: number;
    cpuUsage: number;
    batteryImpact: number;
  };
  
  recommendations: string[];
  criticalIssues: string[];
}

export class MobileAnalyzer {
  analyzeLogs(logs: HarvestedLogs, testResults: MobileTestSuite | null): MobileLogAnalysis {
    const analysis: MobileLogAnalysis = {
      platform: {
        detectedPlatform: 'unknown',
        bundler: 'unknown',
        buildTools: [],
        deviceSupport: []
      },
      
      buildProcess: {
        buildTime: 0,
        buildErrors: 0,
        buildWarnings: 0,
        bundleSize: 0,
        buildSuccess: true
      },
      
      runtime: {
        startupTime: 0,
        hotReloads: 0,
        crashes: 0,
        memoryLeaks: 0,
        performanceIssues: 0
      },
      
      mobileFeatures: {
        touchEvents: 0,
        gestures: 0,
        navigationEvents: 0,
        deviceOrientationChanges: 0,
        networkRequests: 0
      },
      
      deviceCompatibility: {
        iosIssues: 0,
        androidIssues: 0,
        simulatorIssues: 0,
        emulatorIssues: 0,
        physicalDeviceIssues: 0
      },
      
      performance: {
        averageResponseTime: 0,
        slowOperations: [],
        memoryUsage: 0,
        cpuUsage: 0,
        batteryImpact: 0
      },
      
      recommendations: [],
      criticalIssues: []
    };

    // Analyze platform detection
    this.analyzePlatform(logs, analysis);
    
    // Analyze build process
    this.analyzeBuildProcess(logs, analysis);
    
    // Analyze runtime behavior
    this.analyzeRuntime(logs, analysis);
    
    // Analyze mobile features
    this.analyzeMobileFeatures(logs, analysis);
    
    // Analyze device compatibility
    this.analyzeDeviceCompatibility(logs, analysis);
    
    // Analyze performance
    this.analyzePerformance(logs, analysis);
    
    // Generate recommendations
    this.generateMobileRecommendations(analysis);
    
    // Identify critical issues
    this.identifyMobileCriticalIssues(logs, analysis);

    return analysis;
  }

  private analyzePlatform(logs: HarvestedLogs, analysis: MobileLogAnalysis): void {
    logs.entries.forEach(log => {
      const message = log.message.toLowerCase();
      
      // Detect platform
      if (message.includes('react-native') || message.includes('metro')) {
        analysis.platform.detectedPlatform = 'react-native';
        analysis.platform.bundler = 'metro';
      } else if (message.includes('expo')) {
        analysis.platform.detectedPlatform = 'expo';
        analysis.platform.bundler = 'metro';
      } else if (message.includes('flutter')) {
        analysis.platform.detectedPlatform = 'flutter';
        analysis.platform.bundler = 'flutter-tools';
      } else if (message.includes('ionic')) {
        analysis.platform.detectedPlatform = 'ionic';
        analysis.platform.bundler = 'webpack';
      }
      
      // Detect build tools
      if (message.includes('gradle')) {
        analysis.platform.buildTools.push('gradle');
      }
      if (message.includes('xcodebuild')) {
        analysis.platform.buildTools.push('xcodebuild');
      }
      if (message.includes('cocoapods')) {
        analysis.platform.buildTools.push('cocoapods');
      }
      if (message.includes('android-sdk')) {
        analysis.platform.buildTools.push('android-sdk');
      }
      
      // Detect device support
      if (message.includes('ios') || message.includes('iphone')) {
        analysis.platform.deviceSupport.push('ios');
      }
      if (message.includes('android')) {
        analysis.platform.deviceSupport.push('android');
      }
      if (message.includes('simulator')) {
        analysis.platform.deviceSupport.push('simulator');
      }
      if (message.includes('emulator')) {
        analysis.platform.deviceSupport.push('emulator');
      }
    });
  }

  private analyzeBuildProcess(logs: HarvestedLogs, analysis: MobileLogAnalysis): void {
    let buildStartTime = 0;
    let buildEndTime = 0;
    
    logs.entries.forEach(log => {
      const message = log.message.toLowerCase();
      
      // Track build time
      if (message.includes('building') || message.includes('compiling')) {
        if (buildStartTime === 0) {
          buildStartTime = log.timestamp.getTime();
        }
      }
      
      if (message.includes('build complete') || message.includes('compilation finished')) {
        buildEndTime = log.timestamp.getTime();
      }
      
      // Count build errors
      if (message.includes('build error') || message.includes('compilation error')) {
        analysis.buildProcess.buildErrors++;
      }
      
      // Count build warnings
      if (message.includes('build warning') || message.includes('compilation warning')) {
        analysis.buildProcess.buildWarnings++;
      }
      
      // Detect bundle size
      if (message.includes('bundle size') || message.includes('bundle.js')) {
        const sizeMatch = message.match(/(\d+(?:\.\d+)?)\s*(mb|kb|gb)/i);
        if (sizeMatch) {
          const size = parseFloat(sizeMatch[1]);
          const unit = sizeMatch[2].toLowerCase();
          
          if (unit === 'mb') {
            analysis.buildProcess.bundleSize = size * 1024 * 1024;
          } else if (unit === 'kb') {
            analysis.buildProcess.bundleSize = size * 1024;
          } else if (unit === 'gb') {
            analysis.buildProcess.bundleSize = size * 1024 * 1024 * 1024;
          }
        }
      }
      
      // Detect build success/failure
      if (message.includes('build failed') || message.includes('compilation failed')) {
        analysis.buildProcess.buildSuccess = false;
      }
    });
    
    if (buildStartTime > 0 && buildEndTime > 0) {
      analysis.buildProcess.buildTime = buildEndTime - buildStartTime;
    }
  }

  private analyzeRuntime(logs: HarvestedLogs, analysis: MobileLogAnalysis): void {
    logs.entries.forEach(log => {
      const message = log.message.toLowerCase();
      
      // Track startup time
      if (message.includes('app started') || message.includes('application launched')) {
        // Look for startup time in the message
        const timeMatch = message.match(/(\d+)\s*ms/);
        if (timeMatch) {
          analysis.runtime.startupTime = parseInt(timeMatch[1]);
        }
      }
      
      // Count hot reloads
      if (message.includes('hot reload') || message.includes('fast refresh')) {
        analysis.runtime.hotReloads++;
      }
      
      // Count crashes
      if (message.includes('crash') || message.includes('fatal error') || message.includes('uncaught exception')) {
        analysis.runtime.crashes++;
      }
      
      // Detect memory leaks
      if (message.includes('memory leak') || message.includes('out of memory')) {
        analysis.runtime.memoryLeaks++;
      }
      
      // Detect performance issues
      if (message.includes('slow') || message.includes('performance issue') || message.includes('lag')) {
        analysis.runtime.performanceIssues++;
      }
    });
  }

  private analyzeMobileFeatures(logs: HarvestedLogs, analysis: MobileLogAnalysis): void {
    logs.entries.forEach(log => {
      const message = log.message.toLowerCase();
      
      // Count touch events
      if (message.includes('touch') || message.includes('tap') || message.includes('press')) {
        analysis.mobileFeatures.touchEvents++;
      }
      
      // Count gestures
      if (message.includes('gesture') || message.includes('swipe') || message.includes('pinch') || message.includes('pan')) {
        analysis.mobileFeatures.gestures++;
      }
      
      // Count navigation events
      if (message.includes('navigate') || message.includes('route') || message.includes('screen')) {
        analysis.mobileFeatures.navigationEvents++;
      }
      
      // Count device orientation changes
      if (message.includes('orientation') || message.includes('rotate') || message.includes('landscape') || message.includes('portrait')) {
        analysis.mobileFeatures.deviceOrientationChanges++;
      }
      
      // Count network requests
      if (message.includes('fetch') || message.includes('request') || message.includes('api call')) {
        analysis.mobileFeatures.networkRequests++;
      }
    });
  }

  private analyzeDeviceCompatibility(logs: HarvestedLogs, analysis: MobileLogAnalysis): void {
    logs.entries.forEach(log => {
      const message = log.message.toLowerCase();
      
      // iOS issues
      if (message.includes('ios') && (message.includes('error') || message.includes('issue') || message.includes('problem'))) {
        analysis.deviceCompatibility.iosIssues++;
      }
      
      // Android issues
      if (message.includes('android') && (message.includes('error') || message.includes('issue') || message.includes('problem'))) {
        analysis.deviceCompatibility.androidIssues++;
      }
      
      // Simulator issues
      if (message.includes('simulator') && (message.includes('error') || message.includes('issue') || message.includes('problem'))) {
        analysis.deviceCompatibility.simulatorIssues++;
      }
      
      // Emulator issues
      if (message.includes('emulator') && (message.includes('error') || message.includes('issue') || message.includes('problem'))) {
        analysis.deviceCompatibility.emulatorIssues++;
      }
      
      // Physical device issues
      if (message.includes('device') && (message.includes('error') || message.includes('issue') || message.includes('problem'))) {
        analysis.deviceCompatibility.physicalDeviceIssues++;
      }
    });
  }

  private analyzePerformance(logs: HarvestedLogs, analysis: MobileLogAnalysis): void {
    const responseTimes: number[] = [];
    
    logs.entries.forEach(log => {
      const message = log.message.toLowerCase();
      
      // Extract response times
      if (log.metadata?.responseTime) {
        responseTimes.push(log.metadata.responseTime);
      }
      
      // Detect slow operations
      if (message.includes('slow') || message.includes('timeout')) {
        analysis.performance.slowOperations.push(message);
      }
      
      // Extract memory usage
      if (message.includes('memory') && message.includes('mb')) {
        const memoryMatch = message.match(/(\d+(?:\.\d+)?)\s*mb/i);
        if (memoryMatch) {
          analysis.performance.memoryUsage = parseFloat(memoryMatch[1]) * 1024 * 1024;
        }
      }
      
      // Extract CPU usage
      if (message.includes('cpu') && message.includes('%')) {
        const cpuMatch = message.match(/(\d+(?:\.\d+)?)\s*%/i);
        if (cpuMatch) {
          analysis.performance.cpuUsage = parseFloat(cpuMatch[1]);
        }
      }
      
      // Detect battery impact
      if (message.includes('battery') || message.includes('power')) {
        analysis.performance.batteryImpact++;
      }
    });
    
    // Calculate average response time
    if (responseTimes.length > 0) {
      analysis.performance.averageResponseTime = 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }
  }

  private generateMobileRecommendations(analysis: MobileLogAnalysis): void {
    // Build process recommendations
    if (analysis.buildProcess.buildErrors > 5) {
      analysis.recommendations.push('High number of build errors detected. Consider fixing compilation issues and updating dependencies.');
    }
    
    if (analysis.buildProcess.buildTime > 60000) { // 1 minute
      analysis.recommendations.push('Build time is slow. Consider optimizing build process and using incremental builds.');
    }
    
    if (analysis.buildProcess.bundleSize > 50 * 1024 * 1024) { // 50MB
      analysis.recommendations.push('Bundle size is large. Consider code splitting and removing unused dependencies.');
    }
    
    // Runtime recommendations
    if (analysis.runtime.crashes > 0) {
      analysis.recommendations.push('App crashes detected. Implement proper error handling and crash reporting.');
    }
    
    if (analysis.runtime.memoryLeaks > 0) {
      analysis.recommendations.push('Memory leaks detected. Review component lifecycle and event listeners.');
    }
    
    if (analysis.runtime.startupTime > 3000) { // 3 seconds
      analysis.recommendations.push('App startup time is slow. Consider lazy loading and optimizing initial bundle.');
    }
    
    // Mobile features recommendations
    if (analysis.mobileFeatures.touchEvents === 0) {
      analysis.recommendations.push('No touch events detected. Ensure app is optimized for touch interactions.');
    }
    
    if (analysis.mobileFeatures.gestures === 0) {
      analysis.recommendations.push('No gestures detected. Consider adding swipe, pinch, and pan gestures.');
    }
    
    // Device compatibility recommendations
    if (analysis.deviceCompatibility.iosIssues > 0) {
      analysis.recommendations.push('iOS compatibility issues detected. Test on different iOS versions and devices.');
    }
    
    if (analysis.deviceCompatibility.androidIssues > 0) {
      analysis.recommendations.push('Android compatibility issues detected. Test on different Android versions and screen sizes.');
    }
    
    // Performance recommendations
    if (analysis.performance.averageResponseTime > 1000) {
      analysis.recommendations.push('Slow response times detected. Optimize API calls and implement caching.');
    }
    
    if (analysis.performance.memoryUsage > 200 * 1024 * 1024) { // 200MB
      analysis.recommendations.push('High memory usage detected. Implement memory optimization and garbage collection.');
    }
    
    if (analysis.performance.cpuUsage > 80) {
      analysis.recommendations.push('High CPU usage detected. Optimize rendering and reduce computational complexity.');
    }
  }

  private identifyMobileCriticalIssues(logs: HarvestedLogs, analysis: MobileLogAnalysis): void {
    // Critical build issues
    if (!analysis.buildProcess.buildSuccess) {
      analysis.criticalIssues.push('Critical: Build process failed. App cannot be deployed.');
    }
    
    if (analysis.buildProcess.buildErrors > 10) {
      analysis.criticalIssues.push('Critical: Excessive build errors may prevent app from running.');
    }
    
    // Critical runtime issues
    if (analysis.runtime.crashes > 3) {
      analysis.criticalIssues.push('Critical: Multiple app crashes detected. User experience severely impacted.');
    }
    
    if (analysis.runtime.memoryLeaks > 2) {
      analysis.criticalIssues.push('Critical: Memory leaks detected. App may become unresponsive.');
    }
    
    // Critical performance issues
    if (analysis.performance.averageResponseTime > 5000) {
      analysis.criticalIssues.push('Critical: Response times exceed 5 seconds. App may appear frozen.');
    }
    
    if (analysis.performance.memoryUsage > 500 * 1024 * 1024) { // 500MB
      analysis.criticalIssues.push('Critical: Memory usage exceeds 500MB. App may be terminated by OS.');
    }
    
    // Critical device compatibility issues
    if (analysis.deviceCompatibility.iosIssues > 5 || analysis.deviceCompatibility.androidIssues > 5) {
      analysis.criticalIssues.push('Critical: Multiple platform compatibility issues. App may not work on target devices.');
    }
    
    // Critical mobile features issues
    if (analysis.mobileFeatures.touchEvents === 0 && analysis.platform.detectedPlatform !== 'flutter') {
      analysis.criticalIssues.push('Critical: No touch events detected. App may not be usable on mobile devices.');
    }
  }
}
