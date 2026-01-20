# Dynamic Error Messages via Jazz Worker Account

## Goal
Add the ability to manage error messages through the Jazz worker account's public catalog. Messages sync automatically to all users and can be updated without app rebuilds.

## Current State
- `ErrorBoundary.tsx:88` has hardcoded title: `"Oops! The app hit into the deep rough."`
- `ErrorDisplay` component has default: `"Sorry, the app just made a double bogey."`
- No mechanism to update messages without app rebuild

## Approach: Jazz Catalog with Seed Import

Use the existing Jazz worker account catalog pattern:
1. Add `errorMessages` field to `GameCatalog` schema
2. Create seed file with messages by language
3. Import via existing web dashboard flow
4. App hook fetches from catalog with hardcoded fallback

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│               data/seed/messages/en.json                │
│  Source of truth for error messages by language         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (import via web dashboard)
┌─────────────────────────────────────────────────────────┐
│       Jazz Worker Account (GameCatalog.errorMessages)   │
│  Public catalog synced to all users automatically       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (useErrorMessages hook)
┌─────────────────────────────────────────────────────────┐
│                   Mobile App                            │
│  ErrorBoundary uses catalog message or fallback         │
└─────────────────────────────────────────────────────────┘
```

## Schema Design

### New: `packages/lib/schema/messages.ts`

```typescript
import { co, z } from "jazz-tools";

export const ErrorMessage = co.map({
  key: z.string(),      // e.g., "error_boundary_title"
  message: z.string(),  // The actual message text
});

export const ListOfErrorMessages = co.list(ErrorMessage);

// Messages organized by locale code (e.g., "en_US", "en_GB", "es_ES", "es_MX")
export const ErrorMessagesByLocale = co.record(z.string(), ListOfErrorMessages);
```

### Locale Strategy

Use standard locale codes: `{language}_{region}` (e.g., `en_US`, `en_GB`, `es_ES`, `es_MX`)

**Fallback chain**:
1. Exact locale match: `en_GB`
2. Language fallback: `en` (if `en_GB` not found)
3. Default locale: `en_US`
4. Hardcoded defaults (offline/not loaded)

### Update: `packages/lib/schema/catalog.ts`

```typescript
export const GameCatalog = co.map({
  specs: MapOfGameSpecs,
  options: co.optional(MapOfOptions),
  players: co.optional(MapOfPlayers),
  courses: co.optional(MapOfCourses),
  games: co.optional(MapOfGames),
  errorMessages: co.optional(ErrorMessagesByLocale),  // NEW
});
```

## Seed Data

### New: `data/seed/messages/en_US.json`

```json
{
  "locale": "en_US",
  "messages": [
    { "key": "error_boundary_title", "message": "Oops! The app hit into the deep rough." },
    { "key": "error_boundary_title", "message": "Sorry, the app just made a double bogey." },
    { "key": "error_boundary_title", "message": "Looks like we shanked that one." },
    { "key": "error_boundary_title", "message": "The app took an unplayable lie." },
    { "key": "error_boundary_title", "message": "We hit it in the water on that one." }
  ]
}
```

Future files: `en_GB.json`, `es_ES.json`, `es_MX.json`, etc.

## Implementation Steps

| # | Step | Files |
|---|------|-------|
| 1 | Create ErrorMessage schema | `packages/lib/schema/messages.ts` |
| 2 | Add errorMessages to GameCatalog | `packages/lib/schema/catalog.ts` |
| 3 | Export from schema index | `packages/lib/schema/index.ts` |
| 4 | Create seed file for en_US | `data/seed/messages/en_US.json` |
| 5 | Add seed loader for messages | `packages/api/src/utils/seed-loader.ts` |
| 6 | Add import function for messages | `packages/api/src/lib/catalog.ts` |
| 7 | Add messages checkbox to web import | `packages/web/src/App.tsx` |
| 8 | Create useErrorMessages hook | `packages/app/src/hooks/useErrorMessages.ts` |
| 9 | Update ErrorBoundary to use hook | `packages/app/src/components/ErrorBoundary.tsx` |
| 10 | Run quality checks | - |

## Key Files to Modify

### `packages/api/src/utils/seed-loader.ts`
Add `loadSeedMessages()` function:
```typescript
export interface SeedMessageFile {
  language: string;
  messages: Array<{ key: string; message: string }>;
}

