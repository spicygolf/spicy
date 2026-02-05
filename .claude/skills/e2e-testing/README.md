# E2E Testing Skill

Maestro E2E testing patterns for React Native.

## DSL-Driven Test Generation

Tests are generated from DSL files (source of truth):

```
game.dsl → game.json → *.yaml flows
```

### Key Commands

```bash
# Regenerate all flows from DSL
bun e2e:generate

# Verify generated files match DSL (CI check)
bun e2e:check

# Run a test locally
./tests/e2e/scripts/run-ios-local.sh five_points/game_0/main.yaml

# Dev: continue from current app state
./tests/e2e/scripts/run-ios-local.sh five_points/game_0/continue.yaml
```

### DSL Syntax

```dsl
name: Five Points Full Game
spec: five_points
players: p1 Brad 5.1 [5.1], p2 Tim +0.9
course: Druid Hills | Blue | 71.8/134
holes: 1-4-3-444, 2-4-7-392

h1: (p1 p2) vs (p3 p4) | 4 5 5 6
h2: | 5 6 3 5 | birdie:p3 | t1:double
```

- Plus handicaps: `+0.9` → stored as -0.9
- Handicap override: `[5.1]` → manual adjustment
- Teams: `(p1 p2) vs (p3 p4)` on first hole
- Junk: `birdie:p3 prox:p1`
- Multipliers: `t1:double t2:double_back`

## Pops Calculation

Generator calculates pops (handicap strokes) automatically:

1. Course handicap = `round(index × slope / 113)`
2. Shots off = `courseHandicap - lowestCourseHandicap`
3. Pops = `shotsOff >= holeHandicap ? 1 : 0`

Generated hole comments show pops: `# Scores: p1=4(+1), p2=5(+1), p3=5, p4=6(+1)`

## Hand-Written vs Generated Files

| File | Hand-written | Generated |
|------|--------------|-----------|
| `game.dsl` | ✓ | |
| `game.json` | | ✓ |
| `continue.yaml` | ✓ | |
| All other YAML | | ✓ |

**Never edit generated files directly** - changes will be lost on regenerate.

## Known Issues & Workarounds

### iOS Modal/Dropdown Elements Not Found

Elements inside dropdown modals not found by Maestro.

**Fix in YAML header:**
```yaml
appId: golf.spicy
platform:
  ios:
    snapshotKeyHonorModalViews: false
```

**Fix for dropdown items** - use accessibilityLabel, not testID:
```yaml
# CORRECT: bare string (accessibilityLabel)
- tapOn: "hole-6-par-item-3"

# WRONG: id matching fails for dropdown items
- tapOn:
    id: "hole-6-par-item-3"
```

### Keyboard Blocking Elements

Tap a text label to dismiss instead of `hideKeyboard`:
```yaml
- tapOn: "Course Name"  # Dismiss keyboard
```

### Text Input Clearing

`eraseText` is unreliable. Use:
```yaml
- longPressOn:
    id: "my-input"
- tapOn: "Select All"
- inputText: "new value"
```

## Element Finding

- `testID` → `id` in Maestro
- `accessibilityLabel` → `text` in Maestro

```yaml
- tapOn:
    id: "my-button"      # By testID
- tapOn: "Submit"        # By text/accessibilityLabel
```

## Flow File Structure

```yaml
# Header (before ---)
appId: golf.spicy
platform:
  ios:
    snapshotKeyHonorModalViews: false
---
# Commands (after ---)
- tapOn:
    id: "my-element"
```

## Useful Commands

```yaml
- waitForAnimationToEnd:
    timeout: 1000

- extendedWaitUntil:
    visible:
      id: "element"
    timeout: 5000

- runFlow:
    when:
      visible:
        id: "element"
    commands:
      - tapOn:
          id: "element"

- assertVisible:
    id: "handicap-shots"
    text: "7"
```
