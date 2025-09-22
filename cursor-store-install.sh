#!/bin/bash

# 🚀 InterTools Cursor Store Installation Script
# This script installs InterTools and sets up Cursor integration

set -e

echo "🚀 Installing InterTools from Cursor Store..."
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

# Install InterTools globally
echo "📦 Installing InterTools globally..."
npm install -g intertools@latest

if [ $? -eq 0 ]; then
    echo "✅ InterTools installed successfully!"
else
    echo "❌ Failed to install InterTools globally"
    echo "💡 Try running: sudo npm install -g intertools@latest"
    exit 1
fi

echo ""

# Setup Cursor integration
echo "🔧 Setting up Cursor AI integration..."
npx intertools@latest setup-cursor --all

if [ $? -eq 0 ]; then
    echo "✅ Cursor integration setup complete!"
else
    echo "⚠️  Cursor integration setup failed, but InterTools is installed"
    echo "💡 You can run: npx intertools@latest setup-cursor --all"
fi

echo ""

# Show next steps
echo "🎉 InterTools installation complete!"
echo ""
echo "🚀 Quick Start Commands:"
echo "  Start Multi-Agent System:"
echo "    npx intertools@latest orchestrator --start"
echo ""
echo "  Enable Agent Zero Integration:"
echo "    npx intertools@latest seamless --start"
echo ""
echo "  Check Status:"
echo "    npx intertools@latest orchestrator --status"
echo ""
echo "  View Specialized Agents:"
echo "    npx intertools@latest orchestrator --agents"
echo ""
echo "  Stop Everything:"
echo "    npx intertools@latest orchestrator --stop"
echo ""
echo "📚 Documentation: https://github.com/luvs2spluj/intertools"
echo "🐛 Issues: https://github.com/luvs2spluj/intertools/issues"
echo ""
echo "🎯 InterTools is now ready to speed up your Cursor IDE workflows!"
