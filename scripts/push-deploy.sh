#!/bin/bash
# Push to GitHub + auto-deploy to GitHub Pages
# Usage: ./scripts/push-deploy.sh [commit message]
set -e
cd "$(dirname "$0")/.."

MSG="${1:-update}"

echo "📦 Building..."
npm run build

echo "🔄 Pushing to GitHub..."
git push

echo "🚀 Deploying to GitHub Pages..."
npm run deploy

# Verify deployment
LIVE_HASH=$(curl -s https://maxmini0214.github.io/donflow/ | grep -o 'index-[a-zA-Z0-9]*\.js' | head -1)
BUILD_HASH=$(ls dist/assets/index-*.js 2>/dev/null | grep -o 'index-[a-zA-Z0-9]*\.js' | head -1)

if [ "$LIVE_HASH" = "$BUILD_HASH" ]; then
    echo "✅ Deployed & verified (hash: $BUILD_HASH)"
else
    echo "⚠️ Hash mismatch! Live=$LIVE_HASH Build=$BUILD_HASH (CDN propagation may take a few minutes)"
fi
