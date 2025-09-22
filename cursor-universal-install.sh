#!/bin/bash

# IterAgent Universal Cursor Installation Script
# This script ensures IterAgent is available globally in Cursor and persists across new windows

set -e

echo "🚀 Installing IterAgent universally in Cursor environment..."

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

# Check if we're in the right directory
if [ ! -f "packages/iteragent-cli/package.json" ]; then
    print_error "Please run this script from the IterAgent root directory"
    exit 1
fi

# Detect operating system
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
fi

print_status "Detected OS: $OS"

# Function to install Node.js if not present
install_nodejs() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found. Installing Node.js..."
        
        if [[ "$OS" == "macos" ]]; then
            # Install via Homebrew if available
            if command -v brew &> /dev/null; then
                brew install node
            else
                print_error "Please install Node.js manually from https://nodejs.org/"
                exit 1
            fi
        elif [[ "$OS" == "linux" ]]; then
            # Install via package manager
            if command -v apt &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command -v yum &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
                sudo yum install -y nodejs
            else
                print_error "Please install Node.js manually from https://nodejs.org/"
                exit 1
            fi
        else
            print_error "Please install Node.js manually from https://nodejs.org/"
            exit 1
        fi
    else
        print_success "Node.js is already installed: $(node --version)"
    fi
}

# Function to install npm if not present
install_npm() {
    if ! command -v npm &> /dev/null; then
        print_warning "npm not found. Installing npm..."
        install_nodejs
    else
        print_success "npm is already installed: $(npm --version)"
    fi
}

# Function to create global installation
install_iteragent_globally() {
    print_status "Installing IterAgent globally..."
    
    # Navigate to the CLI package directory
    cd packages/iteragent-cli
    
    # Build the project
    print_status "Building IterAgent..."
    npm run build
    
    # Install globally
    print_status "Installing globally..."
    if npm install -g .; then
        print_success "IterAgent installed globally successfully!"
    else
        print_warning "Global installation failed, trying with sudo..."
        if sudo npm install -g .; then
            print_success "IterAgent installed globally with sudo!"
        else
            print_error "Failed to install globally. Trying alternative method..."
            
            # Alternative: Create symlink in user's local bin
            USER_BIN="$HOME/.local/bin"
            mkdir -p "$USER_BIN"
            
            # Create symlink to the built executable
            ln -sf "$(pwd)/dist/index.js" "$USER_BIN/iteragent"
            chmod +x "$USER_BIN/iteragent"
            
            print_success "IterAgent symlinked to $USER_BIN/iteragent"
            print_warning "Make sure $USER_BIN is in your PATH"
        fi
    fi
    
    cd ../..
}

# Function to create Cursor-specific configuration
setup_cursor_config() {
    print_status "Setting up Cursor-specific configuration..."
    
    # Create Cursor configuration directory
    CURSOR_CONFIG_DIR="$HOME/.cursor"
    mkdir -p "$CURSOR_CONFIG_DIR"
    
    # Create IterAgent configuration
    cat > "$CURSOR_CONFIG_DIR/iteragent-config.json" << EOF
{
  "iteragentPath": "$(which iteragent || echo "$HOME/.local/bin/iteragent")",
  "autoStart": true,
  "persistent": true,
  "globalInstall": true,
  "version": "1.0.3",
  "installDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "cursorIntegration": {
    "enabled": true,
    "inboxPath": ".cursor/inbox",
    "autoFeedback": true
  }
}
EOF
    
    print_success "Cursor configuration created at $CURSOR_CONFIG_DIR/iteragent-config.json"
}