export async function loadSeedMessages(): Promise<Map<string, SeedMessageFile>> {
  const messages = new Map<string, SeedMessageFile>();
  const MESSAGES_PATH = join(SEED_PATH, "messages");
  // Load all *.json files from data/seed/messages/
  // Map by language code
  return messages;
}
```

### `packages/api/src/lib/catalog.ts`
Add `importErrorMessages()` function:
```typescript
export async function importErrorMessages(
  workerAccount: co.loaded<typeof PlayerAccount>,
  catalog: GameCatalog,
): Promise<{ created: number; updated: number }> {
  // Load from seed, upsert into catalog.errorMessages
}
```

### `packages/app/src/hooks/useErrorMessages.ts`
```typescript
const DEFAULT_ERROR_TITLES = [
  "Oops! The app hit into the deep rough.",
  "Sorry, the app just made a double bogey.",
];

// Get language prefix from locale (e.g., "en_US" -> "en")
function getLanguageFromLocale(locale: string): string {
  return locale.split("_")[0];
}

export function useErrorMessages(key: string, locale = "en_US") {
  const { account: workerAccount } = useJazzWorker({
    resolve: { profile: { catalog: { errorMessages: {} } } },
  });

  const errorMessages = workerAccount?.profile?.catalog?.errorMessages;
  if (!errorMessages?.$isLoaded) {
    return DEFAULT_ERROR_TITLES[Math.floor(Math.random() * DEFAULT_ERROR_TITLES.length)];
  }

  // Fallback chain: exact locale -> language only -> en_US -> defaults
  const language = getLanguageFromLocale(locale);
  const messageLists = [
    errorMessages[locale],           // e.g., "en_GB"
    errorMessages[language],         // e.g., "en"
    errorMessages["en_US"],          // default locale
  ];

  for (const messages of messageLists) {
    if (!messages?.$isLoaded) continue;
    const matching = messages.filter(m => m?.$isLoaded && m.key === key);
    if (matching.length > 0) {
      return matching[Math.floor(Math.random() * matching.length)].message;
    }
  }

  return DEFAULT_ERROR_TITLES[Math.floor(Math.random() * DEFAULT_ERROR_TITLES.length)];
}
```

### `packages/app/src/components/ErrorBoundary.tsx`
Since ErrorBoundary is a class component (React requirement), create a wrapper:
```typescript
// Wrapper component to use hook
function ErrorBoundaryTitle() {
  const title = useErrorMessages("error_boundary_title");
  return title;
}

// In ErrorBoundary render, use static default since hooks can't be used in class
// The hook will be used by ErrorDisplay component instead
```

**Alternative**: Pass title as prop from a functional wrapper, or move the random selection to ErrorDisplay.

## Jazz Patterns Applied

- Use `$jazz.has("errorMessages")` before initializing
- Use `$isLoaded` checks before accessing nested data
- Use shallow resolve in hook, don't over-fetch
- Fallback to defaults when catalog not loaded (offline-first)

## Verification

1. `bun tsc` - TypeScript compiles
2. `./scripts/code-quality.sh` - Lint/format pass
3. Start web dashboard, import with "Error Messages" checked
4. Verify via Jazz inspector: `bun run jazz catalog` (need to add messages view)
5. App loads without crash
6. Force error in dev, verify random message from catalog appears

## Future Expansion

- Add more locales: `en_GB.json`, `es_ES.json`, `es_MX.json`, etc.
- Add more message keys: `error_network`, `error_sync`, etc.
- Web UI to edit messages directly (admin only)
- Detect device locale automatically via `react-native-localize`
