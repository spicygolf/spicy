# Claude Code Configuration

Lightweight orchestration for all tasks - decompose, track, commit often.

## Core Pattern

Every task follows this flow:

1. **Read** `.claude/progress/claude-progress.md` and recent git log
2. **Decompose** task into atomic steps
3. **Work** on ONE step at a time
4. **Commit** after each completed step
5. **Update** progress file for handoff

This prevents context exhaustion and enables seamless session handoffs.

## Hooks

| Hook | When | What |
|------|------|------|
| `UserPromptSubmit` | Every prompt | Shows active task, injects skills |
| `PostToolUse` | After edits | Tracks file changes |
| `Stop` | Session end | Quality checks, progress reminder |

## Skills

| Skill | Priority | Activation |
|-------|----------|------------|
| `architecture` | 100 | Always |
| `orchestration` | 99 | Always |
| `jazz-patterns` | 95 | Keywords |
| `typescript-standards` | 80 | Keywords |

## Progress Tracking

`.claude/progress/claude-progress.md` tracks:
- Current task and status
- Steps with completion state
- Session log for handoff
- Files changed

## Key Principles

1. **Local-First**: Jazz for user data, API only for external data
2. **Jazz Patterns**: `$jazz.has()`, `ensureLoaded`, no Jazz in React state
3. **Quality**: `bun format && bun lint && bun tsc` must pass
