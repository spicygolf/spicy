# Documentation Standards

Guidelines for markdown files, docstrings, and code documentation in Spicy Golf.

## Markdown Code Blocks

**Severity**: LOW | **Enforcement**: RECOMMENDED

Always specify a language identifier on fenced code blocks in markdown files.

```markdown
<!-- GOOD -->
```typescript
const x = 1;
```

<!-- GOOD for plain text/directory trees -->
```text
packages/
├── app/
└── lib/
```

<!-- BAD - no language specified -->
```
const x = 1;
```
```

This helps with syntax highlighting and satisfies markdownlint (MD040).

## Docstrings

**Severity**: MEDIUM | **Enforcement**: RECOMMENDED

Add JSDoc docstrings to exported functions and complex internal functions.

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

### When to Add Docstrings

- **Always**: Exported functions, especially in `packages/lib`
- **Always**: Complex business logic (scoring, settlement, handicaps)
- **Usually**: React hooks with non-obvious behavior
- **Optional**: Simple utility functions with self-explanatory names
- **Skip**: Internal helper functions that are only used in one place

### Docstring Content

- First line: Brief description of what the function does
- `@param` for each parameter with description
- `@returns` describing what is returned
- `@throws` if the function can throw (rare - prefer returning undefined)
- `@example` for complex functions (optional)

## README Files

**Severity**: LOW | **Enforcement**: RECOMMENDED

- Do NOT proactively create README files unless explicitly requested
- When creating READMEs, keep them concise and focused
- Use proper markdown formatting with headers, lists, and code blocks

## Code Comments

**Severity**: LOW | **Enforcement**: RECOMMENDED

- Avoid obvious comments that just restate the code
- Use comments for "why" not "what"
- Keep comments up to date when code changes

```typescript
// BAD: Obvious comment
// Increment counter by 1
counter += 1;

// GOOD: Explains why
// Reset to 1 because hole numbers are 1-indexed, not 0-indexed
holeIndex = 1;
```
