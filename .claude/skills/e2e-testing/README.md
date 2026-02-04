# E2E Testing Skill

This skill covers Maestro E2E testing patterns for React Native.

## Test Location

E2E tests are in `tests/e2e/`:
- `flows/` - Maestro YAML flow files
- `fixtures/` - Test data (games, scores, etc.)
- `scripts/` - Helper scripts for running tests

## Running Tests

```bash
# Run specific flow on iOS simulator
./tests/e2e/scripts/run-ios-local.sh <flow-name>.yaml

# Example
./tests/e2e/scripts/run-ios-local.sh five_points/game_0/main.yaml
```

## Known Issues & Workarounds

### iOS Modal/Dropdown Elements Not Found

**Problem**: Elements inside dropdown modals (react-native-element-dropdown) are not found by Maestro on iOS.

**Cause**: The dropdown library uses `accessibilityViewIsModal` which tells iOS accessibility APIs to ignore sibling views. Maestro relies on these APIs.

**Solution**: Two-part fix required:

1. **In flow YAML** - Add this configuration:
```yaml
appId: golf.spicy
platform:
  ios:
    snapshotKeyHonorModalViews: false
---
```

2. **In Picker component** - Use `accessibilityLabel` instead of `testID` for dropdown items:
```typescript
// itemTestIDField doesn't work reliably on iOS
// Use itemAccessibilityLabelField instead
const itemsWithTestID = items.map((item) => ({
  ...item,
  testID: `${testID}-item-${item.value}`,
  accessibilityLabel: `${testID}-item-${item.value}`,
}));

<Dropdown
  itemTestIDField="testID"
  itemAccessibilityLabelField="accessibilityLabel"
  // ...
/>
```

3. **In flow YAML** - Use text matching (maps from accessibilityLabel), NOT id matching:
```yaml
# CORRECT: Use bare string (text matching via accessibilityLabel)
- tapOn: "hole-6-par-item-3"

# WRONG: id matching doesn't work for dropdown items on iOS
- tapOn:
    id: "hole-6-par-item-3"  # This will fail with "Element not found"
```

### Keyboard Blocking Elements

**Problem**: Keyboard covers buttons/inputs at bottom of screen.

**Solution**: 
1. Use `KeyboardAvoidingView` in the React Native component
2. In flow, tap on a text label to dismiss keyboard instead of `hideKeyboard` (unreliable):
```yaml
- tapOn: "Course Name"  # Tap header text to dismiss keyboard
```

### Text Input Clearing

**Problem**: `eraseText` doesn't reliably clear text inputs.

**Solution**: Initialize inputs as empty so no clearing is needed, or use:
```yaml
- longPressOn:
    id: "my-input"
- tapOn: "Select All"
- inputText: "new value"
```

## Element Finding

Maestro maps React Native props:
- `testID` -> `id` in Maestro
- `accessibilityLabel` -> `text` in Maestro

Example:
```yaml
# Find by testID
- tapOn:
    id: "my-button"

# Find by accessibilityLabel or visible text
- tapOn: "Submit"
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
- inputText: "Hello"
```

## Useful Commands

```yaml
# Wait for animation
- waitForAnimationToEnd:
    timeout: 1000

# Conditional execution
- runFlow:
    when:
      visible:
        id: "some-element"
    commands:
      - tapOn:
          id: "some-element"

# Scroll
- scroll
- scrollUntilVisible:
    element:
      id: "target-element"
```
