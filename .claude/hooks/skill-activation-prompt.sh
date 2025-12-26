#!/bin/bash
# Hook: UserPromptSubmit
# Purpose: Inject relevant skill context based on prompt keywords

# Log to file for debugging
echo "$(date): Hook fired, CLAUDE_PROMPT=${CLAUDE_PROMPT:0:50}..." >> /tmp/claude-hook-debug.log

# This hook analyzes the user prompt and injects relevant skill documentation
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Export PATH to include bun
export PATH="/Users/brad/.bun/bin:$PATH"

# Run the TypeScript version and capture output
OUTPUT=$("$SCRIPT_DIR/skill-activation-prompt.ts" 2>&1)
echo "$(date): Hook output length: ${#OUTPUT}" >> /tmp/claude-hook-debug.log

# Output to stdout for Claude to receive
echo "$OUTPUT"
