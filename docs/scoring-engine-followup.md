# Scoring Engine Follow-Up Work

This document tracks remaining work for the scoring engine feature after PR #322.  That PR got to be massive and it needs to be merged so we can work on smaller pieces going forward.

---

## 1. Scoring Screen UI Redesign

The current ScoringView is monolithic and messy. We need to decompose it into smaller, reusable components with a cleaner layout. The app-0.3 screenshots show the **elements** we need - we can improve on the layout.

Ask user for actual screenshots from 0.3

### Current Problems

- `ScoringView.tsx` is 500+ lines with inline functions
- Logic and presentation tightly coupled
- Team group header combines team junk and multipliers in unclear ways
- No clear separation between hole-level UI and player-level UI
- Score entry UI is cluttered

### Required Elements (from app-0.3)

These are the UI elements that must be present, though layout can be improved:

3. **Junk Buttons**
   - User-markable junk (Prox): Blue outline, toggleable
   - Calculated junk (Birdie, Low Ball, Low Total): Blue filled when awarded
   - All junk buttons show dot icon + label

4. **Multiplier Buttons**
   - Red background when active
   - Red outline when available but not selected
   - disabled/grayed out when inherited/started on a previous hole.  We have disabled now, but 0.3 has grayed too.  Not sure which yet.  Probably disabled, but still red, looks okay...
 
5. **Team Footer**
   - Shows hole calculation: "Hole: 2 x 4 = +8" (junk × multiplier = points)
   - Shows running total: "Total: 17"

### Proposed Component Structure, after we settle on an overall design, this might change

```
ScoringView/
├── HoleHeader.tsx           (existing - nav arrows, hole number, par/yds/hdcp)
├── TeamSection/
│   ├── TeamSection.tsx      (container for team)
│   ├── PlayerScoreRow.tsx   (player name + score selector + junk)
│   │   ├── ScoreSelector.tsx    (quick-select score buttons)
│   │   └── PlayerJunkButtons.tsx (prox, birdie badges)
│   ├── TeamJunkRow.tsx      (Low Ball, Low Total badges)
│   ├── MultiplierRow.tsx    (Pre 2x, 2x, 2x back buttons)
│   └── TeamFooter.tsx       (hole calculation + running total)
├── ScoreCell.tsx            (individual score with circle/square notation)
└── OptionBadge.tsx          (unified junk/multiplier button component)
```

### Tasks

- [ ] Extract inline functions from `ScoringView` into utility module
- [ ] Create `ScoreSelector` component with quick-select buttons
- [ ] Create `ScoreCell` component with circle/square notation
- [ ] Create `TeamFooter` component showing hole calc and running total
- [ ] Refactor `TeamGroup` into `TeamSection` with cleaner separation
- [ ] Style junk buttons consistently (blue=junk, red=multiplier)
- [ ] Add pops indicator (boxed score options)

---

## 2. Summary Screen

A summary view accessible after hole 18 (or via nav from any hole). Shows final results.

Ask user for actual screenshots from 0.3

### Layout (from app-0.3)

```
+--------------------------------------------------+
|  <  |       Summary       |  >                   |
+--------------------------------------------------+
| Player          Gross   To Par   Points          |
+--------------------------------------------------+
| Brad Anderson     76      +4       -33           |
| Chris Rauber      83      +11      +33           |
| Jeff Fancher      86      +14      +33           |
| Eric Froseth      96      +24      -33           |
+--------------------------------------------------+
| [Review and post to handicap service]            |
+--------------------------------------------------+
```

### Features

- Player name column (left-aligned)
- Gross score column
- To Par column (relative to course par)
- Points column (game points, +/-)
- "Review and post to handicap service" button (future integration)

### Data Source

- `Scoreboard.cumulative.players` for totals
- `Scoreboard.cumulative.teams` for team totals (if team game)

### Tasks

