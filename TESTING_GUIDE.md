# 🧪 IterAgent Testing Guide

This guide will help you test all the new terminal feedback features in IterAgent.

## 🚀 Quick Test Setup

### 1. Install IterAgent
```bash
# Install globally from NPM
npm install -g iteragent-cli

# Or test locally (if you have the source)
cd packages/iteragent-cli
npm run build
node dist/index.js --help
```

### 2. Create a Test Project
```bash
# Create a simple test project
mkdir iteragent-test
cd iteragent-test

# Initialize a basic Node.js project
npm init -y
npm install express

# Create a simple server with intentional errors
cat > server.js << 'EOF'
const express = require('express');
const app = express();
const port = 3000;

// Intentional error - will cause port conflict
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Simulate some errors for testing
setTimeout(() => {
  console.log('Warning: This is a test warning');
}, 2000);

setTimeout(() => {
  console.log('Error: This is a test error');
}, 4000);

setTimeout(() => {
  console.log('Performance: Slow operation detected');
}, 6000);
EOF

# Create package.json script
npm pkg set scripts.dev="node server.js"
```

## 🔍 Testing Terminal Feedback Features

### 1. Initialize IterAgent
```bash
# Initialize with terminal feedback
iteragent init

# Check the generated config
cat .iteragentrc.json
```

### 2. Test Basic Commands
```bash
# Test help commands
iteragent --help
iteragent feedback --help
iteragent suggestions --help
iteragent allowlist --help
iteragent blocklist --help

# Test feedback status
iteragent feedback --status
```

### 3. Test Suggestion Management
```bash
# Add items to allowlist
iteragent allowlist add "error"
iteragent allowlist add "performance"
iteragent allowlist add "warning"

# Add items to blocklist
iteragent blocklist add "deprecated"
iteragent blocklist add "info"

# View suggestions
iteragent suggestions
iteragent suggestions --type error
iteragent suggestions --type performance
```

### 4. Test the Full Loop
```bash
# Start the iterative loop (this will demonstrate terminal feedback)
iteragent run

# In another terminal, you can test the server
node server.js
```

## 🎯 Expected Terminal Feedback Behavior

When you run `iteragent run`, you should see:

### 1. Initialization
```
🚀 Starting IterAgent...
🔍 Starting terminal feedback monitoring...
📡 Starting dev server...
🔍 Starting terminal feedback monitoring...
```

### 2. Error Detection
```
💡 Suggestion: Port Already in Use (fix, medium)
   Port 3000 is already occupied by another process

💡 Suggestion: Error Detected (debug, high)
   Detected error in stderr: This is a test error

💡 Suggestion: Performance Optimization (optimization, medium)
   Slow operations detected - consider optimization
```

### 3. Cursor Integration
```
📤 Sent 3 messages to Cursor
📝 Written message to iteragent_msg_1234567890_abc123def.md
```

### 4. Interactive TUI
The TUI should show:
- Real-time server status
- Current suggestions
- Interactive controls
- Log streaming

## 🧪 Advanced Testing Scenarios

### 1. Trading Bot Testing
```bash
# Create a trading bot test project
mkdir trading-test
cd trading-test

# Initialize trading bot configuration
iteragent init-trading

# Check specialized config
cat .iteragentrc.json
```

### 2. Mobile Development Testing
```bash
# Create a mobile test project
mkdir mobile-test
cd mobile-test

# Initialize mobile configuration
iteragent init-mobile --platform react-native

# Check mobile-specific config
cat .iteragentrc.json
```

### 3. Error Simulation Testing
```bash
# Create a project with various errors
mkdir error-test
cd error-test

# Create files with intentional errors
cat > error-server.js << 'EOF'
const express = require('express');
const app = express();

// Simulate different types of errors
app.get('/memory-leak', (req, res) => {
  console.log('Warning: Memory usage high');
  res.json({ message: 'Memory leak simulation' });
});

app.get('/network-error', (req, res) => {
  console.log('Error: Network connection failed');
  res.status(500).json({ error: 'Network error' });
});

app.get('/performance', (req, res) => {
  console.log('Performance: Slow database query detected');
  res.json({ message: 'Performance issue' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
EOF

# Initialize and test
iteragent init
iteragent run
```

## 🔧 Configuration Testing

### 1. Test Configuration Updates
```bash
# Update suggestion threshold
iteragent config suggestionThreshold 0.8

# Enable auto-execution
iteragent config autoExecute true

# Update max suggestions
iteragent config maxSuggestions 15
```

### 2. Test Filter Management
```bash
# Clear all suggestions
iteragent suggestions --clear

# Add multiple items to allowlist
iteragent allowlist add "error"
iteragent allowlist add "performance"
iteragent allowlist add "security"

# Add multiple items to blocklist
iteragent blocklist add "deprecated"
iteragent blocklist add "info"
iteragent blocklist add "verbose"
```

## 📊 Expected Results

### 1. Terminal Feedback Output
You should see real-time analysis like:
```
🔍 Starting terminal feedback monitoring...
💡 Suggestion: Error Detected (debug, high)
   Detected error in stderr: Error: Network connection failed
   Confidence: 90%
   Command: echo "Network issue detected - checking connectivity"

💡 Suggestion: Performance Optimization (optimization, medium)
   Slow operations detected - consider optimization
   Confidence: 70%
   Command: echo "Consider profiling and optimizing slow operations"
```

### 2. Cursor Inbox Files
Check `.cursor/inbox/` directory for generated files:
```bash
ls -la .cursor/inbox/
cat .cursor/inbox/iteragent_msg_*.md
```

### 3. Configuration Files
Check generated configuration files:
```bash
cat .iteragentrc.json
cat .iteragent/allowlist.json
cat .iteragent/blocklist.json
```

## 🐛 Troubleshooting

### Common Issues

**1. Permission Errors**
```bash
# If you get permission errors, try:
sudo npm install -g iteragent-cli

# Or use npx instead:
npx iteragent-cli --help
```

**2. Port Conflicts**
```bash
# Kill existing processes on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
iteragent run --port 3001
```

**3. Missing Dependencies**
```bash
# Install Playwright browsers
npx playwright install

# Install project dependencies
npm install
```

**4. Terminal Feedback Not Working**
```bash
# Check if monitoring is enabled
iteragent feedback --status

# Enable monitoring
iteragent feedback --enable

# Check suggestions
iteragent suggestions
```

## 🎯 Success Criteria

Your testing is successful if you see:

✅ **CLI Commands Work**
- All help commands display correctly
- Commands execute without errors
- Configuration files are created

✅ **Terminal Feedback Works**
- Real-time log monitoring
- Intelligent suggestion generation
- Pattern recognition and categorization

✅ **Cursor Integration Works**
- Messages sent to `.cursor/inbox/`
- Proper markdown formatting
- Action suggestions included

✅ **Suggestion Management Works**
- Allowlist/blocklist functionality
- Suggestion filtering and clearing
- Configuration updates

✅ **Project Detection Works**
- Trading bot detection
- Mobile project detection
- Appropriate configurations generated

## 🚀 Next Steps After Testing

1. **Verify All Features** - Ensure everything works as expected
2. **Document Issues** - Note any bugs or improvements needed
3. **Submit to Cursor Store** - Follow `CURSOR_STORE_SUBMISSION.md`
4. **Share Results** - Let the community know about the new features

---

**Happy Testing!** 🧪✨

The terminal feedback system should provide intelligent, real-time suggestions that enhance your development workflow with Cursor IDE.
