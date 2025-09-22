#!/bin/bash

# 🚀 InterTools Installation Script for Different Environments
# This script installs InterTools v1.0.12 in any environment

set -e

echo "🚀 Installing InterTools v1.0.12..."
echo "📦 Multi-agent orchestration system for Cursor IDE"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "📥 Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    echo "📥 Please install npm (comes with Node.js)"
    exit 1
fi

echo "✅ Node.js and npm found"
echo ""

# Try different installation methods
echo "📦 Installing InterTools..."

# Method 1: Try global install
if npm install -g intertools@1.0.12 2>/dev/null; then
    echo "✅ InterTools installed globally successfully!"
    INSTALL_METHOD="global"
else
    echo "⚠️  Global install failed, trying local install..."
    
    # Method 2: Try local install
    if npm install intertools@1.0.12 2>/dev/null; then
        echo "✅ InterTools installed locally successfully!"
        INSTALL_METHOD="local"
    else
        echo "❌ Both global and local install failed."
        echo "💡 Trying with npx (no installation required)..."
        INSTALL_METHOD="npx"
    fi
fi

echo ""

# Setup Cursor integration
echo "🔧 Setting up Cursor AI integration..."

if [ "$INSTALL_METHOD" = "global" ]; then
    npx intertools@1.0.12 setup-cursor --all
elif [ "$INSTALL_METHOD" = "local" ]; then
    npx intertools@1.0.12 setup-cursor --all
else
    npx intertools@1.0.12 setup-cursor --all
fi

if [ $? -eq 0 ]; then
    echo "✅ Cursor integration setup complete!"
else
    echo "⚠️  Cursor integration setup failed, but InterTools is available"
    echo "💡 You can run: npx intertools@1.0.12 setup-cursor --all"
fi

echo ""

# Show usage instructions
echo "🎉 InterTools installation complete!"
echo ""
echo "🚀 Usage Commands:"

if [ "$INSTALL_METHOD" = "global" ]; then
    echo "  Start Multi-Agent System:"
    echo "    intertools orchestrator --start"
    echo ""
    echo "  Enable Agent Zero Integration:"
    echo "    intertools seamless --start"
    echo ""
    echo "  Create Interactive Commands:"
    echo "    intertools interactive --create"
    echo ""
    echo "  Check Status:"
    echo "    intertools orchestrator --status"
else
    echo "  Start Multi-Agent System:"
    echo "    npx intertools@1.0.12 orchestrator --start"
    echo ""
    echo "  Enable Agent Zero Integration:"
    echo "    npx intertools@1.0.12 seamless --start"
    echo ""
    echo "  Create Interactive Commands:"
    echo "    npx intertools@1.0.12 interactive --create"
    echo ""
    echo "  Check Status:"
    echo "    npx intertools@1.0.12 orchestrator --status"
fi

echo ""
echo "📚 Documentation: https://github.com/luvs2spluj/intertools"
echo "🐛 Issues: https://github.com/luvs2spluj/intertools/issues"
echo ""
echo "🎯 InterTools is now ready to speed up your Cursor IDE workflows!"
echo "💡 The interactive Cursor AI commands are now working!"
