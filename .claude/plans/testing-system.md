# Testing System for Spicy Golf

This document outlines the testing infrastructure to prevent regressions as we add more games, options, scoring methods, and UI features.

---

## Overview

Two-tier testing strategy:

1. **Unit/Integration Tests** (fast, CI-friendly): Test scoring engine with JSON fixtures transformed to `ScoringContext`
2. **E2E Tests** (Maestro, self-hosted runner): Full app flows in dev Jazz environment

Single source fixtures (human-readable JSON) feed both test types.

---

## 1. Fixture Format

Human-readable JSON that mirrors how data is entered in the app. Organized by game type.

### Location

```
tests/fixtures/
└── five_points/
    ├── basic_game.json
    ├── with_doubles.json
    └── birdie_bbq_scenario.json
```

### Schema

```json
{
  "name": "Five Points - Basic Game",
  "description": "Tests basic scoring with prox and team points",
  "spec": "five_points",
  
  "course": {
    "name": "Test Course",
    "tee": "Blue",
    "holes": [
      { "hole": 1, "par": 4, "handicap": 5, "yards": 385 },
      { "hole": 2, "par": 5, "handicap": 11, "yards": 520 }
    ]
  },
  
  "players": [
    { "id": "p1", "name": "Alice", "handicapIndex": 10.5 },
    { "id": "p2", "name": "Bob", "handicapIndex": 15.2 },
    { "id": "p3", "name": "Carol", "handicapIndex": 8.0 },
    { "id": "p4", "name": "Dave", "handicapIndex": 12.3 }
  ],
  
  "teams": {
    "1": ["p1", "p2"],
    "2": ["p3", "p4"]
  },
  
  "options": {
    "low_ball": 2,
    "low_total": 2,
    "prox": 1
  },
  
  "holes": {
    "1": {
      "scores": {
        "p1": { "gross": 4 },
        "p2": { "gross": 5 },
        "p3": { "gross": 4 },
        "p4": { "gross": 6 }
      },
      "junk": { "prox": "p1" },
      "multipliers": {}
    },
    "2": {
      "scores": {
        "p1": { "gross": 5 },
        "p2": { "gross": 6 },
        "p3": { "gross": 4 },
        "p4": { "gross": 5 }
      },
      "junk": { "prox": "p3", "birdie": ["p3"] },
      "multipliers": { "1": ["double"], "2": ["double_back"] }
    }
  },
  
  "expected": {
    "holes": {
      "1": {
        "teams": {
          "1": { "lowBall": 3, "total": 7, "points": 5 },
          "2": { "lowBall": 4, "total": 8, "points": 0 }
        },
        "players": { "p1": { "junk": ["prox"] } }
      },
      "2": {
        "holeMultiplier": 4,
        "teams": { "1": { "points": 0 }, "2": { "points": 28 } }
      }
    },
    "cumulative": {
      "teams": { "1": { "pointsTotal": 5 }, "2": { "pointsTotal": 28 } }
    }
  }
}
```

### Tasks

- [ ] Create TypeScript interfaces for fixture schema (`tests/lib/fixture-types.ts`)
- [ ] Create Zod validation schema (`tests/lib/fixture-schema.ts`)
- [ ] Create first fixture: `tests/fixtures/five_points/basic_game.json`

---

## 2. Mock Jazz Objects

The scoring pipeline checks `$isLoaded` and accesses `$jazz.id`. Create lightweight mock objects that satisfy these requirements without real Jazz.

### Approach

Factory functions that create objects with:
- `$isLoaded: true`
- `$jazz: { id: "mock_xxx", has: () => true }`
- Array-like behavior for CoLists (with `[Symbol.iterator]`)

### Files

| File | Purpose |
|------|---------|
| `tests/lib/mock-jazz.ts` | Mock object factories |

### Factory Functions

```typescript
function createMockGame(fixture: Fixture): MockGame
function createMockGameSpec(specName: string): MockGameSpec
function createMockRound(playerId: string, scores: Record<string, HoleScores>): MockRound
function createMockTeam(teamId: string, playerIds: string[]): MockTeam
function createMockMapOfOptions(options: Record<string, OptionValue>): MockMapOfOptions
```

