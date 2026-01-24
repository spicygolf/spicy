# Anti-Pattern: Running Scripts from /tmp

## The Problem

When debugging or testing, you might be tempted to write a quick script to `/tmp/` and run it. **Don't do this.**

Scripts in `/tmp/` cannot import from the monorepo packages (`spicylib`, etc.) because:
1. They're outside the workspace
2. Bun/Node can't resolve workspace dependencies from `/tmp/`
3. Even absolute paths fail because the package resolution context is wrong

## What Happens

```bash
# This will ALWAYS fail
cat > /tmp/debug.ts << 'EOF'
import { Game } from "spicylib/schema";  // ERROR: Cannot find module
// ... rest of script
EOF
bun run /tmp/debug.ts
```

Error: `Cannot find module 'spicylib/schema' from '/private/tmp/debug.ts'`

## What To Do Instead

### Option 1: Write a test file (PREFERRED)

Add a test to the appropriate `__tests__` directory:

```typescript
// packages/lib/scoring/__tests__/debug.test.ts
import { describe, it, expect } from "bun:test";
import { Game } from "../../schema";

describe("Debug", () => {
  it("checks whatever I need", () => {
    // Your debug code here
  });
});
```

Run with: `bun test --test-name-pattern "Debug"`

### Option 2: Add a script to package.json

For reusable scripts, add to the appropriate package:

```json
// packages/api/package.json
{
  "scripts": {
    "debug:game": "bun run src/scripts/debug-game.ts"
  }
}
```

### Option 3: Use the existing integration test

The integration test in `packages/lib/scoring/__integration__/five-points.test.ts` already connects to Jazz and loads real game data. Add your debug code there temporarily.

### Option 4: Console logging in the app

Add `console.log()` statements to the relevant hooks/components and check `/tmp/spicy-metro.log`.

## Remember

- Tests run in the correct workspace context
- Tests can import all monorepo packages
- Tests are discoverable and can be kept for regression testing
- `/tmp/` scripts are throwaway and waste time when they fail to import
