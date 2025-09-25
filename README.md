# InterTools 🚀

**Professional console log analysis and IDE integration** - Advanced console log capture with AI-powered analysis, real-time IDE sync, and intelligent development insights. Features both FREE and PRO versions with subscription-based advanced capabilities.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![InterTools Pro](https://img.shields.io/badge/InterTools%20Pro-Available-gold)](https://intertools.pro)
[![Version](https://img.shields.io/badge/Version-1.0.15-blue)](https://www.npmjs.com/package/intertools)
[![CLI Version](https://img.shields.io/badge/CLI-1.0.0-green)](https://www.npmjs.com/package/@intertools/cli)

## ✨ What is InterTools?

InterTools creates a comprehensive development ecosystem with two powerful versions:

### 🆓 **InterTools FREE** - Console Log Bridge to Cursor
1. **📝 Smart Log Capture** - Captures console.log, console.error, console.warn automatically
2. **🎯 Direct Cursor Integration** - One-click push to Cursor with formatted markdown reports
3. **🔄 Real-time Analysis** - Instant log processing and IDE-ready formatting
4. **💡 Zero Configuration** - Copy, paste, and start capturing logs immediately
5. **🌍 Universal Web Support** - Works on any website via browser console injection

### 💼 **InterTools PRO** - Advanced AI Chat Orchestration
1. **🤖 AI-Powered Chat Orchestrator** - Advanced multi-agent system with GPT integration
2. **👥 Specialized Agent Team** - Console harvester, terminal monitor, chat communicator, log interpreter
3. **💬 Interactive AI Analysis** - Real-time conversation with AI agents about your code
4. **🔍 Advanced Error Analysis** - Deep stack trace analysis and intelligent fix suggestions
5. **⚡ Element Extraction** - Analyze page structure and extract HTML components
6. **📊 Performance Monitoring** - Advanced metrics, memory usage, and optimization insights
7. **🎯 Multi-Agent Coordination** - Specialized agents working together for maximum productivity
8. **🔄 Real-time IDE Sync** - Auto-push insights to Cursor, VS Code, and other IDEs

### 🚀 **New: Browser Extensions & Web Platform**
- **Chrome Extension** - Auto-inject InterTools on any website
- **Web Landing Page** - http://localhost:5174 for easy script access
- **Developer Mode** - Full PRO access for testing and development
- **Payment Integration** - Stripe-powered subscriptions ($30/month after 7-day free trial)

## 🎯 Key Features

### 🆓 **FREE Version Features**
- **📝 Console Log Capture**: Automatic console.log, console.error, console.warn capture
- **🎯 Direct Cursor Integration**: One-click "Push to Cursor" functionality
- **📊 Markdown Reports**: Clean, formatted reports for IDE integration
- **🌍 Universal Web Support**: Works on any website via browser console
- **⚡ Zero Setup**: Copy-paste script injection, no installation required
- **🔄 Real-time Processing**: Instant log capture and formatting

### 💼 **PRO Version Features**
- **🤖 AI Chat Orchestrator**: Advanced multi-agent system with GPT-4 integration
- **👥 Specialized Agent Team**: Five specialized agents working in coordination
- **💬 Interactive AI Analysis**: Real-time conversation with AI about your code
- **🔍 Advanced Error Analysis**: Deep stack trace analysis and intelligent suggestions
- **⚡ Element Extraction**: Analyze and extract HTML page components
- **📊 Performance Monitoring**: Memory usage, CPU metrics, and optimization insights
- **🎯 Multi-Agent Orchestration**: Coordinated workflow enhancement
- **🔄 Real-time IDE Sync**: Auto-push to Cursor, VS Code, WebStorm, Sublime
- **🛡️ Protected Scripts**: Server-side delivery with licensing and anti-tampering
- **💳 7-Day Free Trial**: Full PRO access, then $30/month

### 🚀 **Platform & Integration Features**
- **🌐 Web Landing Page**: Professional interface at http://localhost:5174
- **🔌 Chrome Extension**: Auto-inject on all websites with one-click toggle
- **🔧 Developer Mode**: Bypass restrictions for testing and development
- **💳 Stripe Integration**: Secure payment processing and subscription management
- **🤖 Agent Zero Integration**: Enhanced capabilities with Agent Zero runtime
- **📱 Cross-Platform**: Works on desktop, mobile, and tablet browsers
- **🎮 Interactive TUI**: Beautiful terminal interface for monitoring and control
- **⚙️ Flexible Configuration**: Customize ports, routes, timeouts, and more
- **🔗 Multiple Project Types**: Supports Node.js, Python, Rust, Go, and more

## 🌐 InterTools Pro Web Platform

InterTools Pro features a comprehensive web platform with professional subscription services, browser extensions, and advanced AI chat orchestration.

### ✨ **Web Landing Page Features**
- **🆓 FREE Script Access**: Copy-paste script for instant console log capture
- **💼 PRO Version Trial**: 7-day free trial with full AI chat orchestrator access
- **🔧 Developer Mode**: Full PRO access for testing and development (`devMode()`)
- **💳 Stripe Integration**: Secure payment processing ($30/month after trial)
- **📱 Responsive Design**: Works perfectly on desktop, mobile, and tablet
- **🛠️ Download Center**: Chrome extensions, documentation, and scripts

### 🚀 **Quick Start - Web Platform**
```bash
# Start InterTools Pro Frontend
cd intertools-pro-frontend
npm run dev
# Visit: http://localhost:5174

# Start Chat Orchestrator Backend
cd packages/iteragent-cli
node dist/index.js web-chat --start
```

### 📋 **Available Commands**
```bash
# Web Chat Server (PRO Backend)
npx intertools@1.0.14 web-chat --start
npx intertools@1.0.14 web-chat --start --port 3002
npx intertools@1.0.14 web-chat --logs
npx intertools@1.0.14 web-chat --clear

# Agent Orchestrator (Advanced AI)
npx intertools@1.0.14 orchestrator --start
npx intertools@1.0.14 orchestrator --status
npx intertools@1.0.14 orchestrator --agents
```

### 🎯 **Use Cases**
- **🆓 FREE**: Direct console log capture and Cursor integration
- **💼 PRO**: Advanced AI analysis, chat orchestration, element extraction
- **🔧 Development**: Full-stack debugging with AI-powered insights
- **🧪 Testing**: Automated log analysis and performance monitoring
- **📊 Analytics**: Advanced metrics and optimization recommendations

### 🔌 **Browser Extension Integration**
- **Chrome Extension**: Auto-inject InterTools on all websites
- **One-Click Toggle**: Enable/disable InterTools per site
- **Universal Support**: Works on localhost and production websites
- **Element Extraction**: Click elements to analyze structure
- **Real-time Sync**: Instant communication with IDEs

**📚 Full Documentation**: See [WEB_CHAT_GUIDE.md](WEB_CHAT_GUIDE.md) and [intertools-pro-frontend/README.md](intertools-pro-frontend/README.md) for complete setup instructions.

## 👥 Specialized Agent Team

InterTools features five specialized agents that work together in continuous monitoring loops:

### 🔍 Console Log Harvester
- **Purpose**: Captures and analyzes console output in real-time
- **Capabilities**: Console monitoring, log capture, error detection, pattern recognition
- **Frequency**: Every 5 seconds
- **Output**: Structured log data for analysis

### 📊 Terminal Log Monitor  
- **Purpose**: Tracks terminal commands and output
- **Capabilities**: Terminal monitoring, command tracking, output analysis, process monitoring
- **Frequency**: Every 5 seconds
- **Output**: Command execution data and terminal output

### 💬 Cursor Chat Communicator
- **Purpose**: Sends compact summaries to Cursor AI chat
- **Capabilities**: Chat integration, message formatting, priority routing, actionable suggestions
- **Frequency**: Every 15 seconds
- **Output**: Max 100-character summaries to Cursor chat

### 🧠 Log Interpreter
- **Purpose**: Analyzes logs and extracts meaningful insights
- **Capabilities**: Log analysis, error interpretation, context understanding, pattern matching
- **Frequency**: Every 10 seconds
- **Output**: Structured analysis with severity levels and suggestions

### ⚡ Code Change Suggester
- **Purpose**: Provides actionable code suggestions for fixes
- **Capabilities**: Code analysis, fix suggestions, implementation guidance, Anthropic integration
- **Frequency**: On-demand based on error analysis
- **Output**: Specific, implementable code changes

## 🚀 Quick Start

### **📦 Installation**

```bash
# Install InterTools globally
npm install -g intertools

# Or install CLI separately for license management
npm install -g @intertools/cli
```

### **🆓 FREE Version - Basic Usage**

```bash
# Install and use directly in your project
npm install intertools

# Use in your code
const { InterTools } = require('intertools');

const intertools = new InterTools();
const logs = [
  { type: 'error', message: 'API call failed', timestamp: new Date() },
  { type: 'log', message: 'User logged in', timestamp: new Date() }
];

// Format for Cursor IDE
const report = intertools.formatForCursor(logs);
console.log(report.output);
```

### **💼 PRO Version - Advanced Features**

1. **Activate Your License**:
   ```bash
   # Start 7-day free trial (no payment required)
   npx @intertools/cli activate --trial
   
   # Or subscribe for full access
   npx @intertools/cli activate
   ```

2. **Check License Status**:
   ```bash
   npx @intertools/cli status
   ```

3. **Use PRO Features**:
   ```javascript
   const { InterTools } = require('intertools');
   
   const intertools = new InterTools();
   
   // AI-powered analysis (PRO only)
   const analysis = await intertools.analyzeCode(logs);
   
   // Performance monitoring (PRO only)
   const metrics = await intertools.monitorPerformance();
   
   // Real-time IDE sync (PRO only)
   await intertools.syncToIde(data, { ide: 'cursor' });
   ```

### **🌐 Web Integration**

```javascript
// Browser console injection
// Copy from: https://intertools.pro
(function() {
  // InterTools script automatically injected
  // Captures console.log, console.error, console.warn
  // Provides floating 🛠️ button for analysis
})();
```

### **🔌 Environment Setup**

```bash
# Option 1: Environment variable
export INTERTOOLS_LICENSE="your_jwt_token_here"

# Option 2: Project .env file
echo "INTERTOOLS_LICENSE=your_token_here" >> .env

# Option 3: Config file (automatic after activation)
# ~/.config/intertools/config.json
```

## 🔧 **Installation & Setup**

## 📋 **Available Commands**

### **Main Package Commands**
```bash
# Install InterTools
npm install -g intertools

# Use in your project
npm install intertools

# Basic usage
node -e "
const { InterTools } = require('intertools');
const intertools = new InterTools();
console.log('InterTools ready!');
"
```

### **License Management (CLI)**
```bash
# Install license CLI
npm install -g @intertools/cli

# Activate free trial (7 days, no payment)
npx @intertools/cli activate --trial

# Subscribe for full access
npx @intertools/cli activate

# Check license status
npx @intertools/cli status

# Clear license configuration
npx @intertools/cli clear
```

### **Advanced Server Commands**
```bash
# Clone repository for development
git clone https://github.com/luvs2spluj/intertools.git
cd intertools

# Start license server
cd apps/server
npm run generate-keys
npm run dev

# Start web platform
cd intertools-pro-frontend  
npm run dev
```

### **Feature Usage Examples**
```bash
# Check if you have PRO access
node -e "
const { hasProAccess } = require('intertools');
hasProAccess('ai-chat-orchestrator').then(hasAccess => {
  console.log('PRO access:', hasAccess);
});
"

# Use PRO features with error handling
node -e "
const { requirePro } = require('intertools');
requirePro('ai-chat-orchestrator')
  .then(() => console.log('✅ PRO feature available'))
  .catch(err => console.log('❌ Activation needed:', err.message));
"
```

## 🆕 **Latest Components & Upgrades**

### **v1.0.15 - InterTools Pro Platform with Paywall (December 2024)**

#### **🌟 New Components Added:**
- **`apps/server/`** - Complete license management server with JWT & Stripe
- **`@intertools/cli`** - Professional CLI for license activation and management  
- **`intertools` v1.0.15** - Enhanced runtime library with `requirePro()` feature gating
- **JWT RS256 System** - Secure token-based license verification
- **Stripe Integration** - 7-day free trial + $30/month subscription
- **Rate Limiting** - Anti-abuse protection (3 trials per email per 24 hours)
- **Cross-platform Storage** - `~/.config/intertools/config.json` token storage
- **Offline Verification** - Built-in public key for offline license checking

#### **🔧 Enhanced Components:**
- **Feature Gating** - `requirePro()` function protects advanced features
- **License Management** - Comprehensive activation and verification system
- **Error Handling** - Clear activation instructions in error messages
- **Browser Integration** - Token verification for web extensions
- **IDE Integration** - Seamless Cursor, VS Code, WebStorm integration
- **Production Ready** - Complete test suite and documentation

#### **📦 New File Structure:**
```
apps/server/                      # 🆕 License management server
├─ src/
│  ├─ index.ts                    # Express server with JWT & Stripe
│  ├─ routes/
│  │  ├─ license.ts               # License activation & verification
│  │  ├─ webhook.ts               # Stripe webhook handling
│  │  ├─ usage.ts                 # Feature usage tracking
│  │  └─ bridge.ts                # Extension integration
│  └─ utils/
│     ├─ jwt.ts                   # RS256 token management
│     ├─ stripe.ts                # Payment processing
│     └─ rate-limiter.ts          # Anti-abuse protection
├─ scripts/generate-keys.js       # RSA key generation
└─ __tests__/                     # Comprehensive test suite

packages/@intertools/cli/         # 🆕 License management CLI
├─ src/
│  ├─ index.ts                    # CLI with Commander.js
│  ├─ commands/
│  │  ├─ activate.ts              # Interactive activation
│  │  └─ status.ts                # License status checking
│  └─ utils/
│     ├─ storage.ts               # Cross-platform token storage
│     ├─ api.ts                   # Server communication
│     └─ token.ts                 # Token parsing & validation
└─ __tests__/                     # CLI test suite

packages/intertools/              # 🆕 Enhanced runtime library
├─ src/
│  ├─ index.ts                    # Main exports & InterTools class
│  └─ license.ts                  # requirePro() & license verification
└─ __tests__/                     # Runtime test suite
```

## 📁 Complete Project Structure

```
intertools/
├─ apps/
│  └─ server/                   # 🆕 License management server
│     ├─ src/                   # Express server with JWT & Stripe
│     ├─ scripts/               # Key generation utilities
│     ├─ __tests__/             # Comprehensive test suite
│     └─ package.json           # Server dependencies
├─ packages/
│  ├─ @intertools/cli/          # 🆕 License management CLI
│  │  ├─ src/                   # Interactive activation & status
│  │  ├─ __tests__/             # CLI test suite
│  │  └─ package.json           # CLI dependencies
│  └─ intertools/               # 🆕 Enhanced runtime library
│     ├─ src/                   # requirePro() & feature gating
│     ├─ __tests__/             # Runtime test suite
│     └─ package.json           # Library dependencies
├─ intertools-pro-frontend/     # Professional web platform
│  ├─ index.html               # Landing page with PRO/FREE versions
│  ├─ server.js                # Frontend Express server
│  ├─ downloads/               # Download center with scripts & docs
│  └─ package.json             # Frontend dependencies
├─ browser-extensions/          # Browser extension support
│  └─ chrome/                  # Chrome extension files
├─ examples/
│  └─ react-vite/              # Example React app
├─ docs/
│  ├─ README-PAYWALL.md        # 🆕 Complete paywall guide
│  ├─ ACTIVATION.md            # 🆕 User activation instructions
│  └─ PAYWALL-SUMMARY.md       # 🆕 Implementation summary
├─ pnpm-workspace.yaml         # 🆕 Workspace configuration
├─ README.md                   # This file
├─ LICENSE
└─ package.json                # Root package configuration
```

## 📦 **NPM Packages**

InterTools is distributed as multiple NPM packages for different use cases:

### **Main Package: `intertools`**
```bash
# Install the main library
npm install intertools

# Global installation for CLI access
npm install -g intertools
```

**Features:**
- ✅ Console log capture and formatting
- ✅ Basic Cursor IDE integration
- ✅ FREE features (always available)
- ✅ PRO feature gating with `requirePro()`
- ✅ Offline license verification

**Usage:**
```javascript
const { InterTools, requirePro } = require('intertools');

// Basic usage (FREE)
const intertools = new InterTools();
const report = intertools.formatForCursor(logs);

// PRO features (requires license)
const analysis = await intertools.analyzeCode(logs);
```

### **License CLI: `@intertools/cli`**
```bash
# Install license management CLI
npm install -g @intertools/cli
```

**Features:**
- ✅ Interactive license activation
- ✅ 7-day free trial (no payment)
- ✅ Stripe subscription management
- ✅ License status checking
- ✅ Cross-platform token storage

**Usage:**
```bash
# Activate free trial
npx @intertools/cli activate --trial

# Subscribe for full access
npx @intertools/cli activate

# Check license status
npx @intertools/cli status
```

### **License Server: `@intertools/server`**
```bash
# For self-hosting (optional)
npm install @intertools/server
```

**Features:**
- ✅ JWT token generation and verification
- ✅ Stripe webhook handling
- ✅ Rate limiting and abuse protection
- ✅ Usage tracking and analytics

## 💰 **Pricing & Plans**

### **🆓 FREE Plan**
- ✅ Console log capture
- ✅ Basic Cursor integration
- ✅ Markdown report generation
- ✅ No time limits
- ✅ No feature restrictions on FREE features

### **💼 PRO Plan - $30/month**
- ✅ **7-day free trial** (no payment required)
- ✅ AI-powered code analysis
- ✅ Performance monitoring
- ✅ Real-time IDE sync (Cursor, VS Code, WebStorm)
- ✅ Element extraction and HTML analysis
- ✅ Multi-agent coordination
- ✅ Priority support
- ✅ Advanced integrations

**Start your free trial:**
```bash
npx @intertools/cli activate --trial
```

## ⚙️ Configuration

InterTools can be configured through multiple methods:

```json
{
  "port": 3000,
  "startCommand": "npm run dev",
  "routes": ["/", "/about", "/contact"],
  "logCaptureDuration": 5000,
  "testTimeout": 30000,
  "cursorInboxPath": ".cursor/inbox",
  "outputDir": ".iteragent",
  "headless": true,
  "takeScreenshots": true,
  "workingDirectory": ".",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | 3000 | Port for the dev server |
| `startCommand` | string | "npm run dev" | Command to start the dev server |
| `routes` | string[] | ["/"] | Routes to test with Playwright |
| `logCaptureDuration` | number | 5000 | How long to capture logs (ms) |
| `testTimeout` | number | 30000 | Playwright test timeout (ms) |
| `cursorInboxPath` | string | ".cursor/inbox" | Directory for Cursor integration |
| `outputDir` | string | ".iteragent" | Directory for reports |
| `headless` | boolean | true | Run Playwright in headless mode |
| `takeScreenshots` | boolean | true | Capture screenshots on test failures |
| `workingDirectory` | string | "." | Working directory for the dev server |
| `env` | object | {} | Environment variables for the dev server |

## 🎮 Usage Examples

### Basic Usage

```bash
# Initialize IterAgent in your project
iteragent init

# Run the iterative loop
iteragent run
```

### Advanced Usage

```bash
# Run without tests
iteragent run --no-tests

# Run without interactive TUI
iteragent run --no-tui

# Use custom config file
iteragent run --config ./my-config.json

# Specify custom port
iteragent run --port 8080
```

### Command Line Options

```bash
iteragent run [options]

Options:
  -p, --port <port>        Port to run the dev server on (default: 3000)
  -c, --config <path>      Path to config file (default: .iteragentrc.json)
  --no-tests              Skip Playwright tests
  --no-tui                Skip interactive TUI
  -h, --help              Display help for command
```

## 🔧 How It Works

### 1. Server Management (`runner.ts`)
- Spawns your dev server process
- Monitors stdout/stderr streams
- Handles graceful shutdowns
- Waits for server readiness

### 2. Log Analysis (`harvester.ts`)
- Captures real-time logs
- Classifies log entries (startup, request, error, build, other)
- Extracts metadata (status codes, response times, file paths)
- De-noises and filters relevant information

### 3. Testing (`tester.ts`)
- Runs Playwright smoke tests
- Checks accessibility compliance
- Measures performance metrics
- Captures screenshots on failures
- Validates common web standards

### 4. Summarization (`summarizer.ts`)
- Generates comprehensive reports
- Identifies critical issues
- Provides actionable recommendations
- Creates fix requests for Cursor

### 5. Interactive Interface (`tui.ts`)
- Beautiful terminal interface
- Real-time status updates
- One-click fix request generation
- Detailed report viewing

## 🎯 Supported Project Types

IterAgent automatically detects and supports:

- **Node.js**: npm, yarn, pnpm projects
- **Python**: Flask, Django, FastAPI applications
- **Rust**: Cargo-based projects
- **Go**: Go modules and applications
- **📈 Trading Bots**: Specialized features for financial applications
- **📱 Mobile Development**: React Native, Flutter, Expo, Ionic support
- **Custom**: Any project with a start command

## 📈 Trading Bot Features

IterAgent includes specialized features for trading bot and financial application development:

### 🎯 Automatic Detection
- Detects trading bot projects automatically
- Configures specialized settings for financial applications
- Monitors trading-specific endpoints and data flows

### 📊 Financial Data Validation
- Real-time price and volume data validation
- Data freshness monitoring and alerts
- API endpoint performance tracking
- Trading strategy backtesting validation

### 🧪 Trading-Specific Testing
- Backtest endpoint testing (`/api/backtest`)
- Strategy execution validation (`/api/strategies`)
- Financial data endpoint monitoring (`/api/tickers`, `/api/btc`, `/api/tesla`)
- Performance metrics validation (Sharpe ratio, drawdown, win rate)

### 🚨 Intelligent Alerts
- Price change alerts (configurable thresholds)
- Volume spike detection
- Error rate monitoring
- Performance degradation alerts

### 🚀 Quick Start for Trading Bots
```bash
# Initialize with trading features
iteragent init-trading

# Run with specialized trading analysis
iteragent run
```

For detailed trading features documentation, see [TRADING_FEATURES.md](./TRADING_FEATURES.md).

## 📱 Mobile Development Features

IterAgent includes comprehensive mobile development support for React Native, Flutter, Expo, Ionic, iOS, and Android:

### 🎯 Platform Support
- **React Native**: Metro bundler, hot reload, iOS/Android testing
- **Flutter**: Hot reload, widget testing, platform channels
- **Expo**: Expo CLI, EAS CLI, over-the-air updates
- **Ionic**: Cross-platform, PWA features, native plugins
- **iOS**: Xcode, iOS Simulator, CocoaPods integration
- **Android**: Android SDK, Gradle, Android Emulator

### 📊 Mobile Testing
- **Unit Tests**: Jest, Flutter Test, XCTest, JUnit
- **Integration Tests**: Detox, Flutter Integration Test, Appium
- **E2E Tests**: Mobile viewport, touch events, gestures
- **Performance Tests**: Bundle size, startup time, memory usage

### 🚀 Mobile Performance Monitoring
- **Startup Performance**: App launch time, first screen render
- **Memory Management**: Memory leaks, garbage collection
- **CPU Performance**: Thread performance, main thread blocking
- **Battery Impact**: Background activity, network optimization

### 🚀 Quick Start for Mobile Development
```bash
# Initialize with mobile features (auto-detect platform)
iteragent init-mobile

# Initialize for specific platform
iteragent init-mobile --platform react-native
iteragent init-mobile --platform flutter
iteragent init-mobile --platform expo
iteragent init-mobile --platform ionic

# Run with mobile-specific testing
iteragent run
```

For detailed mobile features documentation, see [MOBILE_FEATURES.md](./MOBILE_FEATURES.md).

## 🔍 Terminal Feedback System

IterAgent provides intelligent terminal feedback that analyzes console logs and sends suggestions directly to Cursor:

### 🎯 Real-time Analysis
- **Live Log Monitoring** - Monitors stdout/stderr in real-time
- **Pattern Recognition** - Detects errors, warnings, and performance issues
- **Smart Filtering** - Reduces noise and focuses on relevant issues
- **Context Awareness** - Understands project type and development patterns

### 💡 Intelligent Suggestions
- **Error Detection** - Identifies and categorizes errors by severity
- **Fix Commands** - Provides specific terminal commands to resolve issues
- **Code Suggestions** - Injects TypeScript/JavaScript code improvements
- **Performance Optimization** - Detects memory leaks and slow operations

### 🎮 Interactive Control
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

### 🚀 Quick Start for Terminal Feedback
```bash
# Enable terminal feedback (default)
iteragent run

# Configure suggestion threshold
iteragent config suggestionThreshold 0.8

# Add useful suggestion types to allowlist
iteragent allowlist add "error"
iteragent allowlist add "performance"
iteragent allowlist add "security"
```

For detailed terminal feedback documentation, see [TERMINAL_FEEDBACK.md](./TERMINAL_FEEDBACK.md).

## 🤖 Agent Zero Integration

IterAgent includes **two powerful Agent Zero integrations**:

### 🚀 **Agent Zero Git Integration** (Recommended)
**Fast, safe, and universal** - automatically pulls from the official Agent Zero repository and sets up a local environment with user prompts and flexible installation options.

#### Key Features:
- **Automatic Git Clone**: Pulls from official [Agent Zero repository](https://github.com/agent0ai/agent-zero)
- **Flexible Installation**: Python venv, Docker, or local installation options
- **User Prompts**: Interactive prompts guide installation preferences
- **No Docker Required**: Works without Docker installation
- **Real-time Dashboard**: Web-based monitoring and control interface
- **Health Monitoring**: Automatic health checks and performance metrics
- **Security Modes**: Configurable security settings (strict, moderate, permissive)

#### Quick Start:
```bash
# Start with user prompts (recommended)
iteragent agent-zero --start

# Install Agent Zero
iteragent agent-zero --install

# Open dashboard
iteragent agent-zero --dashboard

# Check status
iteragent agent-zero --status
```

### 🐳 **Agent Zero Docker Mode** (Advanced)
**Docker-based integration** - requires Docker but provides full containerized Agent Zero runtime.

#### Key Features:
- **Docker Integration**: Seamless integration with Agent Zero Docker containers
- **Visualization Dashboard**: Real-time monitoring and control interface
- **Comprehensive Logging**: Detailed logs of all activities and interactions
- **Settings Management**: Easy configuration and customization
- **Performance Enhancement**: Automatic performance optimization suggestions
- **Project Tracking**: Monitor multiple projects and sessions
- **Real-time Updates**: Live updates via WebSocket connections

#### Quick Start:
```bash
# Start Docker-based Agent Zero mode
iteragent agent-zero --start --docker

# Open visualization dashboard
iteragent agent-zero --dashboard

# Check status
iteragent agent-zero --status

# View logs
iteragent agent-zero --logs
```

For detailed Agent Zero integration documentation, see [AGENT_ZERO_GIT_INTEGRATION.md](./AGENT_ZERO_GIT_INTEGRATION.md).

## 🔗 Cursor Integration

IterAgent integrates seamlessly with Cursor IDE:

1. **Creates `.cursor/inbox/` directory** for fix requests
2. **Generates timestamped fix request files** with detailed issue analysis
3. **Provides ready-to-use prompts** for Cursor's AI
4. **Maintains conversation context** across iterations

### Example Fix Request

```markdown
# Fix Request - 2024-01-15T10:30:00.000Z

## 🚨 Critical Issues
- Server failed to start: Port 3000 already in use

## ❌ Server Errors (2)
- **2024-01-15T10:29:45.123Z**: EADDRINUSE: address already in use :::3000
- **2024-01-15T10:29:46.456Z**: Server startup failed

## 🧪 Test Failures (1)
- **http://localhost:3000/**: HTTP 500: Internal Server Error

## 📊 Summary
- Server Health: unhealthy
- Total Log Entries: 15
- Errors: 2
- Warnings: 3
- Tests Passed: 0/1
- Average Response Time: 0ms

## 🔧 Recommended Actions
- Fix port conflict by using available port
- Resolve server startup errors
- Implement proper error handling
```

## 🧪 Example App

The `examples/react-vite/` directory contains a complete React + Vite application that demonstrates IterAgent's capabilities:

- **Counter functionality** for testing interactions
- **Error handling** for testing error scenarios
- **Multiple routes** for comprehensive testing
- **Responsive design** for accessibility testing

To try it out:

```bash
cd examples/react-vite
npm install
iteragent init
iteragent run
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/alexhorton/iteragent.git
cd iteragent

# Install dependencies
cd packages/iteragent-cli
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Playwright](https://playwright.dev/) for excellent testing capabilities
- [Commander.js](https://github.com/tj/commander.js) for CLI framework
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for interactive prompts
- [Chalk](https://github.com/chalk/chalk) for beautiful terminal colors

## 🚀 **Getting Started (Quick)**

### **1. Install InterTools**
```bash
npm install -g intertools
```

### **2. Activate PRO (Optional)**
```bash
# Start 7-day free trial
npx @intertools/cli activate --trial
```

### **3. Use in Your Project**
```javascript
const { InterTools } = require('intertools');

const intertools = new InterTools();
const logs = [
  { type: 'error', message: 'API failed', timestamp: new Date() }
];

// FREE: Format for Cursor
const report = intertools.formatForCursor(logs);
console.log(report.output);

// PRO: AI analysis (requires license)
try {
  const analysis = await intertools.analyzeCode(logs);
  console.log('AI Analysis:', analysis);
} catch (error) {
  console.log('Upgrade needed:', error.message);
}
```

### **4. Browser Integration**
```javascript
// Copy from https://intertools.pro
// Paste in any website's browser console
// Provides floating 🛠️ button for log analysis
```

## 📦 **NPM Publishing Info**

### **Published Packages**
- **`intertools`** - Main library with FREE and PRO features
- **`@intertools/cli`** - License management CLI
- **`@intertools/server`** - Self-hosted license server (optional)

### **Installation Methods**
```bash
# Method 1: Main package only
npm install intertools

# Method 2: Global installation with CLI
npm install -g intertools @intertools/cli

# Method 3: Project-specific with CLI
npm install intertools
npm install -g @intertools/cli

# Method 4: Everything (for development)
git clone https://github.com/luvs2spluj/intertools.git
cd intertools
pnpm install
```

## 📞 Support

- **Website**: [intertools.pro](https://intertools.pro)
- **Issues**: [GitHub Issues](https://github.com/luvs2spluj/intertools/issues)
- **Discussions**: [GitHub Discussions](https://github.com/luvs2spluj/intertools/discussions)
- **Documentation**: [Complete Guides](https://github.com/luvs2spluj/intertools/tree/main/docs)
- **Email**: support@intertools.pro

### **Quick Help**
```bash
# Check license status
npx @intertools/cli status

# Get help
npx @intertools/cli --help

# View available features
node -e "console.log(require('intertools'))"
```

---

**🚀 Built for modern developers who want powerful console log analysis and AI-powered development insights.**

**Made with ❤️ for the Cursor community and beyond.**
