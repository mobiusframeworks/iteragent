# Installation & Distribution Guide

## 🚀 For You (Local Installation)

### Quick Install
```bash
# Clone the repository
git clone https://github.com/alexhorton/iteragent.git
cd iteragent

# Run the installation script
./install.sh
```

### Manual Install
```bash
# Build the CLI
cd packages/iteragent-cli
npm install
npm run build

# Install globally (may require sudo)
npm install -g .

# Or use locally
alias iteragent='node /path/to/iteragent/packages/iteragent-cli/dist/index.js'
```

### Test Installation
```bash
# Test with the example app
cd examples/react-vite
npm install
iteragent init
iteragent run
```

## 🌍 For Others (Distribution)

### Option 1: GitHub Repository Distribution

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial IterAgent release"
   git branch -M main
   git remote add origin https://github.com/alexhorton/iteragent.git
   git push -u origin main
   ```

2. **Users install via**:
   ```bash
   git clone https://github.com/alexhorton/iteragent.git
   cd iteragent
   ./install.sh
   ```

### Option 2: NPM Package Distribution

1. **Prepare for NPM publishing**:
   ```bash
   cd packages/iteragent-cli
   
   # Update package.json with proper fields
   npm version patch  # or minor/major
   ```

2. **Publish to NPM**:
   ```bash
   npm publish
   ```

3. **Users install via**:
   ```bash
   npm install -g iteragent-cli
   ```

### Option 3: Cursor Store Distribution

1. **Prepare manifest** (already created: `manifest.cursor.json`)

2. **Submit to Cursor Store**:
   - Follow Cursor's submission process
   - Include the manifest file
   - Provide screenshots and documentation

## 📦 Distribution Methods Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **GitHub** | Free, open source, version control | Manual installation | Developers, contributors |
| **NPM** | Easy installation, version management | Requires NPM account | General users |
| **Cursor Store** | Integrated with Cursor | Approval process | Cursor users |

## 🔧 Installation Script Features

The `install.sh` script:
- ✅ Checks Node.js version (16+)
- ✅ Checks npm installation
- ✅ Builds TypeScript automatically
- ✅ Handles permission issues gracefully
- ✅ Provides fallback local usage instructions
- ✅ Colorized output for better UX

## 📋 Pre-Installation Requirements

Users need:
- **Node.js 16+** (https://nodejs.org/)
- **npm 8+** (comes with Node.js)
- **Git** (for GitHub distribution)

## 🎯 Quick Start for Users

After installation, users can:

```bash
# Initialize in their project
cd their-project
iteragent init

# Start the iterative loop
iteragent run
```

## 🐛 Troubleshooting

### Permission Issues
```bash
# Use sudo for global installation
sudo npm install -g iteragent-cli

# Or use local installation
alias iteragent='node /path/to/iteragent/dist/index.js'
```

### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Install Node.js 16+ from https://nodejs.org/
```

### Build Issues
```bash
# Clean and rebuild
cd packages/iteragent-cli
rm -rf node_modules dist
npm install
npm run build
```

## 📚 Documentation for Users

The README.md includes:
- ✅ Complete installation instructions
- ✅ Usage examples
- ✅ Configuration options
- ✅ Troubleshooting guide
- ✅ Feature overview

## 🔄 Update Process

For updates:
1. **GitHub**: Users run `git pull && ./install.sh`
2. **NPM**: Users run `npm update -g iteragent-cli`
3. **Cursor Store**: Automatic updates via store

## 📈 Metrics & Feedback

Track adoption via:
- GitHub stars/forks
- NPM download counts
- Cursor Store installs
- GitHub issues/discussions
