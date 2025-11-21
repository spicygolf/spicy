# Claude Code Orchestration Guide for Spicy Golf

This guide implements the **4-Layer Orchestra Architecture** adapted for Spicy Golf's local-first, React Native mobile app.

## Why Orchestration?

### The Problem

Single-agent approaches hit a **complexity ceiling** around 10-15 file modifications:
- Context pollution (Jazz patterns buried under UI implementation)
- Permission interrupt cascades  
- Architectural drift over time
- Circular revisions and context amnesia

### The Solution

**Pure orchestration** with specialized agents:
- Orchestrator maintains architectural vision (never writes code)
- Specialists handle implementation (focused expertise)
- Context isolation (each agent sees only what they need)
- Wave-based deployment (manage context limits)

**Result**: 78% fewer tokens, 100% completion vs partial failure

## The 4 Layers

### Layer 1: Pure Orchestrator
**Agent**: `orchestrator`
**Role**: Decomposes tasks, coordinates specialists, maintains architectural integrity
**Never**: Writes code or implementation details
**Context**: 5,000 tokens (architecture rules only)

### Layer 2: Context Management
**System**: Rules in `.claude/rules/*.xml`
**Role**: Each agent loads only relevant rules
**Benefit**: 60-70% token reduction, prevents context pollution

### Layer 3: Specialized Agents
**Agents**:
- `app-specialist` - React Native mobile app (packages/app)
- `jazz-specialist` - Jazz schema and data modeling
- `api-specialist` - Backend API for external data (packages/api)
- `lib-specialist` - Shared utilities and business logic (packages/lib)

**Context**: 8,000-10,000 tokens each (relevant rules only)

### Layer 4: Integration Validation
**Process**: Ensures work from multiple agents integrates correctly
**Checks**: Type alignment, Jazz patterns, offline functionality, quality checks

## Quick Start

### Simple Single-File Task
For tasks in one file with minimal changes:
```
User: "Fix the handicap display formatting"
Claude: [Works directly, no orchestration needed]
```

### Complex Multi-File Task
For tasks touching 3+ files or multiple concerns:
```
User: "Add team scoring feature to games"

Orchestrator:
1. Decomposes into:
   - jazz-specialist: Design Team schema with Jazz patterns
   - lib-specialist: Implement team scoring calculations
   - app-specialist: Create team selection and display UI

2. Coordinates execution (parallel where possible)

3. Validates integration

4. Synthesizes results
```

## Spicy Golf Architecture Principles

### Local-First is CRITICAL
- App works offline (golf courses often have poor connectivity)
- User data stored in Jazz CoMaps/CoLists
- API only for external data (course info, weather)
- If it can work offline, use Jazz, NOT the API

### Jazz Patterns are NON-NEGOTIABLE
- Use `$jazz.has("field")` NOT `!obj.field`
- Always `ensureLoaded` after `upsertUnique`
- Load lists level-by-level, not with nested $each
- Create CoMaps with required fields only, set optional fields after

**These aren't suggestions - they prevent data loss!**

### Quality is Enforced
- `bun format` must pass
- `bun lint` must pass  
- `bun tsc` must pass
- Pre-commit hooks enforce these

## Usage Patterns

### Pattern 1: New Feature (Jazz + UI)

**Example**: Add player statistics tracking

```bash
You: "Add player statistics - fairways hit, greens in regulation, putts per hole"

Orchestrator analyzes:
- Touches: Jazz schema, business logic, UI
- Requires: Schema design, calculations, display components

Orchestrator decomposes:

Wave 1 (Foundation):
  - jazz-specialist: Add stats fields to Round schema
  - lib-specialist: Create statistics calculation utilities

Wave 2 (Implementation):
  - app-specialist: Build statistics display UI

Wave 3 (Quality):
  - Verify offline functionality
  - Run bun format, lint, tsc
  - Check Jazz loading patterns
```

### Pattern 2: External Data Integration

**Example**: Fetch course data from external API

```bash
You: "Add ability to search for and import golf course data"

Orchestrator decomposes:

Wave 1:
  - api-specialist: Implement course search endpoint
  - lib-specialist: Define Course types

Wave 2:
  - app-specialist: Build course search UI

Wave 3:
  - Verify offline behavior (show cached courses)
  - Quality checks
```

### Pattern 3: Jazz Schema Evolution

**Example**: Add teams feature to games

```bash
You: "Add teams to games - players grouped into teams for team scoring"

Orchestrator decomposes:

Sequential (dependencies):
  1. jazz-specialist: Design Team schema, avoid circular refs
  2. lib-specialist: Team scoring calculations
  3. app-specialist: Team selection and scoring UI
  4. Quality checks
```

## Handoff Protocol

When agents collaborate, they use structured handoffs:

```json
{
  "from": "jazz-specialist",
  "to": "app-specialist",
  "artifacts": {
    "schema": "Team CoMap with players CoList",
    "types": "exported from packages/lib",
    "loading_pattern": "await team.$jazz.ensureLoaded({ resolve: { players: true } })"
  },
  "constraints": [
    "Use Unistyles for styling",
    "Must work offline",
    "No useState for Jazz data"
  ]
}
```

## Context Isolation

Each agent loads **only relevant rules**:

### app-specialist context:
- `architecture.xml` (local-first, monorepo structure)
- `code-typescript.xml` (no any, interfaces, etc.)
- `jazz.xml` (Jazz patterns and best practices)

**Does NOT load**:
- API-specific details
- Business logic implementation details

**Result**: Clean context, focused implementation, no pollution

## Wave-Based Deployment

For large tasks, deploy agents in waves:

