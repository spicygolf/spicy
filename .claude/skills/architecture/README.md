# Architecture Skills

Core architectural principles for Spicy Golf development.

## Local-First Architecture with Jazz Tools

**Severity**: CRITICAL | **Enforcement**: BLOCKING

Spicy Golf is a local-first application using Jazz Tools for data sync. The app works offline and syncs when online. Most functionality must work without API calls.

**Rationale**: Users need to track golf games in areas with poor connectivity. Local-first ensures app works anywhere.

### Requirements
- Use Jazz CoMaps and CoLists for all data storage
- Only call the API package for data that can't be stored locally
- Assume the device may be offline at any time
- Design features to work offline first, sync later
- See jazz-patterns skill for Jazz-specific patterns

## Git Workflow

**Commits**: Commit frequently after each completed step. Commits are local and reversible - they enable handoff and recovery.

**Review**: Before pushing, run the `code-reviewer` agent to check for Jazz pattern violations and architecture issues.

**Pushes**: Never push to a remote without explicitly asking the user first.

**Rationale**: Frequent commits support the orchestration pattern (handoff between sessions). Code review catches issues before they reach the shared repository. Pushes require permission because they affect others.

## Monorepo Structure

**Severity**: HIGH | **Enforcement**: STRICT

This is a monorepo with packages for different components:

| Package | Description | Tech Stack |
|---------|-------------|------------|
| `app` | React Native mobile application (main production app) | React Native, TypeScript, Jazz Tools, Unistyles |
| `api` | Backend API for data that can't be stored locally | ElysiaJS, TypeScript |
| `lib` | Shared utilities, types, and business logic | TypeScript |

When adding new code that could be reused across packages, place it in `packages/lib`. Never duplicate code between packages.

## Minimize Code, Maximize Modularity

**Severity**: HIGH | **Enforcement**: STRICT

Attempt to reduce the amount of code rather than add more. Prefer iteration and modularization over code duplication.

### Guidelines
- Look for existing code that can be reused or refactored
- Break complex functionality into smaller, reusable modules
- Delete dead code rather than commenting it out
- Avoid adding new files when existing ones can be enhanced

## No Unnecessary Comments

**Severity**: MEDIUM | **Enforcement**: RECOMMENDED

Do not add comments unless explicitly told to do so, or the code is sufficiently complex that it requires comments.

**Rationale**: Code should be self-documenting. Comments often become stale and misleading.

### Guidelines
- Write clear, self-explanatory code instead of adding comments
- Only add comments for complex algorithms or non-obvious business logic
- Use meaningful variable and function names instead of comments

## Testing Strategy

**Severity**: MEDIUM | **Enforcement**: RECOMMENDED

Tests must be run in a React Native environment. Don't ask to run tests as they require special setup.

When implementing features, consider testability but don't attempt to run tests yourself.

## API Usage Minimization

**Severity**: MEDIUM | **Enforcement**: RECOMMENDED

The app should call the API package sparingly, only for data that can't be stored locally or synced via Jazz.

**Rationale**: Local-first design means most functionality works offline.

Before adding an API call, verify that the data truly can't be handled locally with Jazz Tools.

## Quality Checks Required

Before any task is complete, these commands must pass:

```bash
bun format   # Code formatting with Biome
bun lint     # Linting with Biome  
bun tsc      # TypeScript type checking
```

All three are required for pre-commit hooks. Code that fails these checks cannot be committed.
