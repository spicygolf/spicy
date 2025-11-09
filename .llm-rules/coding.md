
## TypeScript Best Practices

- Use TypeScript for all code; prefer interfaces over types.
- Use lowercase with dashes for directories (e.g., `components/auth-wizard`).
- Use named exports for components & functions, not default exports.
- Avoid `any` and enums; use explicit types and maps instead.
- Avoid `unknown`; use explicit types.
- Use functional components with TypeScript interfaces.
- Enable strict mode in TypeScript for better type safety.
- Suggest the optimal implementation considering:
  - Performance impact
  - Maintenance overhead
  - Testing strategy
- Code examples should follow TypeScript best practices.

## React and React Native Best Practices

- Minimize the use of `useEffect`. They should be a last resort.
- Use named functions for `useEffect`s with a meaningful function name. Avoid adding unnecessary comments on effect behavior.
- Favor small components over large components.  Break functionality up into multiple components/files to avoid complex re-rendering issues.

## Syntax & Formatting

- Use the `function` keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.
- Use Biome for consistent code formatting and linting.
- When making changes, ensure the following commands still pass, as they need to for pre-commit hooks:
  - `bun format`
  - `bun lint`
  - `bun tsc`
