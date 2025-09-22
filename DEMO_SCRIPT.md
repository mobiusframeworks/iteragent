# 🎬 IterAgent Demo Script

This script demonstrates all the new terminal feedback features in IterAgent.

## 🎯 Demo Overview

**Duration**: 10-15 minutes  
**Audience**: Developers using Cursor IDE  
**Goal**: Show how IterAgent transforms development workflow with intelligent terminal feedback

## 🚀 Demo Setup

### 1. Prerequisites
```bash
# Ensure IterAgent is installed
npm install -g iteragent-cli

# Verify installation
iteragent --version
iteragent --help
```

### 2. Create Demo Project
```bash
# Create demo project
mkdir iteragent-demo
cd iteragent-demo

# Initialize Node.js project
npm init -y
npm install express

# Create demo server with intentional issues
cat > server.js << 'EOF'
const express = require('express');
const app = express();
const port = 3000;

// Simulate various development scenarios
app.get('/', (req, res) => {
  console.log('Info: Home page accessed');
  res.json({ message: 'Hello from IterAgent Demo!' });
});

app.get('/error', (req, res) => {
  console.log('Error: This is a simulated error');
  res.status(500).json({ error: 'Simulated error' });
});

app.get('/warning', (req, res) => {
  console.log('Warning: This is a simulated warning');
  res.json({ message: 'Warning endpoint' });
});

app.get('/performance', (req, res) => {
  console.log('Performance: Slow operation detected');
  setTimeout(() => {
    res.json({ message: 'Slow response' });
  }, 2000);
});

app.get('/memory', (req, res) => {
  console.log('Memory: High memory usage detected');
  res.json({ message: 'Memory endpoint' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Simulate periodic issues
setInterval(() => {
  console.log('Info: Periodic log message');
}, 5000);

setTimeout(() => {
  console.log('Error: Database connection failed');
}, 3000);

setTimeout(() => {
  console.log('Warning: Deprecated API endpoint used');
}, 6000);
EOF

# Add npm script
npm pkg set scripts.dev="node server.js"
```

## 🎬 Demo Script

### **Scene 1: Introduction (2 minutes)**

**Narrator**: "Today I'll show you IterAgent, an intelligent testing agent that transforms your development workflow in Cursor IDE."

**Show**: 
- Open Cursor IDE
- Navigate to demo project
- Open terminal

**Commands**:
```bash
# Show current project
ls -la
cat package.json

# Show IterAgent help
iteragent --help
```

**Key Points**:
- IterAgent is a CLI tool that integrates with Cursor
- It provides intelligent terminal feedback
- It supports multiple project types

### **Scene 2: Basic Setup (2 minutes)**

**Narrator**: "Let's initialize IterAgent in our project and see what it creates."

**Commands**:
```bash
# Initialize IterAgent
iteragent init

# Show generated files
ls -la
cat .iteragentrc.json
ls -la .cursor/inbox/
```

**Key Points**:
- Creates configuration file
- Sets up Cursor inbox directory
- Zero configuration needed

### **Scene 3: Terminal Feedback Commands (3 minutes)**

**Narrator**: "IterAgent provides powerful commands to manage terminal feedback and suggestions."

**Commands**:
```bash
# Show feedback commands
iteragent feedback --help
iteragent suggestions --help
iteragent allowlist --help
iteragent blocklist --help

# Test feedback status
iteragent feedback --status

# Add items to allowlist
iteragent allowlist add "error"
iteragent allowlist add "performance"
iteragent allowlist add "warning"

# Add items to blocklist
iteragent blocklist add "deprecated"
iteragent blocklist add "info"

# View current suggestions
iteragent suggestions
```

**Key Points**:
- Smart suggestion management
- Allowlist/blocklist filtering
- Real-time suggestion viewing

### **Scene 4: Live Terminal Feedback (4 minutes)**

**Narrator**: "Now let's see IterAgent in action with real-time terminal feedback."

**Commands**:
```bash
# Start IterAgent (this will show terminal feedback)
iteragent run
```

**In another terminal**:
```bash
# Start the demo server
npm run dev
```