```typescript
Wave 1 (Foundation):
  - Jazz schema design
  - Type definitions
  - Business logic

Wave 2 (Core Implementation):
  - UI components
  - Data loading patterns
  - API endpoints (if needed)

Wave 3 (Integration):
  - Offline functionality verification
  - Quality checks (format, lint, tsc)
  - Jazz pattern validation

Between each wave:
  - Synthesize results
  - Validate interfaces
  - Clean transient context
  - Update next wave with contracts
```

## Integration Validation

After multi-agent tasks, validate:

```bash
✓ Type alignment across packages (lib types used by app)
✓ Jazz patterns followed ($jazz.has, ensureLoaded, etc.)
✓ Offline functionality works
✓ Quality checks pass (format, lint, tsc)
✓ No `any` or `unknown` types
✓ Unistyles used (no hardcoded colors)
✓ No useState for Jazz data
```

## When to Use Which Agent

### orchestrator
- 3+ files affected
- Cross-package changes
- New features
- Architectural decisions

### app-specialist  
- React Native components (packages/app)
- UI/UX implementation
- Jazz data loading and display
- Navigation
- Unistyles styling

### jazz-specialist
- Jazz schema design
- CoMap/CoList structures
- Data ownership patterns
- Loading pattern optimization
- Circular dependency resolution

### api-specialist
- External data endpoints (packages/api)
- Course data, weather, etc.
- Third-party integrations
- Server-side validation

### lib-specialist
- Shared types and interfaces (packages/lib)
- Business logic (handicap, scoring calculations)
- Validation functions
- Framework-agnostic utilities

## Real-World Example

### Task: "Add stroke play scoring with handicaps"

**Orchestrator Analysis**:
- Complexity: High (scoring system, handicap integration, UI)
- Packages: lib, app, possibly jazz
- Estimated scope: 10+ files

**Decomposition**:

```
Wave 1 - Foundation (Parallel):
├─ lib-specialist
│  └─ Implement stroke play scoring calculation
│     - Net score with handicap
│     - Leaderboard sorting
│     - Tie-breaking rules
│
└─ jazz-specialist
   └─ Verify Game schema supports stroke play
      - Add scoreFormat field if needed
      - Ensure proper loading patterns

Wave 2 - UI Implementation (After Wave 1):
└─ app-specialist
   ├─ Create stroke play scorecard UI
   ├─ Leaderboard display
   ├─ Handicap-adjusted scoring display
   └─ Use Unistyles for styling

Wave 3 - Quality (After Wave 2):
├─ Verify offline functionality
│  - Scores calculate without network
│  - Jazz sync when back online
│
└─ Quality checks
   ├─ bun format (all packages)
   ├─ bun lint (all packages)  
   └─ bun tsc (all packages)
```

**Handoffs**:
1. lib → app: Scoring calculation functions + types
2. jazz → app: Schema structure + loading patterns
3. All → Quality: Verify integration

**Result**:
- Clear architectural boundaries
- No context pollution
- Parallel execution in Wave 1
- Guaranteed offline functionality
- Quality checks ensure no broken builds

## Benefits

### Context Efficiency
- **Traditional**: 500,000+ tokens for partial success
- **Orchestrated**: 110,000 tokens for complete success
- **Savings**: 78% fewer tokens

### Architectural Integrity
- Orchestrator maintains local-first vision
- Specialists can't bypass Jazz patterns
- Quality checks enforced across all agents
- Offline functionality guaranteed

### Parallelization
- Independent tasks run concurrently
- Wave-based for dependencies
- 10x velocity improvement

### Quality
- Automated quality checks
- Jazz pattern validation
- Offline functionality testing
- No shortcuts on architecture

## Common Pitfalls to Avoid

### ❌ Don't: Use API for user data
**Why**: Violates local-first principle, breaks offline functionality

### ❌ Don't: Skip Jazz patterns ($jazz.has, etc.)
**Why**: Causes data loss and sync bugs - these are requirements, not suggestions

### ❌ Don't: Use useState for Jazz data
**Why**: Creates sync bugs and unnecessary complexity

### ❌ Don't: Skip quality checks
**Why**: Breaks pre-commit hooks, frustrates developer workflow

### ❌ Don't: Hardcode colors instead of Unistyles
**Why**: Inconsistent theming, hard to maintain

### ✓ Do: Use orchestrator for 3+ file tasks
### ✓ Do: Follow Jazz patterns religiously
### ✓ Do: Ensure offline functionality
### ✓ Do: Run quality checks (format, lint, tsc)

## Measuring Success

Track these metrics:

1. **Token Efficiency**: Tokens used per feature (expect 60-70% reduction)
2. **Completion Rate**: Features completed vs abandoned (expect 100% vs ~40%)
3. **Jazz Pattern Violations**: Issues caught by validation (expect 0)
4. **Offline Functionality**: Features that work offline (expect 100%)
5. **Quality Check Failures**: Pre-commit hook failures (expect 0)

## Next Steps

1. **Read agent definitions** in `.claude/agents/`
2. **Try a simple orchestrated task** (3-5 files)
3. **Use handoff protocol** for agent coordination
4. **Run integration validation** after completion
5. **Scale to complex features** (15+ files)

## Spicy Golf Specific Reminders

### Always Remember:
- 📱 **Mobile-first**: React Native app is the primary interface
- 🔌 **Offline-first**: Must work without network (golf courses!)
- 🎵 **Jazz patterns**: Follow them religiously to avoid data loss
- 🎨 **Unistyles**: Theme system for consistent UI
- ✅ **Quality checks**: format, lint, tsc must pass

### Architecture Decisions:
- User data → Jazz (games, players, scores, rounds)
- External data → API (course info, weather)
- Shared logic → lib package (calculations, types)
- UI → app package (React Native components)

Remember: The orchestrator conducts the symphony. The specialists play their instruments. Integration validation ensures harmony. And Jazz patterns prevent data loss!