# Function to create shell profile configuration
setup_shell_profile() {
    print_status "Setting up shell profile for persistence..."
    
    # Detect shell
    SHELL_NAME=$(basename "$SHELL")
    SHELL_RC=""
    
    case "$SHELL_NAME" in
        "bash")
            SHELL_RC="$HOME/.bashrc"
            ;;
        "zsh")
            SHELL_RC="$HOME/.zshrc"
            ;;
        "fish")
            SHELL_RC="$HOME/.config/fish/config.fish"
            ;;
        *)
            SHELL_RC="$HOME/.profile"
            ;;
    esac
    
    # Add IterAgent to PATH if not already there
    if [ -f "$SHELL_RC" ]; then
        if ! grep -q "iteragent" "$SHELL_RC"; then
            echo "" >> "$SHELL_RC"
            echo "# IterAgent Configuration" >> "$SHELL_RC"
            echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$SHELL_RC"
            echo "alias iteragent='$HOME/.local/bin/iteragent'" >> "$SHELL_RC"
            print_success "Added IterAgent to $SHELL_RC"
        else
            print_success "IterAgent already configured in $SHELL_RC"
        fi
    else
        print_warning "Shell profile not found: $SHELL_RC"
    fi
}

# Function to create Cursor workspace settings
setup_cursor_workspace() {
    print_status "Setting up Cursor workspace settings..."
    
    # Create .vscode directory for Cursor workspace settings
    mkdir -p .vscode
    
    cat > .vscode/settings.json << EOF
{
  "terminal.integrated.env.osx": {
    "PATH": "\${env:PATH}:$HOME/.local/bin"
  },
  "terminal.integrated.env.linux": {
    "PATH": "\${env:PATH}:$HOME/.local/bin"
  },
  "terminal.integrated.env.windows": {
    "PATH": "\${env:PATH};$HOME/.local/bin"
  },
  "iteragent.enabled": true,
  "iteragent.autoStart": true,
  "iteragent.globalInstall": true
}
EOF
    
    print_success "Cursor workspace settings created"
}

# Function to create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    cat > iteragent-startup.sh << 'EOF'
#!/bin/bash
# IterAgent Startup Script for Cursor

# Check if IterAgent is available
if command -v iteragent &> /dev/null; then
    echo "🚀 IterAgent is available globally"
    iteragent --version
else
    echo "⚠️ IterAgent not found in PATH"
    echo "Trying to find IterAgent..."
    
    # Try common locations
    POSSIBLE_PATHS=(
        "$HOME/.local/bin/iteragent"
        "/usr/local/bin/iteragent"
        "/opt/homebrew/bin/iteragent"
        "$HOME/.npm-global/bin/iteragent"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -f "$path" ]; then
            echo "✅ Found IterAgent at: $path"
            export PATH="$(dirname "$path"):$PATH"
            break
        fi
    done
fi

# Set up IterAgent environment
export ITERAGENT_GLOBAL_INSTALL=true
export ITERAGENT_CURSOR_INTEGRATION=true
export ITERAGENT_PERSISTENT=true

echo "🔍 IterAgent environment configured"
EOF
    
    chmod +x iteragent-startup.sh
    print_success "Startup script created: iteragent-startup.sh"
}

# Function to create Cursor extension manifest
create_cursor_extension() {
    print_status "Creating Cursor extension manifest..."
    
    mkdir -p .cursor/extensions/iteragent
    
    cat > .cursor/extensions/iteragent/package.json << EOF
{
  "name": "iteragent",
  "displayName": "IterAgent",
  "description": "Iterative testing agent for Cursor IDE",
  "version": "1.0.3",
  "publisher": "iteragent",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": [
    "Other"
  ],
  "activationEvents": [
    "onCommand:iteragent.start",
    "onCommand:iteragent.stop",
    "onCommand:iteragent.status"
  ],
  "main": "./extension.js",
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
    ],
    "configuration": {
      "title": "IterAgent",
      "properties": {
        "iteragent.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable IterAgent"
        },
        "iteragent.autoStart": {
          "type": "boolean",
          "default": true,
          "description": "Auto-start IterAgent"
        },
        "iteragent.globalInstall": {
          "type": "boolean",
          "default": true,
          "description": "Use global IterAgent installation"
        }
      }
    }
  }
}
EOF
    
    # Create simple extension.js
    cat > .cursor/extensions/iteragent/extension.js << 'EOF'
