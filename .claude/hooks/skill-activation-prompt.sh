#!/bin/bash
# Hook: UserPromptSubmit
# Purpose: Inject relevant skill context based on prompt keywords

# This hook analyzes the user prompt and injects relevant skill documentation
# Run the TypeScript version for full functionality
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if bun is available
if command -v bun &> /dev/null; then
    bun run "$SCRIPT_DIR/skill-activation-prompt.ts" "$@"
else
    echo "Warning: bun not found, skill activation disabled"
fi
