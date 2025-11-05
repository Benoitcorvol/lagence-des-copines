#!/bin/bash
# Build script for L'Agence des Copines Chat Widget

set -e

echo "🔨 Building L'Agence des Copines Chat Widget..."

# Check if terser is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

# Create dist directory if it doesn't exist
mkdir -p dist

# Minify JavaScript
echo "📦 Minifying widget.js..."
npx terser src/widget.js \
  -c \
  -m \
  -o dist/widget.min.js \
  --source-map "url=widget.js.map"

# Check bundle size
SIZE=$(stat -f%z dist/widget.min.js 2>/dev/null || stat -c%s dist/widget.min.js 2>/dev/null)
GZIP_SIZE=$(gzip -c dist/widget.min.js | wc -c | tr -d ' ')

echo ""
echo "✅ Build complete!"
echo "📊 Bundle Stats:"
echo "   - Minified: ${SIZE} bytes ($(echo "scale=2; $SIZE/1024" | bc) KB)"
echo "   - Gzipped: ${GZIP_SIZE} bytes ($(echo "scale=2; $GZIP_SIZE/1024" | bc) KB)"
echo ""

# Check if under 50KB gzipped
if [ $GZIP_SIZE -lt 51200 ]; then
    echo "✅ Bundle size OK (<50KB gzipped)"
else
    echo "⚠️  Warning: Bundle size exceeds 50KB gzipped"
fi

echo ""
echo "📁 Output files:"
echo "   - dist/widget.min.js"
echo "   - dist/widget.js.map"
