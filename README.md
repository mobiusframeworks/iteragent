# IterAgent 🚀

**Iterative testing agent for Cursor IDE** - Automatically runs your app, captures logs, runs tests, and feeds insights back to Cursor for seamless development.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue)](https://www.typescriptlang.org/)

## ✨ What is IterAgent?

IterAgent creates a seamless development loop inside Cursor IDE:

1. **🚀 Starts your dev server** (npm run dev, etc.)
2. **📝 Captures and analyzes logs** in real-time
3. **🧪 Runs Playwright smoke tests** against your app
4. **📊 Generates intelligent summaries** of issues and recommendations
5. **🎮 Provides interactive TUI** to send fix requests to Cursor
6. **🔄 Continues the loop** for iterative development

## 🎯 Key Features

- **Zero Configuration**: Works out of the box with most projects
- **Smart Log Analysis**: De-noises logs, classifies errors, extracts metadata
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
- **Custom**: Any project with a start command

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
