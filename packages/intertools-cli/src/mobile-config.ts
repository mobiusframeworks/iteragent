import { IterAgentConfig } from './utils';

export interface MobileConfig extends IterAgentConfig {
  // Mobile-specific configurations
  mobile: {
    platform: 'react-native' | 'flutter' | 'ios' | 'android' | 'expo' | 'ionic';
    bundler: 'metro' | 'webpack' | 'vite' | 'expo-cli' | 'flutter-tools';
    deviceTesting: boolean;
    simulatorTesting: boolean;
    hotReload: boolean;
    debuggingPort: number;
    buildTools: string[];
  };
  
  // React Native specific
  reactNative?: {
    metroPort: number;
    packagerPort: number;
    enableHermes: boolean;
    enableFlipper: boolean;
    enableNewArchitecture: boolean;
    testCommands: string[];
  };
  
  // Flutter specific
  flutter?: {
    flutterPath: string;
    dartSdkPath: string;
    enableHotReload: boolean;
    enableHotRestart: boolean;
    testDevices: string[];
    buildModes: string[];
  };
  
  // iOS specific
  ios?: {
    xcodePath: string;
    simulatorPath: string;
    provisioningProfile: string;
    codeSigningIdentity: string;
    deploymentTarget: string;
  };
  
  // Android specific
  android?: {
    androidSdkPath: string;
    gradlePath: string;
    buildToolsVersion: string;
    compileSdkVersion: string;
    targetSdkVersion: string;
    minSdkVersion: string;
  };
  
