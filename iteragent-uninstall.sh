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
