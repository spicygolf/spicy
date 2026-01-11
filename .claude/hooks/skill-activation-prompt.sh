#!/bin/bash
# Hook: UserPromptSubmit
# Purpose: Inject relevant skill context based on prompt keywords

# Read JSON input from stdin (Claude Code passes hook context this way)
PROMPT_INPUT=$(cat)

# Export for the TypeScript script to parse
export CLAUDE_PROMPT="$PROMPT_INPUT"

# This hook analyzes the user prompt and injects relevant skill documentation
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Export PATH to include bun
export PATH="/Users/brad/.bun/bin:$PATH"

# Run the TypeScript version and capture output
OUTPUT=$("$SCRIPT_DIR/skill-activation-prompt.ts" 2>&1)
echo "$(date): Hook output length: ${#OUTPUT}" >> /tmp/claude-hook-debug.log

# Output to stdout for Claude to receive
echo "$OUTPUT"
