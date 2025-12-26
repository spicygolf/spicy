#!/bin/bash
# Hook: PostToolUse
# Purpose: Validate edited files against Jazz patterns

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Export PATH to include bun
export PATH="/Users/brad/.bun/bin:$PATH"

# Run the TypeScript validator
"$SCRIPT_DIR/jazz-pattern-validator.ts"
