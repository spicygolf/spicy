# Lightweight Orchestration (Always On)

Every task benefits from decomposition and progress tracking, not just complex ones.

## Core Principle

**Work on ONE thing at a time.** This prevents context exhaustion and enables handoff.

## For Every Task

1. **Decompose** - Break into atomic steps (even simple tasks)
2. **Track** - Update `.claude/progress/claude-progress.md`
3. **Commit** - Git commit after each logical step
4. **Handoff** - Leave clear state for next session

## Session Startup Ritual

At the start of every session:

1. Read `.claude/progress/claude-progress.md`
2. Check `git log --oneline -10` for recent work
3. Run `bun tsc` to verify codebase isn't broken
4. Pick up from last `in_progress` step, or start new task

## Task Decomposition

Even "simple" tasks should be decomposed:

**Example: "Fix the button color"**
```
Steps:
1. Locate the button component
2. Identify current color source
3. Update to use theme color
4. Verify change works
5. Run quality checks
```

**Example: "Add handicap display"**
```
Steps:
1. Check Jazz schema has handicap field
2. Create HandicapDisplay component
3. Add to player profile screen
4. Test loading states
5. Run quality checks
```

## Progress File Format

Update `.claude/progress/claude-progress.md`:

```markdown
## Current Task
**Task**: Add handicap display to player profile
**Status**: in_progress
**Started**: 2024-01-15 10:30
**Last Updated**: 2024-01-15 10:45

## Steps
| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Check Jazz schema | completed | Field exists |
| 2 | Create component | in_progress | Using Unistyles |
| 3 | Add to profile | pending | |
| 4 | Test loading | pending | |
| 5 | Quality checks | pending | |
```

## Commit Strategy

Commit after each completed step:

```bash
git add -A
git commit -m "feat(app): create HandicapDisplay component"
```

This enables:
- Easy rollback if something breaks
- Clear history for handoff
- Recovery from context exhaustion

## When Context Runs Low

If you notice context getting large:

1. Complete current step
2. Commit changes
3. Update progress file with clear "Next:" instruction
4. The next session will pick up seamlessly

## Specialist Agents

For complex multi-package tasks, use specialist agents:

| Agent | Focus |
|-------|-------|
| `app-specialist` | React Native UI, Jazz integration |
| `jazz-specialist` | Schema design, data patterns |
| `api-specialist` | External data endpoints |
| `lib-specialist` | Shared utilities, business logic |

Launch via Task tool when a step requires deep specialist knowledge.

## Integration Checklist

Before marking task complete:

- [ ] All steps completed
- [ ] Quality checks pass (format, lint, tsc)
- [ ] Progress file updated
- [ ] Git committed with descriptive message
- [ ] No `in_progress` steps left dangling

## Debugging Tips

**Dev server logs are tee'd to files for your review:**

| Service | Log File |
|---------|----------|
| React Native Metro | `/tmp/spicy-metro.log` |
| API Server | `/tmp/spicy-api.log` |

Use `tail -100 /tmp/spicy-metro.log` to see recent app logs.
Use `tail -100 /tmp/spicy-api.log` to see recent API logs.

These logs persist across app refreshes - useful for debugging startup issues.
