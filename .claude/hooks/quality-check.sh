#!/bin/bash
# Hook: Stop
# Purpose: Run quality checks and remind about progress tracking

set -e

# Find project root
find_project_root() {
    local dir="$1"
    while [ "$dir" != "/" ]; do
        if [ -f "$dir/package.json" ] && grep -q '"workspaces"' "$dir/package.json" 2>/dev/null; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

PROJECT_ROOT=$(find_project_root "$(pwd)")
if [ -z "$PROJECT_ROOT" ]; then
    echo "Could not find project root"
    exit 1
fi

cd "$PROJECT_ROOT"

echo ""
echo "═══════════════════════════════════════"
echo "  SESSION END CHECKLIST"
echo "═══════════════════════════════════════"
echo ""

# Progress reminder
echo "📋 PROGRESS TRACKING"
echo "   - Update .claude/progress/claude-progress.md"
echo "   - Mark completed steps"
echo "   - Note any blockers"
echo "   - Describe next step for handoff"
echo ""

# Git status
echo "📦 GIT STATUS"
if git diff --quiet && git diff --cached --quiet; then
    echo "   No uncommitted changes"
else
    echo "   ⚠️  Uncommitted changes detected"
    echo "   Consider: git add -A && git commit -m 'description'"
fi
echo ""

# Quality checks
echo "🔍 QUALITY CHECKS"
echo ""

FAILURES=0

echo "Format check..."
if bun format >/dev/null 2>&1; then
    echo "   ✅ Format: passed"
else
    echo "   ❌ Format: failed"
    FAILURES=$((FAILURES + 1))
fi

echo "Lint check..."
if bun lint >/dev/null 2>&1; then
    echo "   ✅ Lint: passed"
else
    echo "   ❌ Lint: failed"
    FAILURES=$((FAILURES + 1))
fi

echo "Type check..."
if bun tsc >/dev/null 2>&1; then
    echo "   ✅ TypeScript: passed"
else
    echo "   ❌ TypeScript: failed"
    FAILURES=$((FAILURES + 1))
fi

echo ""
echo "═══════════════════════════════════════"

if [ $FAILURES -eq 0 ]; then
    echo "  ✅ All checks passed"
else
    echo "  ❌ $FAILURES check(s) failed"
fi

echo "═══════════════════════════════════════"
echo ""

exit $FAILURES
