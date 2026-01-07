#!/usr/bin/env bash
# Code quality checks - runs format, lint, and type checks with minimal output
# Only shows errors/warnings and non-zero exit codes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

run_quiet() {
    local name="$1"
    shift
    local output
    local exit_code

    output=$("$@" 2>&1) && exit_code=0 || exit_code=$?

    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}FAIL${NC} $name (exit $exit_code)"
        # Show output on failure
        echo "$output" | grep -E "(error|warning|Error|Warning|failed|FAIL)" || echo "$output"
        return $exit_code
    fi

    # Check for warnings in successful output
    local warnings
    warnings=$(echo "$output" | grep -E "(warning|Warning)" | head -5 || true)
    if [ -n "$warnings" ]; then
        echo -e "${GREEN}PASS${NC} $name (with warnings)"
        echo "$warnings"
    fi

    return 0
}

echo "Running code quality checks..."

# Format check
run_quiet "format" bun format

# Lint check
run_quiet "lint" bun lint

# Type check
run_quiet "tsc" bun tsc

echo -e "${GREEN}All checks passed${NC}"
