#!/bin/bash

# IterAgent Cursor Installation Verification Script
# This script verifies that IterAgent is properly installed and persistent in Cursor

set -e

echo "🔍 Verifying IterAgent Cursor installation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Check if IterAgent command is available
print_status "Test 1: Checking IterAgent command availability..."
if command -v iteragent &> /dev/null; then
    VERSION=$(iteragent --version)
    print_success "IterAgent command is available globally (version: $VERSION)"
else
    print_error "IterAgent command not found in PATH"
    exit 1
fi

# Test 2: Check IterAgent help commands
print_status "Test 2: Checking IterAgent help commands..."
if iteragent --help &> /dev/null; then
    print_success "IterAgent help command works"
else
    print_error "IterAgent help command failed"
    exit 1
fi

# Test 3: Check terminal feedback commands
print_status "Test 3: Checking terminal feedback commands..."
if iteragent feedback --help &> /dev/null; then
    print_success "Terminal feedback commands work"
else
    print_error "Terminal feedback commands failed"
    exit 1
fi

# Test 4: Check suggestion management commands
print_status "Test 4: Checking suggestion management commands..."
if iteragent suggestions --help &> /dev/null; then
    print_success "Suggestion management commands work"
else
    print_error "Suggestion management commands failed"
    exit 1
fi

# Test 5: Check allowlist/blocklist commands
print_status "Test 5: Checking allowlist/blocklist commands..."
if iteragent allowlist --help &> /dev/null && iteragent blocklist --help &> /dev/null; then
    print_success "Allowlist/blocklist commands work"
else
    print_error "Allowlist/blocklist commands failed"
    exit 1
fi

# Test 6: Check PATH configuration
print_status "Test 6: Checking PATH configuration..."
if echo "$PATH" | grep -q "$HOME/.local/bin"; then
    print_success "PATH includes $HOME/.local/bin"
else
    print_warning "PATH does not include $HOME/.local/bin"
fi

# Test 7: Check Cursor configuration files
print_status "Test 7: Checking Cursor configuration files..."
if [ -f "$HOME/.cursor/iteragent-config.json" ]; then
    print_success "Cursor configuration file exists"
else
    print_warning "Cursor configuration file not found"
fi

if [ -f ".cursor/settings.json" ]; then
    print_success "Cursor workspace settings exist"
else
    print_warning "Cursor workspace settings not found"
fi

# Test 8: Check shell profile configuration
print_status "Test 8: Checking shell profile configuration..."
if grep -q "iteragent" "$HOME/.zshrc" 2>/dev/null; then
    print_success "Shell profile includes IterAgent configuration"
else
    print_warning "Shell profile does not include IterAgent configuration"
fi

# Test 9: Test project initialization
print_status "Test 9: Testing project initialization..."
TEST_DIR="/tmp/iteragent-test-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

if iteragent init &> /dev/null; then
    print_success "Project initialization works"
    
    # Check if configuration files were created
    if [ -f ".iteragentrc.json" ] && [ -d ".cursor/inbox" ]; then
        print_success "Configuration files created correctly"
    else
        print_warning "Configuration files not created correctly"
    fi
else
    print_error "Project initialization failed"
fi

# Cleanup test directory
cd /Users/alexhorton/iteragent
rm -rf "$TEST_DIR"

# Test 10: Check environment variables
print_status "Test 10: Checking environment variables..."
if [ "$ITERAGENT_GLOBAL_INSTALL" = "true" ]; then
    print_success "ITERAGENT_GLOBAL_INSTALL is set"
else
    print_warning "ITERAGENT_GLOBAL_INSTALL not set"
fi

if [ "$ITERAGENT_CURSOR_INTEGRATION" = "true" ]; then
    print_success "ITERAGENT_CURSOR_INTEGRATION is set"
else
    print_warning "ITERAGENT_CURSOR_INTEGRATION not set"
fi

# Test 11: Check specialized commands
print_status "Test 11: Checking specialized commands..."
if iteragent init-trading --help &> /dev/null; then
    print_success "Trading bot initialization command works"
else
    print_warning "Trading bot initialization command not available"
fi

if iteragent init-mobile --help &> /dev/null; then
    print_success "Mobile development initialization command works"
else
    print_warning "Mobile development initialization command not available"
fi

# Test 12: Check feedback status
print_status "Test 12: Checking feedback status..."
if iteragent feedback --status &> /dev/null; then
    print_success "Feedback status command works"
else
    print_warning "Feedback status command failed"
fi

# Final verification summary
echo ""
print_status "🎯 Installation Verification Summary:"
echo ""

# Count successful tests
SUCCESS_COUNT=0
TOTAL_TESTS=12

# Check each test result (simplified)
if command -v iteragent &> /dev/null; then
    ((SUCCESS_COUNT++))
fi

if [ -f "$HOME/.cursor/iteragent-config.json" ]; then
    ((SUCCESS_COUNT++))
fi

if [ -f ".cursor/settings.json" ]; then
    ((SUCCESS_COUNT++))
fi

if echo "$PATH" | grep -q "$HOME/.local/bin"; then
    ((SUCCESS_COUNT++))
fi

if grep -q "iteragent" "$HOME/.zshrc" 2>/dev/null; then
    ((SUCCESS_COUNT++))
fi

# Calculate success percentage
SUCCESS_PERCENTAGE=$((SUCCESS_COUNT * 100 / TOTAL_TESTS))

if [ $SUCCESS_PERCENTAGE -ge 80 ]; then
    print_success "Installation verification PASSED ($SUCCESS_PERCENTAGE% success rate)"
    echo ""
    print_status "🚀 IterAgent is ready to use in Cursor!"
    echo ""
    print_status "Next steps:"
    echo "1. Open Cursor"
    echo "2. Open terminal (Ctrl+` or Cmd+`)"
    echo "3. Run: iteragent --version"
    echo "4. Initialize in your project: iteragent init"
    echo "5. Start the loop: iteragent run"
    echo ""
    print_status "Terminal feedback commands:"
    echo "- iteragent feedback --status"
    echo "- iteragent allowlist add \"error\""
    echo "- iteragent suggestions"
    echo "- iteragent execute suggestion_id"
else
    print_error "Installation verification FAILED ($SUCCESS_PERCENTAGE% success rate)"
    echo ""
    print_status "Please run the installation script again:"
    echo "./cursor-universal-install.sh"
fi

echo ""
print_status "For troubleshooting, see: cursor-persistent-setup.md"