**Expected Output**:
```
🚀 Starting IterAgent...
🔍 Starting terminal feedback monitoring...
📡 Starting dev server...
🔍 Starting terminal feedback monitoring...
📝 Capturing logs...
💡 Suggestion: Error Detected (debug, high)
   Detected error in stderr: Database connection failed
   Confidence: 90%
   Command: echo "Database issue detected - checking connection"

💡 Suggestion: Performance Optimization (optimization, medium)
   Slow operations detected - consider optimization
   Confidence: 70%
   Command: echo "Consider profiling and optimizing slow operations"

💡 Suggestion: Warning Detected (debug, medium)
   Detected warning in stderr: Deprecated API endpoint used
   Confidence: 80%
   Command: echo "Warning detected - may need attention"
```

**Key Points**:
- Real-time log analysis
- Intelligent pattern recognition
- Automatic suggestion generation
- Confidence scoring

### **Scene 5: Cursor Integration (2 minutes)**

**Narrator**: "IterAgent automatically sends suggestions to Cursor's AI through the inbox system."

**Commands**:
```bash
# Check Cursor inbox
ls -la .cursor/inbox/
cat .cursor/inbox/iteragent_msg_*.md
```

**Show**: Open one of the generated markdown files in Cursor

**Key Points**:
- Automatic Cursor integration
- Ready-to-use prompts
- Structured feedback format

### **Scene 6: Advanced Features (2 minutes)**

**Narrator**: "IterAgent supports specialized project types with tailored features."

**Commands**:
```bash
# Show specialized commands
iteragent init-trading --help
iteragent init-mobile --help

# Demonstrate configuration
iteragent config suggestionThreshold 0.8
iteragent config autoExecute true
iteragent config maxSuggestions 15
```

**Key Points**:
- Trading bot support
- Mobile development features
- Configurable thresholds

## 🎯 Demo Highlights

### **What Makes IterAgent Special**

1. **Real-time Intelligence**: Analyzes console logs as they happen
2. **Smart Filtering**: Only shows relevant, high-confidence suggestions
3. **Cursor Integration**: Seamlessly feeds suggestions to Cursor's AI
4. **Project Awareness**: Adapts to different project types
5. **Interactive Control**: Full control over suggestion management

### **Key Benefits**

- **Faster Debugging**: Immediate error detection and suggestions
- **Better Code Quality**: Performance and security recommendations
- **Reduced Context Switching**: Everything happens in Cursor
- **Intelligent Automation**: Learns from your preferences
- **Zero Configuration**: Works out of the box

## 🚀 Call to Action

### **For Developers**
```bash
# Install IterAgent
npm install -g iteragent-cli

# Try it in your project
cd your-project
iteragent init
iteragent run
```

### **For Teams**
- Set up allowlist/blocklist for team preferences
- Configure suggestion thresholds
- Share configuration files
- Integrate with CI/CD pipelines

## 📊 Demo Success Metrics

**Successful Demo Indicators**:
- ✅ Commands execute without errors
- ✅ Terminal feedback appears in real-time
- ✅ Suggestions are relevant and helpful
- ✅ Cursor inbox files are generated
- ✅ Configuration management works
- ✅ Audience understands the value proposition

## 🎬 Demo Tips

### **Preparation**
- Test all commands beforehand
- Have backup terminal windows ready
- Prepare example projects
- Know the expected outputs

### **Presentation**
- Explain each command before running
- Highlight the intelligent aspects
- Show the real-time nature
- Emphasize Cursor integration

### **Troubleshooting**
- If commands fail, explain the fallback
- If suggestions don't appear, show configuration
- If Cursor integration doesn't work, show manual process
- Always have a backup plan

## 🎉 Demo Conclusion

**Narrator**: "IterAgent transforms your development workflow by providing intelligent terminal feedback that integrates seamlessly with Cursor IDE. It's like having an AI pair programmer that watches your console logs and provides smart suggestions in real-time."

**Final Commands**:
```bash
# Show final status
iteragent feedback --status
iteragent suggestions

# Show installation options
echo "Install: npm install -g iteragent-cli"
echo "GitHub: https://github.com/luvs2spluj/iteragent"
echo "NPM: https://www.npmjs.com/package/iteragent-cli"
```

---

**Ready to revolutionize your development workflow with IterAgent! 🚀**
