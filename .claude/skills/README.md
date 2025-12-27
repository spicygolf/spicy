# Skills

Skills provide domain-specific knowledge that is auto-injected based on prompt keywords.

## Available Skills

| Skill | Priority | Description |
|-------|----------|-------------|
| `architecture` | 100 | Local-first principles, monorepo structure (always on) |
| `orchestration` | 99 | Task decomposition and progress tracking (always on) |
| `jazz-patterns` | 95 | Jazz Tools patterns - CRITICAL for data integrity |
| `typescript-standards` | 80 | TypeScript and React Native best practices |
| `error-handling` | 75 | Error tracking with Jazz CoFeed + PostHog |

## How Skills Work

1. User submits a prompt
2. `UserPromptSubmit` hook analyzes keywords
3. Matching skills are injected into context
4. Higher priority skills appear first

## Trigger Configuration

See `skill-rules.json` for trigger keywords and file patterns.

## Adding New Skills

1. Create a directory under `skills/` with a `README.md`
2. Add an entry to `skill-rules.json` with triggers
3. The skill content will be injected when triggers match