- [ ] Create `SummaryView` component
- [ ] Add summary as "hole 19" in hole navigation
- [ ] Connect to scoreboard cumulative data
- [ ] Style table layout
- [ ] Add handicap posting button (placeholder for future)

---

## 3. Leaderboard Screen

Full hole-by-hole breakdown with three view modes: gross, net, points.

Ask user for actual screenshots from 0.3

### Layout (from app-0.3)

```
+--------------------------------------------------+
| [gross]  [net]  [points]    <- view toggle       |
+--------------------------------------------------+
|        Brad    Jeff    Eric    Chris             |
| Hole  Anderson Fancher Froseth Rauber            |
+--------------------------------------------------+
|  1      7 *     6 *     6 *     5 *              |
|  2      4       4       6       4                |
|  3      4       6       6       7                |
|  4      6 *     4 *     6 *     4 *              |
|  5     (3)      5 *     4 *     4                |
|  ...                                             |
| Out    39      44      48      45                |
|  10     6 *     4 *     5 *     5 *              |
|  ...                                             |
| In     37      42      48      38                |
| Total  76      86      96      83                |
+--------------------------------------------------+
```

### View Modes

1. **Gross View**
   - Shows gross scores
   - Circles around birdies/eagles
   - Dots (*) indicate junk earned on that hole

2. **Net View**
   - Shows net scores (gross - pops)
   - Circles around net birdies/eagles
   - Dots indicate junk

3. **Points View**
   - Shows +/- points per hole per player/team
   - Dots indicate junk
   - Running totals at Out/In/Total rows

### Score Notation

| Score to Par | Notation |
|--------------|----------|
| Eagle (-2) or lower   | Double circle: ((3)) |
| Birdie (-1)  | Single circle: (3) |
| Par (0)      | Plain: 4 |
| Bogey (+1)   | Single square: [5] |
| Double+ (+2) or higher | Double square: [[6]] |

### Dot Indicators

- Small dot (*) appears next to score when player earned junk on that hole
- Junk includes: birdie, eagle, prox, sandie, greenie, etc.

### Layout Details

- Player names in header row (vertical text to save space)
- Hole numbers in first column
- "Out" row shows front 9 total (shaded background)
- "In" row shows back 9 total (shaded background)
- "Total" row shows 18-hole total (shaded background)
- Horizontal scroll for 4+ players

### Tasks

- [ ] Create `LeaderboardView` component
- [ ] Create `LeaderboardTable` with horizontal scroll
- [ ] Create `ScoreCell` component (shared with scoring)
- [ ] Implement view toggle (gross/net/points)
- [ ] Add Out/In/Total summary rows
- [ ] Add junk dot indicators
- [ ] Handle player name column (vertical text or abbreviated)

---

## 4. PR #322 Feedback Items

All feedback from CodeRabbit and reviewers on PR #322. Address all items.

### Critical Issues

#### 4.1 Wolf Game Implementation Incomplete
- **File**: `packages/lib/scoring/logic-engine.ts` (lines 207-211)
- **Issue**: `isWolfPlayer()` returns hardcoded `false` with TODO comment
- **Impact**: Wolf game multipliers won't function correctly
- **Action**: Complete implementation or mark Wolf game spec as test-only until implemented

#### 4.2 JSON Logic Expressions Lack Validation
- **Files**: `data/seed/options/*.json` and `packages/lib/scoring/logic-engine.ts`
- **Issue**: Logic expressions use single-quoted JSON strings without upfront validation
- **Impact**: Typos only caught at runtime; fragile quote-conversion approach
- **Action**: Add seed data validation script that parses all logic/availability expressions on load

#### 4.3 Empty Type Assertions Bypass Safety
- **File**: `packages/lib/scoring/pipeline.ts` (line 206)
- **Issue**: Returns `{} as MapOfOptions` when no options found
- **Risk**: Type mismatch if downstream code expects specific properties
- **Action**: Use properly typed empty object or modify return type to allow undefined

