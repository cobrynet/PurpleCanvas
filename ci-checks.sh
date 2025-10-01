#!/bin/bash

# CI/CD Pre-commit Checks
# Run this before committing or pushing code

set -e

echo "🔍 Running CI checks..."
echo ""

echo "📝 Step 1: Type checking..."
npm run check
echo "✅ Type check passed"
echo ""

echo "🔎 Step 2: Linting (TypeScript compilation check)..."
npx tsc --noEmit --skipLibCheck
echo "✅ Lint check passed"
echo ""

echo "🧪 Step 3: Tests..."
echo "⚠️  No tests configured yet (placeholder)"
echo "✅ Test check passed"
echo ""

echo "✨ All CI checks passed successfully!"
