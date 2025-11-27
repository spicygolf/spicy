# Spicy Golf - Claude Code Configuration

This project uses the **4-Layer Orchestra Architecture** for efficient multi-agent development.

## Quick Reference

- **Simple tasks (1-2 files)**: Work directly, no orchestration needed
- **Complex tasks (3+ files)**: Use the orchestrator agent
- **Rules**: See `.claude/rules/*.xml` for architectural constraints
- **Agents**: See `.claude/agents/*.md` for specialist definitions
- **Guide**: See `.claude/ORCHESTRATION-GUIDE.md` for detailed usage

## Critical Architectural Principles

### 1. Local-First with Jazz Tools
- App MUST work offline (golf courses have poor connectivity)
- All user data stored in Jazz CoMaps/CoLists
- API only for external data (course info, weather, etc.)
- **Rule**: If it can work offline, use Jazz, NOT the API

### 2. Jazz Patterns are NON-NEGOTIABLE
These prevent data loss - follow them religiously:
```typescript
// CORRECT: Check field existence
if (!player.$jazz.has("rounds")) {
  player.$jazz.set("rounds", ListOfRounds.create([]));
}

// WRONG: Will cause data loss!
if (!player.rounds) {
  player.$jazz.set("rounds", ListOfRounds.create([]));
}
```

See `.claude/rules/jazz.xml` for all Jazz patterns.

### 3. Quality Checks Required - MANDATORY BEFORE COMPLETION
**CRITICAL**: You MUST run all quality checks and fix ALL errors before considering ANY task complete:

```bash
bun format && bun lint && bun tsc
```

- `bun format` - Code formatting (auto-fixes)
- `bun lint` - Linting (must have zero errors)
- `bun tsc` - Type checking (must have zero errors)

**DO NOT** tell the user you are done until all three commands pass successfully with zero errors. Pre-commit hooks will reject commits that fail these checks, so running them proactively is mandatory, not optional.

**IMPORTANT**: If you encounter pre-existing errors in files you didn't modify, you MUST fix those too. The repository must be in a committable state when you're done. Don't ignore pre-existing errors - they block commits and need to be resolved. This should be rare, but when it happens, fix it.

## Project Structure

```
spicy/
├── packages/
│   ├── app/          # React Native mobile app (primary)
│   ├── api/          # Backend API (external data only)
│   └── lib/          # Shared utilities and business logic
│
├── .claude/          # Orchestration configuration
    ├── agents/       # Specialist agent definitions
    ├── rules/        # XML rules for context management
    └── ORCHESTRATION-GUIDE.md
```

## Tech Stack

- **Mobile**: React Native
- **Database**: Jazz Tools (local-first sync)
- **API**: ElysiaJS (Bun runtime)
- **Language**: TypeScript (strict mode)
- **Package Manager**: Bun 1.3+
- **Styling**: React Native Unistyles
- **Formatting/Linting**: Biome

## Rules Summary

For full details, see `.claude/rules/*.xml`:

### architecture.xml
- Local-first architecture (Jazz Tools)
- Never commit without permission
- Monorepo structure (app, api, lib)
- Minimize code, maximize modularity
- No unnecessary comments
- API usage minimization

### code-typescript.xml
- No `any` or `unknown` types
- Interfaces over types for objects
- Named exports only (no default)
- No enums (use union types)
- Explicit return types
- Quality checks required (format, lint, tsc)
- React Native best practices
- Unistyles for styling

### jazz.xml
- Field existence: Use `$jazz.has("field")`
- ensureLoaded after upsertUnique
- Load lists level-by-level
- Create CoMaps with required fields only
- Avoid useState with Jazz data
- Modify from authoritative source
- Performance: Load what you need

## Getting Started

1. **Read the orchestration guide**: `.claude/ORCHESTRATION-GUIDE.md`
2. **Understand Jazz patterns**: `.claude/rules/jazz.xml`
3. **Know when to orchestrate**: 3+ files or cross-package tasks
4. **Run quality checks**: `bun format && bun lint && bun tsc`

## When to Use Orchestration

### Use Orchestrator For:
- ✅ New features (3+ files)
- ✅ Cross-package changes
- ✅ Jazz schema evolution
- ✅ Complex refactoring

### Work Directly For:
- ✅ Single file changes
- ✅ Simple bug fixes
- ✅ Formatting/style updates
- ✅ Documentation

The XML format allows better context management for specialized agents.

---

**For detailed usage, examples, and patterns, see `.claude/ORCHESTRATION-GUIDE.md`**
