# Error Handling Skill

This skill covers error tracking and reporting using PostHog.

## Architecture

Spicy Golf uses PostHog for error tracking with session replay and analytics.

## When to Use What

| Scenario | Use |
|----------|-----|
| React component with logged-in user | `useErrorReporter` hook |
| Utility function / non-React code | `reportError` function |
| React component crashes | `ErrorBoundary` (auto-catches) |
| User-facing error display | `ErrorDisplay` component |
| Form validation errors | `InlineError` component |

## useErrorReporter Hook

Use in React components when the user is authenticated. Reports to PostHog with user context.

```typescript
import { useErrorReporter } from "@/hooks/useErrorReporter";

function MyComponent() {
  const { reportError, withErrorReporting } = useErrorReporter();

  const handleSave = async () => {
    try {
      await saveData();
    } catch (error) {
      reportError(error, {
        source: "MyComponent.handleSave",
        severity: "error",
        context: { dataId: "123" },
      });
    }
  };

  // Or wrap async functions automatically
  const wrappedFetch = withErrorReporting(fetchData, "fetchData");
}
```

### Options

```typescript
interface ReportErrorOptions {
  type?: string;        // Error type (e.g., "NetworkError")
  source?: string;      // Component/function name
  severity?: "error" | "warning" | "info";
  context?: Record<string, unknown>;  // Additional data
  logToConsole?: boolean;  // Defaults to __DEV__
}
```

## reportError Utility

Use outside React components or when user isn't logged in. Logs to console.error which PostHog autocaptures.

```typescript
import { reportError } from "@/utils/reportError";

export async function createRound(game: Game, player: Player) {
  try {
    // ... logic
  } catch (error) {
    reportError(error as Error, {
      source: "createRound",
      context: {
        gameId: game.$jazz.id,
        playerId: player.$jazz.id,
      },
    });
    return null;
  }
}
```

## ErrorBoundary

Wraps the entire app to catch unhandled React component errors. Uses `ErrorDisplay` for UI and `reportError` for logging.

```tsx
// Already set up in App.tsx
<ErrorBoundary>
  <PostHogProvider>
    {/* ... rest of app */}
  </PostHogProvider>
</ErrorBoundary>
```

## ErrorDisplay Component

User-facing error display with optional technical details for dev/admin.

```tsx
import { ErrorDisplay, InlineError } from "@/components/Error";

// Full error display
<ErrorDisplay
  error={error}
  title="Something went wrong"  // Optional, has golf-themed default
  showDetailsToggle={__DEV__}   // Show "Show Details" link
  onRetry={() => refetch()}     // Optional retry button
  onDismiss={() => setError(null)}  // Optional dismiss button
  compact={false}               // Compact mode for inline use
/>

// Inline form error
<InlineError message="Invalid email address" />
```

## PostHog Integration

PostHog is configured in `packages/app/src/providers/posthog/index.tsx`:

- **Session replay**: Enabled with masked text/images
- **Error autocapture**: Uncaught exceptions, unhandled rejections, console.error
- **Touch capture**: Enabled
- **Screen capture**: Disabled (requires NavigationContainer)

PostHog receives:
- `$exception_message`: Error message
- `$exception_type`: Error name/type
- `$exception_source`: Component/function
- `$exception_stack_trace`: Stack trace (when available)
- `jazz_account_id`: User's Jazz account ID (from useErrorReporter only)
- `severity`, `platform`, `app_version`
- Any custom `context` properties

## Best Practices

1. **Always include source**: Makes debugging easier
   ```typescript
   reportError(error, { source: "ComponentName.methodName" });
   ```

2. **Add context for Jazz operations**: Include relevant IDs
   ```typescript
   reportError(error, {
     source: "addPlayerToGame",
     context: { gameId: game.$jazz.id, playerId: player.$jazz.id },
   });
   ```

3. **Use appropriate severity**:
   - `error`: Unexpected failures that need attention
   - `warning`: Handled issues, potential problems
   - `info`: Notable events for debugging

4. **Don't swallow errors silently**: Always log, even if recovering
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     reportError(error, { source: "riskyOperation", severity: "warning" });
     // Continue with fallback behavior
   }
   ```

## Provider Setup

ErrorBoundary wraps PostHog for maximum coverage:

```tsx
// App.tsx
<ErrorBoundary>
  <PostHogProvider>
    <SafeAreaProvider>
      <NavigationProvider>
        <ReactQueryProvider>
          <JazzAndAuth>
            <RootNavigator />
          </JazzAndAuth>
        </ReactQueryProvider>
      </NavigationProvider>
    </SafeAreaProvider>
  </PostHogProvider>
</ErrorBoundary>
```

## Files Reference

| File | Purpose |
|------|---------|
| `packages/lib/schema/errors.ts` | ErrorSeverity type |
| `packages/app/src/components/Error.tsx` | ErrorDisplay and InlineError components |
| `packages/app/src/components/ErrorBoundary.tsx` | Root-level error boundary |
| `packages/app/src/hooks/useErrorReporter.ts` | Hook for PostHog logging with user context |
| `packages/app/src/utils/reportError.ts` | Standalone error reporting function |
| `packages/app/src/providers/posthog/index.tsx` | PostHog provider configuration |