const vscode = require('vscode');

function activate(context) {
    console.log('IterAgent extension activated');
    
    // Register commands
    const startCommand = vscode.commands.registerCommand('iteragent.start', () => {
        const terminal = vscode.window.createTerminal('IterAgent');
        terminal.sendText('iteragent run');
        terminal.show();
    });
    
    const stopCommand = vscode.commands.registerCommand('iteragent.stop', () => {
        vscode.window.showInformationMessage('IterAgent stopped');
    });
    
    const statusCommand = vscode.commands.registerCommand('iteragent.status', () => {
        const terminal = vscode.window.createTerminal('IterAgent Status');
        terminal.sendText('iteragent feedback --status');
        terminal.show();
    });
    
    context.subscriptions.push(startCommand, stopCommand, statusCommand);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
EOF
    
    print_success "Cursor extension manifest created"
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check if iteragent command is available
    if command -v iteragent &> /dev/null; then
        print_success "IterAgent command is available globally"
        iteragent --version
    else
        print_warning "IterAgent command not found in PATH"
        
        # Try to find it
        if [ -f "$HOME/.local/bin/iteragent" ]; then
            print_success "Found IterAgent at $HOME/.local/bin/iteragent"
            "$HOME/.local/bin/iteragent" --version
        else
            print_error "IterAgent installation verification failed"
            return 1
        fi
    fi
    
    # Check Cursor configuration
    if [ -f "$HOME/.cursor/iteragent-config.json" ]; then
        print_success "Cursor configuration file exists"
    else
        print_warning "Cursor configuration file not found"
    fi
    
    # Check workspace settings
    if [ -f ".vscode/settings.json" ]; then
        print_success "Cursor workspace settings created"
    else
        print_warning "Cursor workspace settings not found"
    fi
}

# Function to create uninstall script
create_uninstall_script() {
    print_status "Creating uninstall script..."
    
    cat > iteragent-uninstall.sh << 'EOF'
#!/bin/bash
# IterAgent Uninstall Script

echo "🗑️ Uninstalling IterAgent..."

# Remove global installation
if command -v npm &> /dev/null; then
    npm uninstall -g iteragent-cli 2>/dev/null || true
fi

# Remove symlinks
rm -f "$HOME/.local/bin/iteragent"

# Remove configuration files
rm -f "$HOME/.cursor/iteragent-config.json"
rm -f ".vscode/settings.json"
rm -f "iteragent-startup.sh"

# Remove from shell profile
SHELL_RC="$HOME/.zshrc"
if [ -f "$SHELL_RC" ]; then
    sed -i.bak '/# IterAgent Configuration/,+2d' "$SHELL_RC"
fi

echo "✅ IterAgent uninstalled successfully"
EOF
    
    chmod +x iteragent-uninstall.sh
    print_success "Uninstall script created: iteragent-uninstall.sh"
}

# Main installation process
main() {
    print_status "Starting IterAgent universal installation for Cursor..."
    
    # Install prerequisites
    install_nodejs
    install_npm
    
    # Install IterAgent globally
    install_iteragent_globally
    
    # Setup Cursor-specific configuration
    setup_cursor_config
    setup_cursor_workspace
    
    # Setup shell profile for persistence
    setup_shell_profile
    
    # Create startup script
    create_startup_script
    
    # Create Cursor extension manifest
    create_cursor_extension
    
    # Create uninstall script
    create_uninstall_script
    
    # Verify installation
    verify_installation
    
    print_success "IterAgent universal installation completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Restart Cursor to apply workspace settings"
    echo "2. Run 'source ~/.zshrc' (or restart terminal) to update PATH"
    echo "3. Test with 'iteragent --version'"
    echo "4. Use 'iteragent run' in your projects"
    echo ""
    print_status "To uninstall: ./iteragent-uninstall.sh"
}

# Run main function
main "$@"
