#!/bin/bash

# IterAgent Test Script
echo "🧪 Testing IterAgent Installation..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Check if CLI builds
echo -e "${BLUE}Test 1: Building CLI...${NC}"
cd packages/iteragent-cli
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CLI builds successfully${NC}"
else
    echo -e "${RED}❌ CLI build failed${NC}"
    exit 1
fi

# Test 2: Check if CLI runs
echo -e "${BLUE}Test 2: CLI help command...${NC}"
if node dist/index.js --help > /dev/null 2>&1; then
    echo -e "${GREEN}✅ CLI runs successfully${NC}"
else
    echo -e "${RED}❌ CLI execution failed${NC}"
    exit 1
fi

# Test 3: Check example app setup
echo -e "${BLUE}Test 3: Example app setup...${NC}"
cd ../../examples/react-vite
if npm install > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Example app dependencies installed${NC}"
else
    echo -e "${RED}❌ Example app setup failed${NC}"
    exit 1
fi

# Test 4: Check IterAgent init
echo -e "${BLUE}Test 4: IterAgent initialization...${NC}"
if node ../../packages/iteragent-cli/dist/index.js init > /dev/null 2>&1; then
    echo -e "${GREEN}✅ IterAgent init works${NC}"
else
    echo -e "${RED}❌ IterAgent init failed${NC}"
    exit 1
fi

# Test 5: Check config file creation
echo -e "${BLUE}Test 5: Configuration file...${NC}"
if [ -f ".iteragentrc.json" ]; then
    echo -e "${GREEN}✅ Configuration file created${NC}"
else
    echo -e "${RED}❌ Configuration file missing${NC}"
    exit 1
fi

# Test 6: Check cursor inbox creation
echo -e "${BLUE}Test 6: Cursor inbox directory...${NC}"
if [ -d ".cursor/inbox" ]; then
    echo -e "${GREEN}✅ Cursor inbox directory created${NC}"
else
    echo -e "${RED}❌ Cursor inbox directory missing${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed! IterAgent is ready to use.${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. cd examples/react-vite"
echo "2. iteragent run"
echo "3. Or use: node ../../packages/iteragent-cli/dist/index.js run"