### Major Issues

#### 4.4 countJunk Function Incomplete
- **File**: `packages/lib/scoring/logic-engine.ts` (lines 75-85)
- **Issue**: Only counts team-scoped junk; ignores player-scoped junk (birdie, eagle)
- **Impact**: Game specs checking junk counts (two_birdies_add, eagle_add) will fail
- **Action**: Access player junk arrays via `holeResult` parameter and sum totals

#### 4.5 Ranking Logic Conflicts
- **Files**: `packages/lib/scoring/stages/ranking.ts` (lines 150-181) vs `cumulative.ts` (lines 108-126)
- **Issue**: Teams ranked by `scoreTotal` with "lower" direction vs `pointsTotal` with "higher"
- **Impact**: Conflicting rankings depending on execution order
- **Action**: Centralize ranking logic with conditional metric selection by game type

#### 4.6 Test Coverage Gaps
- **Missing**: Logic engine operator tests, multiplier engine tests, Wolf/Vegas/Nassau scenarios
- **Impact**: High business logic risk for game calculations
- **Action**: Add unit tests for all custom JSON-logic operators and multiplier evaluation

### Moderate Issues

#### 4.7 Jazz Pattern Violations
- **File**: `packages/app/src/components/game/settings/options/GameOptionsList.tsx` (lines 58-62)
- **Issue**: Accesses `teamOnly` without `$jazz.has()` check
- **Action**: Use `option.$jazz.has("teamOnly")` before accessing property

#### 4.8 Performance: Repeated Deep Cloning
- **Files**: Multiple scoring stages use `structuredClone()` per stage (now `deepClone`)
- **Concern**: Could impact performance with large scoreboards (18 holes x 4+ players)
- **Action**: Profile with realistic data; consider structural sharing (Immer.js) if needed

#### 4.9 playerInfoMap Dead Code
- **File**: `packages/lib/scoring/pipeline.ts` (line 142)
- **Issue**: Initialized as empty Map, never populated or accessed
- **Action**: Remove from `ScoringContext` or implement population logic

#### 4.10 Type Assertion Before Validation
- **File**: `packages/lib/scoring/junk-engine.ts` (lines 245-249)
- **Issue**: Type assertion on `operatorPart` occurs before validation check
- **Action**: Reorder to validate first, then assert type

### Minor Issues

#### 4.11 Invalid JSON in Seed Data
- **Files**: Multiple `data/seed/options/*.json` files
- **Issue**: Logic fields use single-quoted dictionaries like `"logic": "{'rankWithTies': [1,1]}"`
- **Action**: Use properly escaped double-quoted valid JSON

#### 4.12 Empty String vs Null
- **Files**: Several seed option files
- **Issue**: `"limit": ""` and `"disp": ""` should use `null` for absent values
- **Action**: Standardize on `null` for semantically absent fields

#### 4.13 Type Mismatch: defaultValue vs valueType
- **File**: `data/seed/options/discount_percent.json` (line 6)
- **Issue**: `"defaultValue": "50"` (string) vs `"valueType": "pct"` (numeric)
- **Action**: Change to `"defaultValue": 50` (numeric)

#### 4.14 Accessibility Label Whitespace
- **File**: `packages/app/src/components/game/scoring/OptionsButtons.tsx` (line 99)
- **Issue**: Template literal concatenation produces extra spaces when conditions false
- **Action**: Build from array filtered for truthy values, then join with single space

#### 4.15 Incorrect Icon Type Cast
- **File**: `packages/app/src/components/game/scoring/OptionsButtons.tsx`
- **Issue**: `as never` cast defeats FontAwesome6 type checking
- **Action**: Ensure `mapIconName()` returns correct FontAwesome6 icon type

#### 4.16 Documentation Mismatch
- **File**: `packages/api-0.3/README.md` (line 23)
- **Issue**: References old `bun run start:dev` command; script renamed to `dev`
- **Action**: Update README to reflect current script naming

