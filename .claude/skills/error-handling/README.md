# Error Handling Skill

This skill covers error tracking and reporting using the hybrid Jazz + PostHog approach.

## Architecture

Spicy Golf uses a **two-tier error reporting system**:

1. **Jazz CoFeed** - Local-first error storage (offline-safe, syncs when online)
2. **PostHog** - Analytics, session replay, and error aggregation

## When to Use What

| Scenario | Use |
|----------|-----|
| React component with logged-in user | `useErrorReporter` hook |
| Utility function / non-React code | `reportError` function |
| User-facing error display | `ErrorDisplay` component |
| Form validation errors | `InlineError` component |

## useErrorReporter Hook

Use in React components when the user is authenticated. Logs to both Jazz CoFeed and PostHog.

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

## Jazz ErrorLog Schema

Errors are stored in `PlayerAccountRoot.errorLog` as a CoFeed:

```typescript
// packages/lib/schema/errors.ts
const ErrorEntry = co.map({
  message: z.string(),
  type: z.string().optional(),
  stack: z.string().optional(),
  source: z.string().optional(),
  severity: z.enum(["error", "warning", "info"]).optional(),
  context: z.string().optional(),  // JSON stringified
  sentToPostHog: z.boolean().optional(),
  platform: z.string().optional(),
  appVersion: z.string().optional(),
});

const ErrorLog = co.feed(ErrorEntry);
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

PostHog is wrapped around the entire app for maximum coverage:

```tsx
// App.tsx
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
```

## Files Reference

| File | Purpose |
|------|---------|
| `packages/lib/schema/errors.ts` | Jazz ErrorEntry and ErrorLog schema |
| `packages/app/src/components/Error.tsx` | ErrorDisplay and InlineError components |
| `packages/app/src/hooks/useErrorReporter.ts` | Hook for Jazz + PostHog logging |
| `packages/app/src/utils/reportError.ts` | Standalone error reporting function |
| `packages/app/src/providers/posthog/index.tsx` | PostHog provider configuration |
