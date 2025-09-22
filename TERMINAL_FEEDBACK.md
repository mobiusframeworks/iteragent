# 🔍 IterAgent Terminal Feedback System

IterAgent's Terminal Feedback System provides intelligent analysis of console logs and real-time suggestions to the Cursor AI agent, enabling seamless integration between terminal output and code editing.

## 🚀 Features

### **Real-time Terminal Monitoring**
- **Live Log Analysis** - Monitors stdout/stderr in real-time
- **Pattern Recognition** - Detects errors, warnings, and performance issues
- **Intelligent Filtering** - Smart noise reduction and relevance scoring
- **Context Awareness** - Understands project type and development patterns

### **Smart Suggestion Generation**
- **Error Detection** - Identifies and categorizes errors by type and severity
- **Fix Suggestions** - Provides specific commands and code solutions
- **Performance Optimization** - Detects memory leaks, slow operations, bottlenecks
- **Dependency Management** - Identifies package conflicts and version issues
- **Security Alerts** - Detects vulnerabilities and security issues

### **Cursor Agent Integration**
- **Automatic Feedback** - Sends suggestions directly to Cursor's inbox
- **Code Injection** - Can inject code suggestions into your project
- **Command Execution** - Executes suggested commands automatically (optional)
- **Interactive Control** - Start/stop monitoring, modify suggestions

### **Suggestion Management**
- **Allowlist/Blocklist** - Control which suggestions to show or hide
- **Priority Filtering** - Filter by priority level (low, medium, high, critical)
- **Type Filtering** - Filter by suggestion type (command, fix, optimization, debug, info)
- **Confidence Scoring** - Only show high-confidence suggestions

## 🎯 How It Works

### **1. Terminal Monitoring**
```bash
# IterAgent monitors your dev server output
📡 Starting dev server...
🔍 Starting terminal feedback monitoring...
💡 Suggestion: Port Already in Use (fix, medium)
   Port 3000 is already occupied by another process
```

### **2. Pattern Analysis**
The system analyzes terminal output for:
- **Error Patterns**: `error`, `Error`, `ERROR`, `fatal`, `exception`
- **Warning Patterns**: `warning`, `Warning`, `WARNING`, `deprecated`
- **Performance Issues**: `slow`, `timeout`, `memory`, `heap`
- **Network Issues**: `connection`, `Connection`, `CONNECTION`
- **Database Issues**: `database`, `Database`, `DATABASE`

### **3. Suggestion Generation**
Based on detected patterns, generates suggestions like:
- **Command Fixes**: `npm install`, `lsof -ti:3000 | xargs kill -9`
- **Code Suggestions**: TypeScript/JavaScript code improvements
- **Configuration Changes**: Environment variable updates
- **Dependency Updates**: Package installation and updates

### **4. Cursor Integration**
Suggestions are automatically sent to `.cursor/inbox/` as markdown files:
```markdown
# IterAgent Terminal Feedback

## 🔴 🐛 Error Detected

**Priority:** HIGH  
**Confidence:** 90%  
**Type:** debug  
**Timestamp:** 2024-01-15T10:30:00.000Z

### Description
Detected error in stderr: Port 3000 is already in use

### Reasoning
Pattern "EADDRINUSE" matched in stderr output

### Suggested Action
```bash
lsof -ti:3000 | xargs kill -9
```

### Available Actions
- **Execute Command**: Run the suggested command
- **Add to Allowlist**: Always show this type of suggestion
- **Add to Blocklist**: Never show this type of suggestion
- **Modify Suggestion**: Customize the suggestion
- **Stop Monitoring**: Pause terminal feedback
```

## 🛠️ Commands

### **Terminal Feedback Management**
```bash
# Enable/disable terminal feedback
iteragent feedback --enable
iteragent feedback --disable
iteragent feedback --status

# View current suggestions
iteragent suggestions
iteragent suggestions --clear
iteragent suggestions --type error
```

### **Allowlist Management**
```bash
# Add items to allowlist (always show these suggestions)
iteragent allowlist add "error"
iteragent allowlist add "performance"
iteragent allowlist add "security"

# Remove items from allowlist
iteragent allowlist remove "error"
```

### **Blocklist Management**
```bash
# Add items to blocklist (never show these suggestions)
iteragent blocklist add "deprecated"
iteragent blocklist add "info"

# Remove items from blocklist
iteragent blocklist remove "deprecated"
```

### **Suggestion Execution**
```bash
# Execute a specific suggestion
iteragent execute suggestion_1234567890_abc123def
```

## ⚙️ Configuration

### **Terminal Feedback Config**
```json
{
  "terminalFeedback": {
    "enableSuggestions": true,
    "suggestionThreshold": 0.7,
    "autoExecute": false,
    "maxSuggestions": 10,
    "allowlistFile": ".iteragent/allowlist.json",
    "blocklistFile": ".iteragent/blocklist.json",
    "logAnalysisDepth": 100,
    "enableCodeExecution": true,
    "executionTimeout": 30000
  }
}
```

