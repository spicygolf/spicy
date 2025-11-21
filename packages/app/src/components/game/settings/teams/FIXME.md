# FIXME: Teams Component Refactoring Notes

## Local State vs Jazz State

**Issue**: The `index.tsx` component maintains local `teamAssignments` state alongside Jazz data, which is a code smell and can lead to sync issues.

**Current Implementation**:
```typescript
const [teamAssignments, setTeamAssignments] = useState<Map<string, number>>(
  () => getCurrentTeamAssignments(),
);
```

**Problems**:
- Local state can get out of sync with Jazz data
- Requires manual sync (e.g., the "Clear everything" bug where we had to manually clear local state)
- Not leveraging Jazz's reactive patterns

**Proper Solution** (for future refactor):
- Remove local `teamAssignments` state entirely
- Derive team assignments directly from `game.holes[0].teams` in a `useMemo`
- Use Jazz's reactive loading to automatically update UI when data changes
- This would eliminate all manual `setTeamAssignments()` calls

**Why We're Not Fixing It Now**:
- Everything is working after the refactor
- Would require deeper changes to state management patterns
- Risk/reward ratio not worth it for immediate needs

## Team Count Management

**Note**: TeamCountSelector was removed as it wasn't in the original implementation. For larger tournaments in the future, we'll need to implement proper team count management that:
- Allows dynamic team counts (not just 2-4)
- Handles team assignment migration when changing team counts
- Validates team assignments against new team count

## Future Improvements

1. **State Management**: Migrate from local state to pure Jazz-derived state
2. **Team Count**: Add proper team count selector for tournament support
3. **Type Safety**: Consider using discriminated unions for rotation options instead of magic numbers
4. **Error Handling**: Add error boundaries and loading states for Jazz operations
