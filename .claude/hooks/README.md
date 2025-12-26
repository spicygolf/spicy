# Claude Code Hooks

Hooks fire automatically at specific points during Claude Code sessions.

## Requirements

- **bun** - Required for TypeScript hooks and quality checks
- Scripts must be executable (`chmod +x *.sh`)

## Available Hooks

### skill-activation-prompt.sh / .ts
**Event**: UserPromptSubmit

Analyzes prompts and injects relevant skill context:
1. Reads skill rules from `skills/skill-rules.json`
2. Matches prompt keywords against triggers
3. Shows active task state from progress file
4. Injects skill documentation into context

### post-tool-use-tracker.sh
**Event**: PostToolUse (Edit, Write operations)

Tracks file changes during sessions for:
- Progress tracking
- Session handoff
- Change summaries

### quality-check.sh
**Event**: Stop

Runs before task completion:
- `bun format` - Code formatting
- `bun lint` - Linting
- `bun tsc` - Type checking

Also reminds about progress file updates and uncommitted changes.

## Hook Configuration

Configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "..." }] }],
    "PostToolUse": [{ "matcher": "Edit|Write", "hooks": [...] }],
    "Stop": [{ "hooks": [...] }]
  }
}
```

## Environment Variables

Hooks receive context via:
- `CLAUDE_PROJECT_DIR` - Project root
- `CLAUDE_PROMPT` - User's prompt (UserPromptSubmit)
- `CLAUDE_TOOL_NAME` - Tool used (PostToolUse)
- `CLAUDE_FILE_PATH` - Affected file (PostToolUse)