### **Cursor Agent Config**
```json
{
  "cursorAgent": {
    "inboxPath": ".cursor/inbox",
    "enableAutoExecution": false,
    "maxMessages": 50,
    "messageTimeout": 30000,
    "enableCodeInjection": true,
    "enableTerminalControl": true,
    "feedbackInterval": 10000
  }
}
```

## 🎮 Interactive Control

### **Real-time Commands**
While IterAgent is running, you can use these commands:

```bash
# Stop terminal feedback
iteragent stop

# Start terminal feedback
iteragent start

# Update configuration
iteragent config suggestionThreshold 0.8
iteragent config autoExecute true
iteragent config maxSuggestions 15
```

### **Suggestion Types**
- **`command`** - Terminal commands to execute
- **`fix`** - Code or configuration fixes
- **`optimization`** - Performance improvements
- **`debug`** - Debugging suggestions
- **`info`** - Informational messages

### **Priority Levels**
- **`low`** - Informational, non-critical
- **`medium`** - Should be addressed soon
- **`high`** - Important, should be fixed
- **`critical`** - Blocking issue, immediate attention required

## 🔧 Advanced Features

### **Custom Pattern Detection**
You can add custom patterns to detect specific issues:

```typescript
// Add custom pattern in terminal-feedback.ts
const customPatterns = [
  {
    pattern: /your-custom-pattern/i,
    suggestion: {
      type: 'fix',
      priority: 'medium',
      title: 'Custom Issue Detected',
      description: 'Your custom issue description',
      command: 'your-fix-command',
      reasoning: 'Custom pattern matched',
      confidence: 0.8
    }
  }
];
```

### **Project-Specific Analysis**
The system automatically adapts based on your project type:

- **Trading Bots**: Financial data validation, API monitoring
- **Mobile Apps**: Build errors, device compatibility issues
- **Web Apps**: Browser compatibility, performance issues
- **Node.js**: Memory leaks, async/await issues
- **React**: Component errors, hook issues
- **Vue**: Template errors, reactivity issues

### **Intelligent Filtering**
The system learns from your preferences:

- **Frequency Analysis**: Reduces repetitive suggestions
- **Context Awareness**: Considers project type and current task
- **User Feedback**: Learns from accepted/rejected suggestions
- **Time-based Filtering**: Reduces noise during specific time periods

## 📊 Monitoring Dashboard

### **Real-time Status**
```
🔍 Terminal Feedback Status: Active
📊 Suggestions Generated: 15
✅ Suggestions Executed: 8
🚫 Suggestions Blocked: 3
📝 Messages Sent to Cursor: 12
```

### **Performance Metrics**
- **Response Time**: Average time to generate suggestions
- **Accuracy Rate**: Percentage of useful suggestions
- **Execution Success**: Success rate of executed commands
- **User Satisfaction**: Based on allowlist/blocklist usage

## 🚨 Troubleshooting

### **Common Issues**

**Terminal feedback not working:**
```bash
# Check if monitoring is enabled
iteragent feedback --status

# Restart monitoring
iteragent stop
iteragent start
```

**Too many suggestions:**
```bash
# Increase threshold
iteragent config suggestionThreshold 0.8

# Block noisy suggestion types
iteragent blocklist add "info"
iteragent blocklist add "deprecated"
```

**Suggestions not reaching Cursor:**
```bash
# Check inbox directory
ls -la .cursor/inbox/

# Verify Cursor integration
iteragent config enableCodeInjection true
```

### **Debug Mode**
Enable debug mode for detailed logging:

```bash
# Set debug level
iteragent config debugLevel verbose

# View detailed logs
iteragent suggestions --debug
```

## 🎯 Best Practices

### **1. Configure Thresholds**
Start with a high threshold (0.8) and lower it as needed:
```bash
iteragent config suggestionThreshold 0.8
```

### **2. Use Allowlists**
Add frequently useful suggestion types to allowlist:
```bash
iteragent allowlist add "error"
iteragent allowlist add "performance"
iteragent allowlist add "security"
```

### **3. Block Noise**
Block suggestion types that are too noisy:
```bash
iteragent blocklist add "deprecated"
iteragent blocklist add "info"
```

### **4. Review Suggestions**
Regularly review and refine your allowlist/blocklist:
```bash
iteragent suggestions
iteragent allowlist remove "unused-type"
iteragent blocklist add "too-noisy-type"
```

### **5. Monitor Performance**
Keep an eye on suggestion quality and adjust accordingly:
```bash
iteragent feedback --status
iteragent suggestions --type error
```

## 🔮 Future Enhancements

- **Machine Learning**: Learn from user behavior to improve suggestions
- **Team Collaboration**: Share suggestion preferences across team members
- **Integration APIs**: Connect with other development tools
- **Custom Plugins**: Allow custom suggestion generators
- **Advanced Analytics**: Detailed performance and usage analytics

---

The Terminal Feedback System transforms your development workflow by providing intelligent, contextual suggestions directly to Cursor, making your coding experience more efficient and productive! 🚀
