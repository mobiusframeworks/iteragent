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
