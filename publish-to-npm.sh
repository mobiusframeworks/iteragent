#!/bin/bash

# InterTools NPM Publication Script
# This script publishes the updated InterTools packages to NPM

set -e

echo "🚀 InterTools NPM Publication Script"
echo "====================================="
echo ""

# Check if user is logged into NPM
echo "🔐 Checking NPM authentication..."
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ You are not logged into NPM. Please run:"
    echo "   npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
echo "✅ Logged in as: $NPM_USER"
echo ""

# Build all packages
echo "🔨 Building packages..."
echo ""

# Build main InterTools package
echo "📦 Building main InterTools package..."
cd packages/intertools
npm run build
echo "✅ InterTools package built"
echo ""

# Build CLI package
echo "🛠️ Building CLI package..."
cd ../intertools-cli
npm run build
echo "✅ CLI package built"
echo ""

# Build server package (if needed)
echo "⚙️ Building server package..."
cd ../../apps/server
npm run build || echo "⚠️ Server build skipped (may not be needed for publication)"
echo ""

# Go back to root
cd ../..

echo "📋 Package Summary:"
echo "==================="
echo ""

# Show package info
echo "📦 Main Package: intertools@1.0.15"
echo "   Description: Professional console log analysis & IDE integration"
echo "   Features: 7-day full access trial, then FREE/PRO model"
echo ""

echo "🛠️ CLI Package: @intertools/cli@1.0.15"
echo "   Description: License manager and activation tool"
echo "   Features: Trial activation, subscription management"
echo ""

echo "⚙️ Server Package: @intertools/server@1.0.0"
echo "   Description: License server for PRO subscriptions"
echo "   Features: JWT tokens, Stripe integration, webhooks"
echo ""

# Ask for confirmation
read -p "🤔 Do you want to publish these packages to NPM? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publication cancelled"
    exit 1
fi

echo ""
echo "📤 Publishing packages..."
echo ""

# Publish main package
echo "📦 Publishing intertools..."
cd packages/intertools
npm publish
echo "✅ intertools@1.0.15 published successfully!"
echo ""

# Publish CLI package
echo "🛠️ Publishing @intertools/cli..."
cd ../intertools-cli
npm publish
echo "✅ @intertools/cli@1.0.15 published successfully!"
echo ""

# Publish server package (optional)
echo "⚙️ Publishing @intertools/server..."
cd ../../apps/server
npm publish || echo "⚠️ Server package not published (may require additional setup)"
echo ""

# Go back to root
cd ../..

echo "🎉 PUBLICATION COMPLETE!"
echo "======================="
echo ""
echo "📦 Published packages:"
echo "   ✅ intertools@1.0.15"
echo "   ✅ @intertools/cli@1.0.15"
echo "   ⚠️ @intertools/server@1.0.0 (optional)"
echo ""
echo "🔗 NPM Links:"
echo "   📦 https://www.npmjs.com/package/intertools"
echo "   🛠️ https://www.npmjs.com/package/@intertools/cli"
echo "   ⚙️ https://www.npmjs.com/package/@intertools/server"
echo ""
echo "📊 It may take a few minutes for the updated documentation"
echo "   to appear on the NPM website."
echo ""
echo "🎯 Next Steps:"
echo "   1. Check the NPM pages to verify documentation"
echo "   2. Test installation: npm install intertools"
echo "   3. Verify the 7-day trial flow works"
echo "   4. Update any external documentation links"
echo ""
echo "🚀 Your InterTools v1.0.15 packages are now live on NPM!"