### Tasks

- [ ] Create `tests/lib/mock-jazz.ts` with factory functions
- [ ] Test that mock objects pass `$isLoaded` checks in pipeline
- [ ] Handle nested structures (Round → Scores, Team → RoundToTeam → RoundToGame)

---

## 3. Fixture Transformer

Convert human-readable fixtures into `ScoringContext` objects for the scoring pipeline.

### Flow

```
Fixture JSON
    ↓
1. Load spec from data/seed/specs/{spec}.json
2. Merge fixture options with spec defaults
3. Create mock Jazz objects (Game, Rounds, Teams, Options)
4. Calculate course handicaps from handicapIndex + tee data
5. Build ScoringContext
    ↓
ScoringContext (ready for scoring pipeline)
```

### Files

| File | Purpose |
|------|---------|
| `tests/lib/spec-loader.ts` | Load specs from `data/seed/` |
| `tests/lib/fixture-transformer.ts` | Main transformation logic |

### Spec Loader

Loads game specs and merges with reusable options:

```typescript
function loadSpec(specName: string): LoadedSpec {
  // Read data/seed/specs/{specName}.json
  // For each option reference, load from data/seed/options/{option}.json
  // Merge junk values with spec-level overrides
}
```

### Tasks

- [ ] Create `tests/lib/spec-loader.ts`
- [ ] Create `tests/lib/fixture-transformer.ts`
- [ ] Handle handicap calculation (use existing `calculateCourseHandicap` from lib)
- [ ] Generate mock hole info from course.holes

---

## 4. Unit/Integration Test Harness

Bun tests that load fixtures, transform to `ScoringContext`, run scoring pipeline, and assert on expected values.

### Structure

```typescript
// tests/integration/five_points.test.ts
import { describe, it, expect } from "bun:test";
import { loadFixture, transformFixture } from "../lib";
import { score } from "@spicygolf/lib/scoring";

describe("Five Points", () => {
  describe("basic_game", () => {
    const fixture = loadFixture("five_points/basic_game.json");
    const ctx = transformFixture(fixture);
    const scoreboard = score(ctx.game);
    
    it("hole 1 team 1 points", () => {
      expect(scoreboard.holes["1"].teams["1"].points).toBe(5);
    });
    
    it("hole 1 prox awarded to p1", () => {
      const junk = scoreboard.holes["1"].players["p1"].junk;
      expect(junk.some(j => j.name === "prox")).toBe(true);
    });
    
    it("cumulative team 2 points", () => {
      expect(scoreboard.cumulative.teams["2"].pointsTotal).toBe(28);
    });
  });
});
```

### Dynamic Test Generation

Optionally generate test cases from fixture `expected` block:

```typescript
function generateTestsFromFixture(fixture: Fixture): TestCase[] {
  // Walk fixture.expected and create assertions
}
```

### Files

| File | Purpose |
|------|---------|
| `tests/lib/test-helpers.ts` | Fixture loading, assertion helpers |
| `tests/integration/five_points.test.ts` | Five Points test suite |

### Tasks

- [ ] Create `tests/lib/test-helpers.ts`
- [ ] Create `tests/integration/five_points.test.ts`
- [ ] Verify first fixture passes all assertions
- [ ] Add npm script: `bun test:integration`

---

## 5. E2E Infrastructure (Maestro)

Full app flows using Maestro, hitting real Jazz in the dev environment.

### Jazz Test Account

Dedicated test account in dev Jazz environment:

```typescript
// tests/e2e/config/test-account.ts
export const TEST_ACCOUNT = {
  passphrase: "test account spicy golf e2e ... (12 words)",
  // Store securely - environment variable or secrets manager
};
```

### Maestro Flow Structure

