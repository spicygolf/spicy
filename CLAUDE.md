# Spicy Golf - Claude Code Configuration

This project uses **lightweight orchestration for all tasks** - decompose, track progress, commit often.

## Core Workflow

**Every task, regardless of size:**

1. **Decompose** - Break into atomic steps
2. **Track** - Update `.claude/progress/claude-progress.md`
3. **Execute** - Work on ONE step at a time
4. **Commit** - Git commit after each step
5. **Handoff** - Leave clear state for next session

## Session Startup

At the start of every session:

1. Read `.claude/progress/claude-progress.md`
2. Check `git log --oneline -10`
3. Run `bun tsc` to verify codebase works
4. Pick up from last `in_progress` step

## Hooks (Auto-Firing)

| Hook | Purpose |
|------|---------|
| `UserPromptSubmit` | Shows active task, reminds about decomposition |
| `PostToolUse` | Tracks file changes |
| `Stop` | Runs quality checks, reminds about progress update |

## Critical Principles

### 1. Local-First with Jazz Tools
- App MUST work offline
- All user data in Jazz CoMaps/CoLists
- API only for external data
- **Rule**: If it can work offline, use Jazz

### 2. Jazz Patterns are NON-NEGOTIABLE
```typescript
// CORRECT
if (!player.$jazz.has("rounds")) {
  player.$jazz.set("rounds", ListOfRounds.create([]));
}

// WRONG - causes data loss!
if (!player.rounds) { ... }
```

See `.claude/skills/jazz-patterns/README.md`

### 3. Quality Checks - MANDATORY
```bash
bun format && bun lint && bun tsc
```

## Tech Stack

| Tool | Purpose |
|------|---------|
| React Native | Mobile app |
| Jazz Tools | Local-first database |
| ElysiaJS | API (external data only) |
| TypeScript | Language (strict mode) |
| Bun | Package manager |
| Unistyles | Styling |
| Biome | Format/lint |

## Packages

| Package | Purpose |
|---------|---------|
| `packages/app` | React Native mobile app |
| `packages/api` | Backend API (external data only) |
| `packages/lib` | Shared utilities and logic |

## Skills

| Skill | Activation | Purpose |
|-------|------------|---------|
| `architecture` | Always | Local-first principles |
| `orchestration` | Always | Task decomposition, progress tracking |
| `jazz-patterns` | Keywords | Jazz data patterns |
| `typescript-standards` | Keywords | Coding standards |

## Specialist Agents

For steps requiring deep expertise:

| Agent | Focus |
|-------|-------|
| `app-specialist` | React Native UI |
| `jazz-specialist` | Schema design |
| `api-specialist` | External endpoints |
| `lib-specialist` | Shared utilities |
