# IterAgent CLI 🚀

**Iterative testing agent for Cursor IDE** - Automatically runs your app, captures logs, runs tests, and feeds insights back to Cursor for seamless development.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue)](https://www.typescriptlang.org/)
[![NPM Version](https://img.shields.io/badge/npm-1.0.0-blue)](https://www.npmjs.com/package/iteragent-cli)

## ✨ What is IterAgent?

IterAgent creates a seamless development loop inside Cursor IDE:

1. **🚀 Starts your dev server** (npm run dev, etc.)
2. **📝 Captures and analyzes logs** in real-time
3. **🔍 Provides terminal feedback** with intelligent suggestions
4. **🧪 Runs Playwright smoke tests** against your app
5. **📊 Generates intelligent summaries** of issues and recommendations
6. **🎮 Provides interactive TUI** to send fix requests to Cursor
7. **🔄 Continues the loop** for iterative development

## 🎯 Key Features

- **Zero Configuration**: Works out of the box with most projects
- **Smart Log Analysis**: De-noises logs, classifies errors, extracts metadata
- **Terminal Feedback System**: Real-time console log analysis and intelligent suggestions
- **Smart Suggestion Management**: Allowlist/blocklist for suggestion filtering
- **Automatic Code Execution**: Execute suggested commands and inject code
- **Comprehensive Testing**: Playwright-based smoke tests with accessibility checks
- **Cursor Integration**: Seamlessly feeds fix requests to Cursor's AI
- **Interactive TUI**: Beautiful terminal interface for monitoring and control
- **Flexible Configuration**: Customize ports, routes, timeouts, and more
- **Multiple Project Types**: Supports Node.js, Python, Rust, Go, and more

## 🚀 Quick Start

### Installation

```bash
npm install -g iteragent-cli
```

### Initialize in Your Project

```bash
cd your-project
iteragent init
```

This creates a `.iteragentrc.json` configuration file and `.cursor/inbox/` directory.

### Run the Iterative Loop

```bash
iteragent run
```

## 🔍 Terminal Feedback System

IterAgent provides intelligent terminal feedback that analyzes console logs and sends suggestions directly to Cursor:

### Real-time Analysis
- **Live Log Monitoring** - Monitors stdout/stderr in real-time
- **Pattern Recognition** - Detects errors, warnings, and performance issues
- **Smart Filtering** - Reduces noise and focuses on relevant issues
- **Context Awareness** - Understands project type and development patterns

### Intelligent Suggestions
- **Error Detection** - Identifies and categorizes errors by severity
- **Fix Commands** - Provides specific terminal commands to resolve issues
- **Code Suggestions** - Injects TypeScript/JavaScript code improvements
- **Performance Optimization** - Detects memory leaks and slow operations

### Interactive Control
```bash
# Manage terminal feedback
iteragent feedback --enable
iteragent feedback --disable
iteragent feedback --status

# Manage suggestion filters
iteragent allowlist add "error"
iteragent allowlist add "performance"
iteragent blocklist add "deprecated"

# View and manage suggestions
iteragent suggestions
iteragent suggestions --clear
iteragent suggestions --type error

# Execute suggestions
iteragent execute suggestion_id
```

## 📈 Trading Bot Features

IterAgent includes specialized features for trading bot and financial application development:

### Automatic Detection
- Detects trading bot projects automatically
- Configures specialized settings for financial applications
- Monitors trading-specific endpoints and data flows

### Financial Data Validation
- Real-time price and volume data validation
- Data freshness monitoring and alerts
- API endpoint performance tracking
- Trading strategy backtesting validation

### Trading-Specific Testing
- Backtest endpoint testing (`/api/backtest`)
- Strategy execution validation (`/api/strategies`)
- Financial data endpoint monitoring (`/api/tickers`, `/api/btc`, `/api/tesla`)
- Performance metrics validation (Sharpe ratio, drawdown, win rate)

### Quick Start for Trading Bots
```bash
# Initialize for trading bot development
iteragent init-trading

# Run with trading-specific analysis
iteragent run
```

## 📱 Mobile Development Features

IterAgent supports mobile development with platform-specific optimizations:

### Platform Support
- **React Native** - Metro bundler, Jest testing, Detox E2E
- **Flutter** - Hot reload, Flutter Test, Flutter Driver
- **Expo** - Expo CLI, Expo Test, EAS Build
- **Ionic** - Ionic CLI, Capacitor, Cordova
- **iOS** - Xcodebuild, iOS Simulator, XCTest
- **Android** - Gradle, Android Emulator, Espresso

### Mobile Testing
- **Unit Tests** - Jest, Flutter Test, Jasmine
- **Integration Tests** - React Native Testing Library, Flutter Integration Tests
- **E2E Tests** - Detox, Flutter Driver, Appium
- **Performance Tests** - Startup time, memory usage, CPU usage, battery impact

### Mobile Performance Monitoring
- **Bundle Size Analysis** - Monitor app size and optimization opportunities
- **Startup Time Tracking** - Measure app launch performance
- **Memory Usage Monitoring** - Track memory leaks and optimization
- **CPU Usage Tracking** - Monitor performance bottlenecks
- **Battery Impact Analysis** - Optimize for battery efficiency

### Quick Start for Mobile Development
```bash
# Initialize for mobile development
iteragent init-mobile --platform react-native
iteragent init-mobile --platform flutter
iteragent init-mobile --platform expo
iteragent init-mobile --platform ionic

# Run with mobile-specific testing
iteragent run
```

## 🔗 Cursor Integration

IterAgent integrates seamlessly with Cursor IDE:

1. **Creates `.cursor/inbox/` directory** for fix requests
2. **Generates timestamped fix request files** with detailed issue analysis
3. **Provides ready-to-use prompts** for Cursor's AI
4. **Maintains conversation context** across iterations
5. **Sends terminal feedback** directly to Cursor's inbox

### Example Fix Request

```markdown
# Fix Request - 2024-01-15T10:30:00.000Z

## 🚨 Critical Issues
- Server failed to start: Port 3000 already in use

## ❌ Server Errors (2)
- **2024-01-15T10:29:45.123Z**: EADDRINUSE: address already in use :::3000
- **2024-01-15T10:29:46.456Z**: Server startup failed

## 💡 Suggested Fixes
1. Kill existing process on port 3000
2. Use different port in configuration
3. Check for zombie processes

## 🧪 Test Results
- **Accessibility**: ✅ Passed
- **Performance**: ⚠️ Slow loading detected
- **Functionality**: ❌ Server not responding
```

## ⚙️ Configuration

### Basic Configuration (`.iteragentrc.json`)

```json
{
  "port": 3000,
  "startCommand": "npm run dev",
  "routes": ["/", "/api/health"],
  "logCaptureDuration": 5000,
  "testTimeout": 30000,
  "cursorInboxPath": ".cursor/inbox",
  "terminalFeedback": {
    "enableSuggestions": true,
    "suggestionThreshold": 0.7,
    "autoExecute": false,
    "maxSuggestions": 10,
    "enableCodeExecution": true
  }
}
```

### Advanced Configuration

```json
{
  "port": 3000,
  "startCommand": "npm run dev",
  "routes": [
    "/",
    "/api/health",
    "/api/users",
    "/api/products"
  ],
  "logCaptureDuration": 10000,
  "testTimeout": 60000,
  "cursorInboxPath": ".cursor/inbox",
  "terminalFeedback": {
    "enableSuggestions": true,
    "suggestionThreshold": 0.8,
    "autoExecute": false,
    "maxSuggestions": 15,
    "allowlistFile": ".iteragent/allowlist.json",
    "blocklistFile": ".iteragent/blocklist.json",
    "logAnalysisDepth": 100,
    "enableCodeExecution": true,
    "executionTimeout": 30000
  },
  "cursorAgent": {
    "enableAutoExecution": false,
    "maxMessages": 50,
    "enableCodeInjection": true,
    "enableTerminalControl": true,
    "feedbackInterval": 10000
  }
}
```

## 🛠️ Commands

### Basic Commands
```bash
# Initialize IterAgent in your project
iteragent init

# Start the iterative testing loop
iteragent run

# Show help
iteragent --help
```

### Specialized Initialization
```bash
# Initialize for trading bot development
iteragent init-trading

# Initialize for mobile development
iteragent init-mobile --platform react-native
iteragent init-mobile --platform flutter
iteragent init-mobile --platform expo
iteragent init-mobile --platform ionic
```

### Terminal Feedback Management
```bash
# Manage terminal feedback
iteragent feedback --enable
iteragent feedback --disable
iteragent feedback --status

# Manage suggestion filters
iteragent allowlist add "error"
iteragent allowlist add "performance"
iteragent allowlist remove "deprecated"

iteragent blocklist add "deprecated"
iteragent blocklist add "info"
iteragent blocklist remove "deprecated"

# View and manage suggestions
iteragent suggestions
iteragent suggestions --clear
iteragent suggestions --type error

# Execute suggestions
iteragent execute suggestion_id
```

### Configuration Management
```bash
# Update configuration settings
iteragent config suggestionThreshold 0.8
iteragent config autoExecute true
iteragent config maxSuggestions 15
```

## 🎮 Interactive TUI

IterAgent provides a beautiful terminal interface for monitoring and control:

- **Real-time Status** - Live updates on server status, tests, and suggestions
- **Interactive Controls** - Start/stop monitoring, execute suggestions
- **Suggestion Management** - View, filter, and manage suggestions
- **Configuration Updates** - Modify settings on the fly
- **Log Streaming** - Real-time log output with intelligent highlighting

## 📊 Supported Project Types

### Web Applications
- **React** - Create React App, Next.js, Vite
- **Vue** - Vue CLI, Nuxt.js, Vite
- **Angular** - Angular CLI
- **Svelte** - SvelteKit, Vite
- **Node.js** - Express, Fastify, Koa
- **Python** - Flask, Django, FastAPI
- **Rust** - Actix, Warp, Axum
- **Go** - Gin, Echo, Fiber

### Trading Bots
- **Python** - FastAPI, Flask, Django
- **Node.js** - Express, NestJS
- **Financial APIs** - Binance, Coinbase, Alpha Vantage
- **Data Sources** - Yahoo Finance, IEX Cloud, Polygon

### Mobile Applications
- **React Native** - Metro bundler, Jest, Detox
- **Flutter** - Hot reload, Flutter Test, Flutter Driver
- **Expo** - Expo CLI, Expo Test, EAS Build
- **Ionic** - Ionic CLI, Capacitor, Cordova
- **iOS** - Xcodebuild, iOS Simulator, XCTest
- **Android** - Gradle, Android Emulator, Espresso

## 🔧 Requirements

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Playwright** (installed automatically)
- **Cursor IDE** (for full integration)

## 📚 Documentation

- **[TERMINAL_FEEDBACK.md](./TERMINAL_FEEDBACK.md)** - Complete terminal feedback system guide
- **[TRADING_FEATURES.md](./TRADING_FEATURES.md)** - Trading bot specific features
- **[MOBILE_FEATURES.md](./MOBILE_FEATURES.md)** - Mobile development features
- **[ENHANCEMENT_SUMMARY.md](./ENHANCEMENT_SUMMARY.md)** - Feature overview and enhancements

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/luvs2spluj/iteragent.git
cd iteragent

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Cursor IDE** - For providing an amazing AI-powered development environment
- **Playwright** - For comprehensive testing capabilities
- **Commander.js** - For building the CLI interface
- **Chalk** - For beautiful terminal colors
- **Inquirer** - For interactive prompts

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/luvs2spluj/iteragent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/luvs2spluj/iteragent/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/luvs2spluj/iteragent/wiki)

---

**Made with ❤️ for the Cursor community**

Transform your development workflow with IterAgent - the intelligent testing agent that brings your terminal logs to life! 🚀