```yaml
# tests/e2e/flows/five_points/basic_game.yaml
appId: com.spicygolf.app
---
- launchApp:
    clearState: true

# Auth
- tapOn: "Get Started"
- inputText: ${TEST_PASSPHRASE}
- tapOn: "Continue"

# Create Game
- tapOn: "New Game"
- scrollUntilVisible: "Five Points"
- tapOn: "Five Points"
- tapOn: "Play"

# Add Players
- tapOn: "Add Player"
- inputText: "Alice"
# ... configure handicap, tee
- tapOn: "Save"

# Scoring
- tapOn: "Start Scoring"
- tapOn: "4"  # Score for hole 1
# ... continue per fixture

# Assertions
- tapOn: "Leaderboard"
- assertVisible: "Team 1: 5"
```

### Fixture to Maestro Converter

Script to generate Maestro steps from fixture JSON:

```typescript
function fixtureToMaestro(fixture: Fixture): MaestroFlow {
  // Generate steps for:
  // - Player setup
  // - Team configuration
  // - Score entry per hole
  // - Junk/multiplier toggles
  // - Leaderboard assertions
}
```

### Files

| File | Purpose |
|------|---------|
| `tests/e2e/config/test-account.ts` | Test account config |
| `tests/e2e/helpers/fixture-to-maestro.ts` | Maestro generator |
| `tests/e2e/flows/five_points/basic_game.yaml` | First E2E flow |

### Tasks

- [ ] Set up Maestro in project
- [ ] Create test Jazz account in dev environment
- [ ] Create `tests/e2e/config/test-account.ts`
- [ ] Create first Maestro flow manually
- [ ] Create `fixture-to-maestro.ts` converter
- [ ] Test locally on iOS simulator

---

## 6. CI Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test tests/integration

  e2e:
    runs-on: self-hosted  # macOS with iOS simulator
    steps:
      - uses: actions/checkout@v4
      - run: bun install
      - run: maestro test tests/e2e/flows
```

### Tasks

- [ ] Add GitHub Actions workflow
- [ ] Configure self-hosted runner for E2E (macOS)
- [ ] Add test scripts to package.json

---

## Task Checklist

### Phase 1: Foundation
- [ ] Create `tests/lib/fixture-types.ts`
- [ ] Create `tests/lib/fixture-schema.ts`
- [ ] Create `tests/fixtures/five_points/basic_game.json`

### Phase 2: Mock Jazz
- [ ] Create `tests/lib/mock-jazz.ts`
- [ ] Verify mocks satisfy `$isLoaded` checks

### Phase 3: Transformer
- [ ] Create `tests/lib/spec-loader.ts`
- [ ] Create `tests/lib/fixture-transformer.ts`
- [ ] Handle handicap calculations

### Phase 4: Test Harness
- [ ] Create `tests/lib/test-helpers.ts`
- [ ] Create `tests/integration/five_points.test.ts`
- [ ] Add `bun test:integration` script

### Phase 5: E2E Foundation
- [ ] Install Maestro
- [ ] Create test Jazz account
- [ ] Create first Maestro flow
- [ ] Test locally

### Phase 6: CI
- [ ] Add GitHub Actions workflow
- [ ] Configure self-hosted runner

---

## File Structure

```
tests/
├── fixtures/
│   └── five_points/
│       └── basic_game.json
├── lib/
│   ├── fixture-types.ts
│   ├── fixture-schema.ts
│   ├── mock-jazz.ts
│   ├── spec-loader.ts
│   ├── fixture-transformer.ts
│   └── test-helpers.ts
├── integration/
│   └── five_points.test.ts
└── e2e/
    ├── config/
    │   └── test-account.ts
    ├── helpers/
    │   └── fixture-to-maestro.ts
    └── flows/
        └── five_points/
            └── basic_game.yaml
```

---

## Reference Files

### Existing (Read-Only)
- `packages/lib/scoring/pipeline.ts` - Scoring engine entry
- `packages/lib/scoring/types.ts` - ScoringContext, Scoreboard types
- `packages/lib/schema/` - Jazz schema definitions
- `data/seed/specs/five_points.json` - Five Points spec
- `data/seed/options/*.json` - Reusable option definitions
- `packages/lib/utils/handicap.ts` - `calculateCourseHandicap`
