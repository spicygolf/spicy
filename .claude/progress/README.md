# Progress Tracking

This directory contains session progress files.

## Files

- `claude-progress.md` - Current task state (gitignored, created per-session)
- `.session-*.txt` - File change logs (gitignored, auto-generated)

## Template

When starting a new task, create `claude-progress.md`:

```markdown
# Session Progress

## Current Task

**Task**: [Description]
**Status**: in_progress
**Started**: [Date/Time]
**Last Updated**: [Date/Time]

## Steps

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | First step | pending | |
| 2 | Second step | pending | |

## Session Log

### [Date]
- What was done
- Decisions made

## Blockers

None
```

## Status Values

- `pending` - Not started
- `in_progress` - Currently working (only ONE at a time)
- `completed` - Done
- `blocked` - Waiting on something
