# E2E Testing with Maestro

End-to-end tests for Spicy Golf using [Maestro](https://maestro.mobile.dev/).

## Quick Start

### Run a test locally

```bash
# Full test (from clean state)
./tests/e2e/scripts/run-ios-local.sh five_points/game_0/main.yaml

# Continue from current app state (dev convenience)
./tests/e2e/scripts/run-ios-local.sh five_points/game_0/continue.yaml
```

### Regenerate flows after DSL changes

```bash
bun e2e:generate
```

### Verify generated files match DSL (CI check)

```bash
bun e2e:check        # Check only
bun e2e:check --fix  # Regenerate if out of sync
```

## DSL Format

The DSL is a human-readable format for defining test fixtures. It's the **source of truth** - all JSON and YAML files are generated from it.

### Example DSL

```dsl
# Five Points - Full Game E2E Test
name: Five Points Full Game
desc: Comprehensive E2E test
spec: five_points
priority: smoke
tags: scoring junk multipliers

# Players: id name handicap [override]
# Plus handicaps use + prefix (e.g., +0.9)
players: p1 Brad 5.1 [5.1], p2 Scott 4.1, p3 Tim +0.9, p4 Eric 12.9

# Course: name | tee | rating/slope
course: Druid Hills Golf Club | Blue | 71.8/134

# Hole definitions: hole-par-handicap-yards
holes: 1-4-3-444, 2-4-7-392, ...

# Hole scoring: (teams) | scores | junk | multipliers
h1: (p1 p2) vs (p3 p4) | 4 5 5 6
h2: | 5 6 3 5 | birdie:p3
h3: | 3 4 3 4 | prox:p1
h4: | 4 5 5 5 | | t1:double
```

### DSL Syntax Reference

| Line | Format | Example |
|------|--------|---------|
| Name | `name: <text>` | `name: Five Points Full Game` |
| Spec | `spec: <id>` | `spec: five_points` |
| Players | `players: id name handicap [override], ...` | `players: p1 Brad 5.1 [5.1], p2 Tim +0.9` |
| Course | `course: name \| tee \| rating/slope` | `course: Druid Hills \| Blue \| 71.8/134` |
| Holes | `holes: hole-par-hdcp-yards, ...` | `holes: 1-4-3-444, 2-4-7-392` |
| Scoring | `hN: [teams] \| scores \| [junk] \| [multipliers]` | `h1: (p1 p2) vs (p3 p4) \| 4 5 5 6` |

### Handicap Syntax

- Regular: `5.1` → handicapIndex = 5.1
- Plus: `+0.9` → handicapIndex = -0.9 (stored as negative)
- Override: `[5.1]` → sets handicapOverride for manual adjustment

## Generated Files

### JSON Fixture (`game.json`)

Generated from DSL, contains structured test data:
- Players with handicap indexes
- Course with holes (par, handicap, yards)
- Hole-by-hole scores, junk, and multipliers
- Team assignments

### YAML Flows

Generated from JSON fixture:
- Maestro commands for UI interactions
- Calculated pops (handicap strokes) per hole
- Assertions for shots column, etc.

## Pops Calculation

The generator calculates pops (handicap strokes) for each player on each hole:

1. Calculate course handicap: `round(handicapIndex × slope / 113)`
2. Find lowest course handicap among all players
3. Calculate shots off: `courseHandicap - lowestCourseHandicap`
4. For each hole: `pops = shotsOff >= holeHandicap ? 1 : 0`

This assumes `handicap_index_from = "low"` (Five Points default).

### Example

With slope 134:
- Brad: 5.1 → course 6 → shots 7 → gets pop on holes with hdcp ≤ 7
- Tim: +0.9 → course -1 → shots 0 → no pops (lowest)

## Adding New Tests

1. Create a new DSL file: `tests/e2e/fixtures/<spec>/<game_N>/game.dsl`
2. Regenerate: `bun e2e:generate`
3. Run: `./tests/e2e/scripts/run-ios-local.sh <spec>/<game_N>/main.yaml`

## CI Integration

The `e2e:check` script verifies generated files match their DSL source:

```bash
# In CI pipeline
bun e2e:check
```

If files are out of sync, CI fails with instructions to regenerate.

## Troubleshooting

### Element not found

- Check testID is set on the React Native component
- For dropdowns, use `accessibilityLabel` not `testID` for items
- Add `snapshotKeyHonorModalViews: false` in YAML header for iOS modals

### Keyboard blocking elements

- Tap a text label to dismiss keyboard before tapping buttons
- Use `KeyboardAvoidingView` in React Native components

### Flaky tests

- Add `waitForAnimationToEnd` between interactions
- Use `extendedWaitUntil` for async-loaded elements
- Increase timeouts for network operations
