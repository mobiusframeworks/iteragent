# 🔧 Cursor Persistent Setup Guide

This guide ensures IterAgent is available globally in Cursor and persists across new windows.

## 🚀 Quick Installation

### **Option 1: Automated Installation**
```bash
# Run the universal installation script
chmod +x cursor-universal-install.sh
./cursor-universal-install.sh
```

### **Option 2: Manual Installation**
```bash
# Install IterAgent globally
npm install -g iteragent-cli

# Create local bin directory
mkdir -p ~/.local/bin

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## 🔧 Cursor Configuration

### **1. Workspace Settings**
The `.cursor/settings.json` file ensures IterAgent is available in all Cursor terminals:

```json
{
  "terminal.integrated.env.osx": {
    "PATH": "${env:PATH}:$HOME/.local/bin"
  },
  "terminal.integrated.env.linux": {
    "PATH": "${env:PATH}:$HOME/.local/bin"
  },
  "terminal.integrated.env.windows": {
    "PATH": "${env:PATH};$HOME/.local/bin"
  },
  "iteragent.enabled": true,
  "iteragent.autoStart": true,
  "iteragent.globalInstall": true
}
```

### **2. Shell Profile Configuration**
Add to your `~/.zshrc` (or `~/.bashrc`):

```bash
# IterAgent Configuration
export PATH="$HOME/.local/bin:$PATH"
alias iteragent='$HOME/.local/bin/iteragent'
export ITERAGENT_GLOBAL_INSTALL=true
export ITERAGENT_CURSOR_INTEGRATION=true
export ITERAGENT_PERSISTENT=true
```

### **3. Cursor Extension Manifest**
Create `.cursor/extensions/iteragent/package.json`:

```json
{
  "name": "iteragent",
  "displayName": "IterAgent",
  "description": "Iterative testing agent for Cursor IDE",
  "version": "1.0.3",
  "activationEvents": [
    "onCommand:iteragent.start",
    "onCommand:iteragent.stop",
    "onCommand:iteragent.status"
  ],
  "contributes": {
    "commands": [
      {
        "command": "iteragent.start",
        "title": "Start IterAgent",
        "category": "IterAgent"
      },
      {
        "command": "iteragent.stop",
        "title": "Stop IterAgent",
        "category": "IterAgent"
      },
      {
        "command": "iteragent.status",
        "title": "IterAgent Status",
        "category": "IterAgent"
      }
    ]
  }
}
```

## 🎯 Verification Steps

### **1. Check Global Installation**
```bash
# Verify IterAgent is available globally
iteragent --version

# Check PATH includes local bin
echo $PATH | grep -o "$HOME/.local/bin"
```

### **2. Test in Cursor**
1. Open Cursor
2. Open terminal (Ctrl+` or Cmd+`)
3. Run: `iteragent --version`
4. Should show: `1.0.3`

### **3. Test Persistence**
1. Close Cursor
2. Open new Cursor window
3. Open terminal
4. Run: `iteragent --version`
5. Should still work

## 🔄 Troubleshooting

### **Issue: Command not found**
```bash
# Check if IterAgent is installed
which iteragent

# If not found, try:
npm list -g iteragent-cli

# Reinstall if needed:
npm install -g iteragent-cli
```

### **Issue: PATH not updated**
```bash
# Reload shell profile
source ~/.zshrc

# Or restart terminal
# Check PATH
echo $PATH
```

### **Issue: Cursor not picking up changes**
1. Restart Cursor completely
2. Check workspace settings
3. Verify `.cursor/settings.json` exists

## 🎮 Usage in Cursor

### **Basic Usage**
```bash
# In any Cursor terminal
iteragent init
iteragent run
```

### **Terminal Feedback**
```bash
# Enable terminal feedback
iteragent feedback --enable

# Manage suggestions
iteragent allowlist add "error"
iteragent suggestions
```

### **Project-Specific**
```bash
# Trading bot projects
iteragent init-trading

# Mobile projects
iteragent init-mobile --platform react-native
```

## 🔧 Advanced Configuration

### **Auto-start IterAgent**
Add to your shell profile:
```bash
# Auto-start IterAgent in new terminals
if command -v iteragent &> /dev/null; then
    echo "🚀 IterAgent is available globally"
fi
```

### **Custom Aliases**
Add to your shell profile:
```bash
# IterAgent aliases
alias ia="iteragent"
alias iar="iteragent run"
alias iai="iteragent init"
alias ias="iteragent suggestions"
```

### **Environment Variables**
```bash
# Set IterAgent environment
export ITERAGENT_GLOBAL_INSTALL=true
export ITERAGENT_CURSOR_INTEGRATION=true
export ITERAGENT_PERSISTENT=true
export ITERAGENT_AUTO_START=true
```

## 🎯 Success Criteria

✅ **Global Availability**: `iteragent --version` works in any terminal  
✅ **Cursor Integration**: Works in Cursor terminals  
✅ **Persistence**: Available in new Cursor windows  
✅ **Configuration**: Settings persist across sessions  
✅ **Commands**: All IterAgent commands work  

## 🚀 Next Steps

1. **Test Installation**: Verify all commands work
2. **Configure Preferences**: Set up allowlist/blocklist
3. **Start Using**: Run `iteragent run` in your projects
4. **Share**: Help others install IterAgent

---

**IterAgent is now permanently available in your Cursor environment! 🎉**
