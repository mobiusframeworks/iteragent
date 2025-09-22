#!/bin/bash

# IterAgent Installation Script
set -e

echo "🚀 Installing IterAgent..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ first.${NC}"
    echo -e "${YELLOW}   Visit: https://nodejs.org/${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version 16+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$SCRIPT_DIR/packages/iteragent-cli"

# Check if the CLI directory exists
if [ ! -d "$CLI_DIR" ]; then
    echo -e "${RED}❌ CLI package not found at $CLI_DIR${NC}"
    exit 1
fi

# Build the CLI package
echo -e "${BLUE}📦 Building IterAgent CLI...${NC}"
cd "$CLI_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📥 Installing dependencies...${NC}"
    npm install
fi

# Build the TypeScript
echo -e "${BLUE}🔨 Building TypeScript...${NC}"
npm run build

# Install globally
echo -e "${BLUE}🌍 Installing globally...${NC}"
if npm install -g . 2>/dev/null; then
    echo -e "${GREEN}✅ IterAgent installed successfully!${NC}"
elif sudo npm install -g . 2>/dev/null; then
    echo -e "${GREEN}✅ IterAgent installed successfully with sudo!${NC}"
else
    echo -e "${YELLOW}⚠️  Global installation failed. You can still use it locally.${NC}"
    echo -e "${BLUE}💡 To use locally, run:${NC}"
    echo -e "   cd $CLI_DIR && node dist/index.js --help"
    echo -e "${BLUE}💡 Or add to your PATH:${NC}"
    echo -e "   export PATH=\"\$PATH:$CLI_DIR/dist\""
    echo -e "   alias iteragent='node $CLI_DIR/dist/index.js'"
fi

echo ""
echo -e "${BLUE}🎯 Quick Start:${NC}"
echo -e "   1. cd your-project"
echo -e "   2. iteragent init"
echo -e "   3. iteragent run"
echo ""
echo -e "${BLUE}📚 Documentation: https://github.com/alexhorton/iteragent#readme${NC}"
echo -e "${BLUE}🐛 Issues: https://github.com/alexhorton/iteragent/issues${NC}"