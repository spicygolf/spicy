# TypeScript Standards

TypeScript coding standards and React Native best practices for Spicy Golf.

## No Any Types

**Severity**: CRITICAL | **Enforcement**: BLOCKING

No `any` types. Use proper TypeScript types or create new interfaces/types as needed.

**Rationale**: Type safety is critical for catching bugs at compile time. `any` types bypass all type checking.

When encountering data without types, create proper interfaces or types. If the shape is truly unknown, use type guards and validation instead of `any`.

## No Unknown Types

**Severity**: CRITICAL | **Enforcement**: BLOCKING

Avoid `unknown` types. Use explicit types with proper type guards if needed.

**Rationale**: Unknown is just deferred any - we need explicit types. Casting to unknown defeats the purpose of type safety.

Instead of using `unknown`, create type guard functions that validate the shape of the data and return properly typed values.

## Stack Requirements

**Severity**: HIGH | **Enforcement**: STRICT

| Tool | Purpose |
|------|---------|
| Bun 1.3+ | Package manager (not npm/yarn/pnpm) |
| React Native | Mobile framework |
| TypeScript | Type system |
| Jazz Tools | Local-first database with sync |
| Biome | Formatting and linting |

Always use Bun for package management. Remove any `package-lock.json` or `yarn.lock` files if present.

## Style Guidelines

**Severity**: HIGH | **Enforcement**: STRICT

| Rule | Details |
|------|---------|
| Interfaces over types | Use interfaces for object shapes |
| Directory naming | Lowercase-dash (e.g., `auth-wizard`) |
| Named exports | No default exports |
| No enums | Use explicit types and maps instead |
| Functional components | For React/React Native (except Error Boundaries) |
| Strict mode | Always enabled |
| Pin dependencies | No `^` carets in package.json |

## Interfaces Over Types

**Severity**: HIGH | **Enforcement**: STRICT

Prefer interfaces over type aliases for object shapes. Types are for unions, intersections, and computed types.

```typescript
// GOOD: Interface for object shape
interface User {
  name: string;
  email: string;
}

// BAD: Type alias for object shape
type User = { name: string; email: string; }

// GOOD: Type for union
type Status = 'active' | 'inactive' | 'pending';
```

## No Enums

**Severity**: HIGH | **Enforcement**: STRICT

Do not use TypeScript enums. Use explicit types and maps instead.

```typescript
// BAD: Enum
enum Status { Active, Inactive, Pending }

// GOOD: Union type + Record
type Status = 'active' | 'inactive' | 'pending';
const StatusLabels: Record<Status, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending'
};
```

## Quality Checks Required

**Severity**: HIGH | **Enforcement**: STRICT

Code must pass format, lint, and type checking before completion:

```bash
bun format  # Format code with Biome
bun lint    # Run linter with Biome
bun tsc     # Type check with TypeScript
```

These are required for pre-commit hooks.

## React and React Native Best Practices

**Severity**: HIGH | **Enforcement**: STRICT

### Guidelines
- **Minimize `useEffect`**: Use it as a last resort
- **Named effect callbacks**: Use meaningful names for effect functions
- **No unnecessary comments**: Avoid commenting on effect behavior
- **Small components**: Favor small components over large ones
- **Multiple files**: Break functionality into multiple components/files
- **Declarative JSX**: Write declarative, not imperative code
- **`function` keyword**: Use for pure functions
- **Simple conditionals**: Avoid unnecessary curly braces
- **Functional only**: No class components (except Error Boundaries)

## Styling with Unistyles

**Severity**: MEDIUM | **Enforcement**: RECOMMENDED

Use React Native Unistyles for styling. Avoid string color constants.

- Use Unistyles theme system (see `app/src/utils/unistyles.ts`)
- There should be no or very few color string constants
- Reference theme colors instead of hardcoding values

## Named Exports Only

**Severity**: MEDIUM | **Enforcement**: RECOMMENDED

Use named exports exclusively. No default exports.

```typescript
// GOOD
export function myFunction() { }
export const MyComponent = () => { };

// BAD
export default function myFunction() { }
```

## Explicit Return Types

**Severity**: MEDIUM | **Enforcement**: RECOMMENDED

Always specify return types on functions, even if TypeScript can infer them.

**Rationale**: Makes API contracts explicit and prevents accidental breaking changes.

```typescript
// GOOD
function calculateScore(strokes: number, par: number): number {
  return strokes - par;
}

// BAD (return type inferred)
function calculateScore(strokes: number, par: number) {
  return strokes - par;
}
```

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
