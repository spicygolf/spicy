# Claude Code Hooks

This directory contains hooks that fire automatically at specific points during Claude Code sessions.

## Available Hooks

### skill-activation-prompt.sh / .ts
**Event**: UserPromptSubmit
**Purpose**: Analyzes user prompts and injects relevant skill context based on keywords.

When a user submits a prompt, this hook:
1. Reads the skill rules from `skills/skill-rules.json`
2. Matches prompt keywords against skill triggers
3. Injects relevant skill documentation into context

### post-tool-use-tracker.sh
**Event**: PostToolUse
**Purpose**: Tracks file changes during sessions for context awareness.

Records which files are modified during a session, enabling:
- Progress tracking for long-running tasks
- Session handoff between agents
- Change summary generation

### quality-check.sh
**Event**: Stop (or manual invocation)
**Purpose**: Runs code quality checks before task completion.

Executes:
- `bun format` - Code formatting with Biome
- `bun lint` - Linting with Biome
- `bun tsc` - TypeScript type checking

All three must pass before code is considered ready to commit.

## Hook Configuration

Hooks are configured in `.claude/settings.json` under the `hooks` key:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": ["bash .claude/hooks/skill-activation-prompt.sh"]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": ["bash .claude/hooks/post-tool-use-tracker.sh"]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": ["bash .claude/hooks/quality-check.sh"]
      }
    ]
  }
}
```

## Writing Custom Hooks

Hooks receive context through environment variables:
- `CLAUDE_PROMPT` - The user's prompt (UserPromptSubmit)
- `CLAUDE_TOOL_NAME` - Name of tool used (PostToolUse)
- `CLAUDE_FILE_PATH` - File path affected (PostToolUse for file operations)

Hooks should:
1. Be executable (`chmod +x`)
2. Exit with code 0 on success
3. Output to stdout for context injection
4. Output to stderr for logging/debugging