  // Mobile testing
  mobileTesting: {
    enabled: boolean;
    testTypes: ('unit' | 'integration' | 'e2e' | 'performance')[];
    deviceTypes: ('simulator' | 'emulator' | 'physical')[];
    testFrameworks: string[];
    performanceThresholds: {
      bundleSize: number;
      startupTime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
  };
}

export const createMobileConfig = (projectPath: string, platform: string): MobileConfig => {
  const baseConfig = {
    port: getDefaultPort(platform),
    startCommand: getStartCommand(platform),
    routes: getDefaultRoutes(platform),
    logCaptureDuration: 15000, // Longer for mobile builds
    testTimeout: 120000, // Longer timeout for mobile tests
    cursorInboxPath: '.cursor/inbox',
    outputDir: '.iteragent',
    headless: false, // Mobile testing often needs UI
    takeScreenshots: true,
    workingDirectory: projectPath,
    env: {
      NODE_ENV: 'development',
      ...getPlatformEnvVars(platform)
    }
  };

  return {
    ...baseConfig,
    
    // Mobile-specific configurations
    mobile: {
      platform: platform as any,
      bundler: getBundler(platform),
      deviceTesting: true,
      simulatorTesting: true,
      hotReload: true,
      debuggingPort: getDebuggingPort(platform),
      buildTools: getBuildTools(platform)
    },
    
    // Platform-specific configurations
    ...getPlatformSpecificConfig(platform, projectPath),
    
    // Mobile testing
    mobileTesting: {
      enabled: true,
      testTypes: ['unit', 'integration', 'e2e'],
      deviceTypes: ['simulator', 'emulator'],
      testFrameworks: getTestFrameworks(platform),
      performanceThresholds: {
        bundleSize: 50 * 1024 * 1024, // 50MB
        startupTime: 3000, // 3 seconds
        memoryUsage: 200 * 1024 * 1024, // 200MB
        cpuUsage: 80 // 80%
      }
    }
  };
};

export const detectMobileProject = (projectPath: string): { platform: string; confidence: number } | null => {
  const fs = require('fs');
  
  try {
    const indicators = {
      'react-native': [
        'package.json',
        'metro.config.js',
        'android/',
        'ios/',
        'App.js',
        'App.tsx',
        'index.js',
        'react-native'
      ],
      'expo': [
        'app.json',
        'expo.json',
        'eas.json',
        'expo/',
        'App.js',
        'App.tsx',
        'expo-cli'
      ],
      'flutter': [
        'pubspec.yaml',
        'lib/',
        'android/',
        'ios/',
        'test/',
        'flutter'
      ],
      'ionic': [
        'ionic.config.json',
        'src/',
        'www/',
        'platforms/',
        'plugins/',
        'ionic'
      ],
      'ios': [
        'ios/',
        'Podfile',
        'Info.plist',
        'xcodeproj',
        'xcworkspace'
      ],
      'android': [
        'android/',
        'build.gradle',
        'gradle.properties',
        'AndroidManifest.xml',
        'src/main/'
      ]
    };
    
    const projectFiles = fs.readdirSync(projectPath, { recursive: true });
    const filePaths = projectFiles.map((file: any) => 
      typeof file === 'string' ? file : String(file)
    );
    
    const scores: Record<string, number> = {};
    
    Object.entries(indicators).forEach(([platform, platformIndicators]) => {
      const matches = platformIndicators.filter(indicator => 
        filePaths.some((filePath: string) => 
          filePath.toLowerCase().includes(indicator.toLowerCase())
        )
      );
      scores[platform] = matches.length / platformIndicators.length;
    });
    
    const bestMatch = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    );
    
    if (bestMatch[1] > 0.3) { // 30% confidence threshold
      return { platform: bestMatch[0], confidence: bestMatch[1] };
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

function getDefaultPort(platform: string): number {
  const ports = {
    'react-native': 8081,
    'expo': 8081,
    'flutter': 8080,
    'ionic': 8100,
    'ios': 8080,
    'android': 8080
  };
  return ports[platform as keyof typeof ports] || 8080;
}

function getStartCommand(platform: string): string {
  const commands = {
    'react-native': 'npx react-native start',
    'expo': 'npx expo start',
    'flutter': 'flutter run',
    'ionic': 'ionic serve',
    'ios': 'npx react-native run-ios',
    'android': 'npx react-native run-android'
  };
  return commands[platform as keyof typeof commands] || 'npm start';
}

function getDefaultRoutes(platform: string): string[] {
  const routes = {
    'react-native': ['/', '/debug', '/reload'],
    'expo': ['/', '/debug', '/reload'],
    'flutter': ['/'],
    'ionic': ['/', '/debug'],
    'ios': ['/'],
    'android': ['/']
  };
  return routes[platform as keyof typeof routes] || ['/'];
}

function getBundler(platform: string): string {
  const bundlers = {
    'react-native': 'metro',
    'expo': 'metro',
    'flutter': 'flutter-tools',
    'ionic': 'webpack',
    'ios': 'metro',
    'android': 'metro'
  };
  return bundlers[platform as keyof typeof bundlers] || 'webpack';
}

function getDebuggingPort(platform: string): number {
  const ports = {
    'react-native': 8081,
    'expo': 8081,
    'flutter': 8080,
    'ionic': 8100,
    'ios': 8080,
    'android': 8080
  };
  return ports[platform as keyof typeof ports] || 8080;
}

function getBuildTools(platform: string): string[] {
  const tools = {
    'react-native': ['metro', 'gradle', 'xcodebuild'],
    'expo': ['expo-cli', 'eas-cli'],
    'flutter': ['flutter', 'dart'],
    'ionic': ['ionic-cli', 'cordova'],
    'ios': ['xcodebuild', 'cocoapods'],
    'android': ['gradle', 'android-sdk']
  };
  return tools[platform as keyof typeof tools] || [];
}

function getPlatformEnvVars(platform: string): Record<string, string> {
  const envVars = {
    'react-native': {
      'REACT_NATIVE_PACKAGER_HOSTNAME': 'localhost',
      'REACT_NATIVE_PACKAGER_PORT': '8081'
    },
    'expo': {
      'EXPO_DEVTOOLS_LISTEN_ADDRESS': 'localhost',
      'EXPO_DEVTOOLS_LISTEN_PORT': '8081'
    },
    'flutter': {
      'FLUTTER_ROOT': '/usr/local/bin/flutter',
      'DART_SDK': '/usr/local/bin/dart'
    },
    'ionic': {
      'IONIC_PORT': '8100',
      'IONIC_HOST': 'localhost'
    },
    'ios': {
      'IOS_SIMULATOR': 'iPhone 14',
      'IOS_DEPLOYMENT_TARGET': '13.0'
    },
    'android': {
      'ANDROID_HOME': '/usr/local/android-sdk',
      'ANDROID_SDK_ROOT': '/usr/local/android-sdk'
    }
  };
  return envVars[platform as keyof typeof envVars] || {};
}

function getPlatformSpecificConfig(platform: string, projectPath: string): any {
  switch (platform) {
    case 'react-native':
      return {
        reactNative: {
          metroPort: 8081,
          packagerPort: 8081,
          enableHermes: true,
          enableFlipper: true,
          enableNewArchitecture: false,
          testCommands: ['npm test', 'npx react-native test']
        }
      };
    
    case 'expo':
      return {
        reactNative: {
          metroPort: 8081,
          packagerPort: 8081,
          enableHermes: true,
          enableFlipper: false,
          enableNewArchitecture: false,
          testCommands: ['npm test', 'npx expo test']
        }
      };
    
    case 'flutter':
      return {
        flutter: {
          flutterPath: '/usr/local/bin/flutter',
          dartSdkPath: '/usr/local/bin/dart',
          enableHotReload: true,
          enableHotRestart: true,
          testDevices: ['iPhone 14', 'Pixel 6'],
          buildModes: ['debug', 'profile', 'release']
        }
      };
    
    case 'ios':
      return {
        ios: {
          xcodePath: '/Applications/Xcode.app',
          simulatorPath: '/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app',
          provisioningProfile: 'Development',
          codeSigningIdentity: 'iPhone Developer',
          deploymentTarget: '13.0'
        }
      };
    
    case 'android':
      return {
        android: {
          androidSdkPath: '/usr/local/android-sdk',
          gradlePath: './android/gradlew',
          buildToolsVersion: '33.0.0',
          compileSdkVersion: '33',
          targetSdkVersion: '33',
          minSdkVersion: '21'
        }
      };
    
    default:
      return {};
  }
}

function getTestFrameworks(platform: string): string[] {
  const frameworks = {
    'react-native': ['jest', 'detox', 'appium'],
    'expo': ['jest', 'expo-testing-library'],
    'flutter': ['flutter_test', 'integration_test'],
    'ionic': ['jest', 'cypress', 'appium'],
    'ios': ['xctest', 'appium'],
    'android': ['junit', 'espresso', 'appium']
  };
  return frameworks[platform as keyof typeof frameworks] || ['jest'];
}