#### 4.17 Silent Test Skipping
- **File**: `packages/lib/scoring/__integration__/five-points.test.ts` (lines 119-127)
- **Issue**: Tests return early without assertions when game loads fail
- **Action**: Use explicit skip mechanism or throw errors for visibility

#### 4.18 Biome Ignore Overuse
- **File**: `packages/lib/scoring/__integration__/five-points.test.ts` (line 13)
- **Issue**: `biome-ignore-all` suppresses all linting; should target specific lines
- **Action**: Use targeted `// biome-ignore` comments only where needed

#### 4.19 Unistyles Keyword Typo
- **File**: `.claude/skills/skill-rules.json` (line 56)
- **Issue**: Keyword is `"unistyle"` but codebase uses `"unistyles"` (plural)
- **Action**: Change to `"unistyles"` for proper skill rule triggering

### Additional Recommendations

- [ ] Add schema validation (Zod, JSON Schema) for all seed files
- [ ] Implement logging infrastructure instead of `console.warn()` in production code
- [ ] Document global state limitation of `json-logic-js` operator registry
- [ ] Add edge case handling for team scoring (0 players, division by zero, NaN values)
- [ ] Consider branded types for IDs to prevent mixing player/team/hole IDs
- [ ] Extract common option override logic in `catalog.ts` to reduce duplication (lines 322-446)

---

## Task Checklist

### Phase 1: PR Feedback (Quick Wins) ✅ COMPLETE
- [x] 4.7 Fix Jazz pattern violation in GameOptionsList
- [x] 4.9 Remove dead playerInfoMap code
- [x] 4.12 Standardize null vs empty string in seed data
- [x] 4.13 Fix defaultValue type in discount_percent.json
- [x] 4.14 Fix accessibility label whitespace
- [x] 4.16 Update api-0.3 README
- [x] 4.17 Fix silent test skipping
- [x] 4.18 Use targeted biome-ignore comments
- [x] 4.19 Fix unistyles keyword typo

### Phase 2: PR Feedback (Medium Effort) ✅ COMPLETE
- [x] 4.3 Fix empty type assertions in pipeline.ts
- [x] 4.10 Fix type assertion ordering in junk-engine
- [x] 4.11 Convert seed data to valid JSON
- [x] 4.15 Fix icon type casting

### Phase 3: PR Feedback (Significant Work) ✅ COMPLETE
- [x] 4.1 Complete Wolf game implementation (or mark as incomplete)
- [x] 4.2 Add seed data validation script
- [x] 4.4 Fix countJunk to include player junk
- [x] 4.5 Centralize ranking logic
- [x] 4.6 Add comprehensive test coverage

### Phase 4: Scoring UI Redesign ✅ COMPLETE
- [x] ScoreInput scalable size prop (sm/md/lg/xl)
- [x] PlayerScoreRow column alignment with fixed widths
- [x] Global useUIScale hook for device font scale
- [x] Birdie BBQ auto-multiplier fix
- [x] Earned multiplier badges on ScoreInput
- [x] HoleToolbar color simplification (theme colors)
- [x] Score separator styling improvement
- [x] HoleHeader vertical spacing reduction
- [x] Screen padding fix for header gap

### Phase 5: Summary Screen
- [ ] Create SummaryView component
- [ ] Add to hole navigation as "hole 19" or after last hole, before first hole if not 18 total.
- [ ] Connect to scoreboard cumulative data
- [ ] Add handicap posting button (placeholder)

### Phase 6: Leaderboard Screen (Separate PR)
- [ ] Create LeaderboardView component
- [ ] Create LeaderboardTable with scroll
- [ ] Implement gross/net/points toggle
- [ ] Add score notation (circles/squares)
- [ ] Add junk dot indicators
- [ ] Add Out/In/Total rows
