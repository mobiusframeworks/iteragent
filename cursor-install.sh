#!/bin/bash

# IterAgent Cursor Store Installation Script
echo "🚀 Installing IterAgent from Cursor Store..."

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

# Install IterAgent CLI globally
echo -e "${BLUE}📦 Installing IterAgent CLI...${NC}"
if npm install -g iteragent-cli 2>/dev/null; then
    echo -e "${GREEN}✅ IterAgent installed successfully!${NC}"
elif sudo npm install -g iteragent-cli 2>/dev/null; then
    echo -e "${GREEN}✅ IterAgent installed successfully with sudo!${NC}"
else
    echo -e "${YELLOW}⚠️  Global installation failed. Trying local installation...${NC}"
    
    # Fallback: Clone and install locally
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    git clone https://github.com/luvs2spluj/iteragent.git
    cd iteragent/packages/iteragent-cli
    
    npm install
    npm run build
    
    # Create symlink in user's local bin
    mkdir -p ~/.local/bin
    ln -sf "$(pwd)/dist/index.js" ~/.local/bin/iteragent
    chmod +x ~/.local/bin/iteragent
    
    echo -e "${GREEN}✅ IterAgent installed locally!${NC}"
    echo -e "${BLUE}💡 Add to your PATH: export PATH=\"\$PATH:~/.local/bin\"${NC}"
    
    # Cleanup
    cd /
    rm -rf "$TEMP_DIR"
fi

echo ""
echo -e "${BLUE}🎯 Quick Start:${NC}"
echo -e "   1. cd your-project"
echo -e "   2. iteragent init"
echo -e "   3. iteragent run"
echo ""
echo -e "${BLUE}📚 Documentation: https://github.com/luvs2spluj/iteragent#readme${NC}"
echo -e "${BLUE}🐛 Issues: https://github.com/luvs2spluj/iteragent/issues${NC}"
echo ""
echo -e "${GREEN}🎉 IterAgent is ready to use in Cursor!${NC}"
