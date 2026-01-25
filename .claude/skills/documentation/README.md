# Documentation Standards

CodeRabbit requires **80% docstring coverage** on PRs. This skill ensures compliance.

## Docstrings (CRITICAL)

**Severity**: HIGH | **Enforcement**: REQUIRED for PR approval

When writing or modifying functions, **always add JSDoc docstrings to exported functions**.

```typescript
/**
 * Calculate the course handicap for a player.
 *
 * @param handicapIndex - The player's GHIN handicap index
 * @param tee - The tee being played (includes slope/rating)
 * @param holesPlayed - Which holes are being played
 * @returns The calculated course handicap, or undefined if calculation fails
 */
export function calculateCourseHandicap(
  handicapIndex: string,
  tee: Tee,
  holesPlayed: HolesPlayed,
): number | undefined {
  // ...
}
```

### When Docstrings Are Required

| Context | Required? |
|---------|-----------|
| Exported functions in `packages/lib` | **YES** |
| Exported functions in any package | **YES** |
| React hooks (`use*` functions) | **YES** |
| Complex business logic | **YES** |
| Simple private helper functions | No |
| Single-line arrow functions | No |

### Minimum Docstring Content

1. **First line**: Brief description of what the function does
2. **@param**: For each parameter (skip if self-evident AND few params)
3. **@returns**: What is returned (skip for void functions)

### Quick Templates

**Simple function:**
```typescript
/** Get the player's display name, falling back to "Unknown" if not set. */
export function getPlayerName(player: Player): string {
```

**Function with params:**
```typescript
/**
 * Format a score relative to par.
 *
 * @param score - The gross score
 * @param par - The hole's par value
 * @returns Formatted string like "+2" or "-1" or "E"
 */
export function formatScoreToPar(score: number, par: number): string {
```

## Markdown Code Blocks

Always specify a language identifier on fenced code blocks:

- Use `typescript` for TS code
- Use `text` for plain text, directory trees, ASCII diagrams
- Use `bash` for shell commands

## Code Comments

- Comment "why" not "what"
- Don't add obvious comments
- Keep comments up to date when code changes
