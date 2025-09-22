# InterTools 🚀

**Intelligent development tools with multi-agent orchestration for Cursor IDE** - Specialized agents continuously monitor logs, interpret errors, and provide compact feedback to Cursor AI for enhanced development workflow.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue)](https://www.typescriptlang.org/)

## ✨ What is InterTools?

InterTools creates a "big gun" multi-agent orchestration system inside Cursor IDE:

1. **👥 Specialized Agent Team** - Console harvester, terminal monitor, chat communicator, log interpreter, code suggester
2. **🔄 Continuous Monitoring Loops** - Real-time log analysis every 5-15 seconds
3. **💬 Compact Cursor Integration** - Summarized feedback that doesn't overwhelm your screen
4. **🔍 Intelligent Error Interpretation** - Clear definitions of what errors mean and imply
5. **⚡ Actionable Code Suggestions** - Specific, implementable fixes for Anthropic/Cursor AI
6. **🎯 Enhanced Workflow Efficiency** - Multi-agent coordination for maximum productivity

## 🎯 Key Features

- **👥 Specialized Agent Team**: Five specialized agents working in coordination
- **🔄 Continuous Monitoring**: Real-time log analysis in continuous loops
- **💬 Compact Summaries**: Max 100-character summaries for Cursor chat
- **🔍 Intelligent Interpretation**: Clear error definitions and code implications
- **⚡ Actionable Suggestions**: Specific, implementable code changes
- **🎯 Multi-Agent Orchestration**: Coordinated workflow enhancement
- **📊 Real-Time Analysis**: Console and terminal log monitoring every 5-15 seconds
- **🤖 Agent Zero Integration**: Enhanced capabilities with Agent Zero runtime
- **Interactive TUI**: Beautiful terminal interface for monitoring and control
- **Flexible Configuration**: Customize ports, routes, timeouts, and more
- **Multiple Project Types**: Supports Node.js, Python, Rust, Go, and more

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

### Installation

```bash
npm install -g intertools
```

### Start InterTools Orchestrator (Big Gun Mode)

```bash
# Start the specialized agent team
intertools orchestrator --start

# Check status of all agents
intertools orchestrator --status

# View specialized agents
intertools orchestrator --agents

# Monitor log analysis results
intertools orchestrator --logs

# Check Cursor chat messages
intertools orchestrator --cursor-chat
```

This creates a `.iteragentrc.json` configuration file and `.cursor/inbox/` directory.

### Run the Iterative Loop

```bash
iteragent run
```

That's it! IterAgent will:
- Start your dev server
- Monitor logs and run tests
- Show you an interactive summary
- Let you send fix requests to Cursor with a single Enter press

## 📁 Project Structure

```
iteragent/
├─ packages/
│  └─ iteragent-cli/            # The CLI package
│     ├─ src/
│     │  ├─ index.ts            # CLI entry point
│     │  ├─ runner.ts           # Dev server management
│     │  ├─ harvester.ts        # Log capture & analysis
│     │  ├─ tester.ts           # Playwright testing
│     │  ├─ summarizer.ts       # Report generation
│     │  ├─ tui.ts              # Interactive interface
│     │  └─ utils.ts            # Utilities
│     ├─ package.json
│     └─ tsconfig.json
├─ examples/
│  └─ react-vite/               # Example React app
├─ .iteragentrc.json            # Project configuration
├─ .cursor/inbox/               # Cursor integration directory
├─ README.md
├─ LICENSE
└─ manifest.cursor.json         # Cursor Store manifest
```

## ⚙️ Configuration

The `.iteragentrc.json` file allows you to customize IterAgent's behavior:

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

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/alexhorton/iteragent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alexhorton/iteragent/discussions)
- **Documentation**: [Project Wiki](https://github.com/alexhorton/iteragent/wiki)

---

**Made with ❤️ for the Cursor community**
