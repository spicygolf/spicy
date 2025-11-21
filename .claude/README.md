# Claude Code Configuration for Spicy Golf

This directory contains the orchestration configuration for Claude Code agents working on Spicy Golf.

## Quick Start

### For Simple Tasks (1-2 files)
Just work directly - no orchestration needed.

### For Complex Tasks (3+ files, cross-package)
Invoke the orchestrator:

```
User: "Add team scoring feature"
→ Orchestrator analyzes and coordinates specialists
```

## Key Principles for Spicy Golf

### 1. Local-First Architecture
- App MUST work offline (golf courses have poor connectivity)
- User data stored in Jazz CoMaps/CoLists
- API only for external data (course info, weather)

### 2. Jazz Patterns are CRITICAL
These prevent data loss - follow them religiously:
- Use `$jazz.has("field")` NOT `!obj.field`
- Always `ensureLoaded` after `upsertUnique`
- Load lists level-by-level
- Create CoMaps with required fields only

### 3. Quality is Enforced
Pre-commit hooks require:
- `bun format` passes
- `bun lint` passes
- `bun tsc` passes

## Agents Overview

### orchestrator
**When**: 3+ files, cross-package tasks, new features
**Role**: Decomposes tasks, coordinates specialists, maintains architectural vision
**Never**: Writes code directly

### app-specialist
**Package**: packages/app
**Focus**: React Native UI, Jazz integration, offline functionality
**Rules**: architecture.xml, code-typescript.xml, jazz.xml

### jazz-specialist
**Focus**: Jazz schema design, data modeling, loading patterns
**Expertise**: CoMaps, CoLists, circular dependencies, performance
**Rules**: architecture.xml, code-typescript.xml, jazz.xml

### api-specialist
**Package**: packages/api
**Focus**: External data endpoints, third-party integrations
**Rules**: architecture.xml, code-typescript.xml

### lib-specialist
**Package**: packages/lib
**Focus**: Shared utilities, business logic, types
**Constraint**: Framework-agnostic (no React, Jazz, etc.)
**Rules**: architecture.xml, code-typescript.xml

## Read More

See [ORCHESTRATION-GUIDE.md](./ORCHESTRATION-GUIDE.md) for detailed usage patterns, examples, and best practices.

The XML format allows for better context management and agent-specific loading.
