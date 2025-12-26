#!/bin/bash
# Hook: PostToolUse
# Purpose: Track file changes for context awareness

# This hook tracks which files have been modified during the session
# to maintain context about what has changed.

PROGRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../progress" && pwd)"
TRACKER_FILE="$PROGRESS_DIR/.session-changes.json"

# Get tool info from environment
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"
FILE_PATH="${CLAUDE_FILE_PATH:-}"

# Only track file modification tools
case "$TOOL_NAME" in
    Write|Edit|mcp__acp__Write|mcp__acp__Edit)
        if [ -n "$FILE_PATH" ]; then
            # Append to tracker file
            TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

            # Create tracker file if it doesn't exist
            if [ ! -f "$TRACKER_FILE" ]; then
                echo '{"changes":[]}' > "$TRACKER_FILE"
            fi

            # Add change entry (simplified - real implementation would use jq)
            echo "[$TIMESTAMP] $TOOL_NAME: $FILE_PATH" >> "$PROGRESS_DIR/.session-log.txt"
        fi
        ;;
esac
