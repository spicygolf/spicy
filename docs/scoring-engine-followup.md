# Scoring Engine Follow-Up Work

This document tracks remaining work for the scoring engine feature after PR #322.

---

## 1. Scoring Screen UI Redesign

The current ScoringView is monolithic and difficult to maintain. We need to decompose it into smaller, reusable components with a layout that matches app-0.3.

### Current Problems

- `ScoringView.tsx` is 500+ lines with inline functions
- Logic and presentation tightly coupled
- Team group header combines team junk and multipliers in unclear ways
- No clear separation between hole-level UI and player-level UI

### Target Layout (from app-0.3 screenshot)

```
+--------------------------------------------------+
| Five Points                                       |
| Sun Dec 26 2021 - 10:10 AM                       |
| Druid Hills Golf Club                            |
+--------------------------------------------------+
|  <  |         16         |  >                    |
|     | Par 4 - 319 yds - Hdcp 16                  |
+--------------------------------------------------+
| HOLE STATUS BAR                                  |
| [Hole Multiplier: 4x] [Team Chooser]             |
+--------------------------------------------------+
| TEAM 1                                           |
| [Low Ball] [Pre 2x] [2x]                         |
+--------------------------------------------------+
| Brad Anderson                                    |
| [-] [3] [+]   BIRDIE      [Birdie] [Prox]       |
+--------------------------------------------------+
| Eric Froseth                                     |
| [-] [7] [+]   TRIPLE BOGEY        [Prox]        |
+--------------------------------------------------+
| TEAM 2                                           |
| [Low Total] [2x back]                            |
+--------------------------------------------------+
| Jeff Fancher                                     |
| [-] [5] [+]   BOGEY               [Prox]        |
+--------------------------------------------------+
| Chris Rauber                                     |
| [-] [4] [+]   PAR                 [Prox]        |
+--------------------------------------------------+
```

### Proposed Component Structure

```
ScoringView/
├── HoleHeader.tsx          (existing - nav arrows, hole number)
├── HoleStatusBar.tsx       (NEW - hole multiplier display, team chooser)
├── TeamSection.tsx         (NEW - container for team header + players)
│   ├── TeamHeader.tsx      (team junk + multiplier buttons)
│   └── PlayerScoreRow.tsx  (existing - score entry + player junk)
├── ScoreIndicator.tsx      (NEW - circled/squared score display)
└── JunkBadge.tsx           (NEW - individual junk display component)
```

### Key UI Elements

1. **Hole Status Bar** (NEW)
   - Shows combined hole multiplier (e.g., "4x" when double + double_back)
   - Team Chooser button (for Wolf or games with team selection)
   - Separate from HoleHeader to keep navigation clean

2. **Score Display Styling** (app-0.3 patterns)
   - Par: Plain number
   - Birdie: Green text, circle border
   - Eagle: Green text, double circle border
   - Bogey: Red text, square border
   - Double bogey+: Purple text, double square border
   - Score label below: "BIRDIE", "BOGEY", etc.

3. **Junk Buttons**
   - Calculated junk (birdie, low_ball): Green background, non-toggleable
   - User junk (prox): Blue background, toggleable
   - Multipliers: Red/coral background

4. **Team Header**
   - Team icon (people silhouette)
   - Team junk badges (Low Ball, Low Total)
   - Multiplier buttons (Pre 2x, 2x, 2x back)

### Tasks

- [ ] Create `HoleStatusBar` component with hole multiplier display
- [ ] Create `ScoreIndicator` component with proper styling by score-to-par
- [ ] Refactor `TeamGroup` into `TeamSection` with cleaner separation
- [ ] Extract inline functions from `ScoringView` into utility module
- [ ] Add score label text (BIRDIE, BOGEY, PAR, etc.)
- [ ] Style junk buttons consistently (green=calculated, blue=user, red=multiplier)

---

## 2. PR #322 Feedback Items

All feedback from CodeRabbit and reviewers on PR #322. Address all items.

### Critical Issues

#### 2.1 Wolf Game Implementation Incomplete
- **File**: `packages/lib/scoring/logic-engine.ts` (lines 207-211)
- **Issue**: `isWolfPlayer()` returns hardcoded `false` with TODO comment
- **Impact**: Wolf game multipliers won't function correctly
- **Action**: Complete implementation or mark Wolf game spec as test-only until implemented

#### 2.2 JSON Logic Expressions Lack Validation
- **Files**: `data/seed/options/*.json` and `packages/lib/scoring/logic-engine.ts`
- **Issue**: Logic expressions use single-quoted JSON strings without upfront validation
- **Impact**: Typos only caught at runtime; fragile quote-conversion approach
- **Action**: Add seed data validation script that parses all logic/availability expressions on load

#### 2.3 Empty Type Assertions Bypass Safety
- **File**: `packages/lib/scoring/pipeline.ts` (line 206)
- **Issue**: Returns `{} as MapOfOptions` when no options found
- **Risk**: Type mismatch if downstream code expects specific properties
- **Action**: Use properly typed empty object or modify return type to allow undefined

### Major Issues

#### 2.4 countJunk Function Incomplete
- **File**: `packages/lib/scoring/logic-engine.ts` (lines 75-85)
- **Issue**: Only counts team-scoped junk; ignores player-scoped junk (birdie, eagle)
- **Impact**: Game specs checking junk counts (two_birdies_add, eagle_add) will fail
- **Action**: Access player junk arrays via `holeResult` parameter and sum totals

#### 2.5 Ranking Logic Conflicts
- **Files**: `packages/lib/scoring/stages/ranking.ts` (lines 150-181) vs `cumulative.ts` (lines 108-126)
- **Issue**: Teams ranked by `scoreTotal` with "lower" direction vs `pointsTotal` with "higher"
- **Impact**: Conflicting rankings depending on execution order
- **Action**: Centralize ranking logic with conditional metric selection by game type

#### 2.6 Test Coverage Gaps
- **Missing**: Logic engine operator tests, multiplier engine tests, Wolf/Vegas/Nassau scenarios
- **Impact**: High business logic risk for game calculations
- **Action**: Add unit tests for all custom JSON-logic operators and multiplier evaluation

### Moderate Issues

#### 2.7 Jazz Pattern Violations
- **File**: `packages/app/src/components/game/settings/options/GameOptionsList.tsx` (lines 58-62)
- **Issue**: Accesses `teamOnly` without `$jazz.has()` check
- **Action**: Use `option.$jazz.has("teamOnly")` before accessing property

#### 2.8 Performance: Repeated Deep Cloning
- **Files**: Multiple scoring stages use `structuredClone()` per stage (now `deepClone`)
- **Concern**: Could impact performance with large scoreboards (18 holes x 4+ players)
- **Action**: Profile with realistic data; consider structural sharing (Immer.js) if needed

#### 2.9 playerInfoMap Dead Code
- **File**: `packages/lib/scoring/pipeline.ts` (line 142)
- **Issue**: Initialized as empty Map, never populated or accessed
- **Action**: Remove from `ScoringContext` or implement population logic

#### 2.10 Type Assertion Before Validation
- **File**: `packages/lib/scoring/junk-engine.ts` (lines 245-249)
- **Issue**: Type assertion on `operatorPart` occurs before validation check
- **Action**: Reorder to validate first, then assert type

### Minor Issues

#### 2.11 Invalid JSON in Seed Data
- **Files**: Multiple `data/seed/options/*.json` files
- **Issue**: Logic fields use single-quoted dictionaries like `"logic": "{'rankWithTies': [1,1]}"`
- **Action**: Use properly escaped double-quoted valid JSON

#### 2.12 Empty String vs Null
- **Files**: Several seed option files
- **Issue**: `"limit": ""` and `"disp": ""` should use `null` for absent values
- **Action**: Standardize on `null` for semantically absent fields

#### 2.13 Type Mismatch: defaultValue vs valueType
- **File**: `data/seed/options/discount_percent.json` (line 6)
- **Issue**: `"defaultValue": "50"` (string) vs `"valueType": "pct"` (numeric)
- **Action**: Change to `"defaultValue": 50` (numeric)

#### 2.14 Accessibility Label Whitespace
- **File**: `packages/app/src/components/game/scoring/OptionsButtons.tsx` (line 99)
- **Issue**: Template literal concatenation produces extra spaces when conditions false
- **Action**: Build from array filtered for truthy values, then join with single space

#### 2.15 Incorrect Icon Type Cast
- **File**: `packages/app/src/components/game/scoring/OptionsButtons.tsx`
- **Issue**: `as never` cast defeats FontAwesome6 type checking
- **Action**: Ensure `mapIconName()` returns correct FontAwesome6 icon type

#### 2.16 Documentation Mismatch
- **File**: `packages/api-0.3/README.md` (line 23)
- **Issue**: References old `bun run start:dev` command; script renamed to `dev`
- **Action**: Update README to reflect current script naming

#### 2.17 Silent Test Skipping
- **File**: `packages/lib/scoring/__integration__/five-points.test.ts` (lines 119-127)
- **Issue**: Tests return early without assertions when game loads fail
- **Action**: Use explicit skip mechanism or throw errors for visibility

#### 2.18 Biome Ignore Overuse
- **File**: `packages/lib/scoring/__integration__/five-points.test.ts` (line 13)
- **Issue**: `biome-ignore-all` suppresses all linting; should target specific lines
- **Action**: Use targeted `// biome-ignore` comments only where needed

#### 2.19 Unistyles Keyword Typo
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

## 3. Leaderboard Screen

The Leaderboard screen displays game results from the scoring engine output. This is likely a separate PR due to complexity.

### Data Source

- Primary: `Scoreboard` output from scoring engine
- Contains: player/team rankings, points, junk, running totals, match play status

### Display Modes

Different game types require different leaderboard formats:

| Game Type | Primary Display | Secondary |
|-----------|-----------------|-----------|
| Five Points | Points totals | Match play status |
| Ten Points | Points totals | Hole-by-hole breakdown |
| Nassau | 3 matches (F9/B9/Overall) | Match play per match |
| Wolf | Individual points | Hole winners |
| Skins | Skins won | Carryovers |

### Visual Elements

#### Score Notation
- **Circle**: Birdie (1 under)
- **Double Circle**: Eagle (2+ under)
- **Square**: Bogey (1 over)
- **Double Square**: Double bogey+ (2+ over)
- **Dot**: Junk awarded (small dot indicator)

#### Score Colors
- Green: Under par
- Black/White: Par
- Red: Over par (bogey)
- Purple: 2+ over par

#### Layout Elements
- Player/Team name column
- Hole-by-hole scores (with notation)
- Total (gross and/or net)
- Points column
- Junk dots column
- Running total or match status

### Leaderboard Components

```
LeaderboardScreen/
├── LeaderboardHeader.tsx    (game name, date, toggle options)
├── LeaderboardTable.tsx     (main scrollable grid)
│   ├── PlayerRow.tsx        (name + scores + totals)
│   └── TeamRow.tsx          (team name + combined info)
├── HoleColumn.tsx           (single hole with notation)
├── ScoreCell.tsx            (individual score with styling)
├── JunkDots.tsx             (dot indicators for junk)
└── MatchPlayStatus.tsx      (e.g., "3 & 2", "1 UP")
```

### Features

- [ ] Gross score view
- [ ] Net score view
- [ ] Points view
- [ ] Hole-by-hole breakdown
- [ ] Running totals
- [ ] Match play indicator ("2 UP", "3 & 2", "AS")
- [ ] Birdie/eagle circles
- [ ] Bogey/double squares
- [ ] Junk dot indicators
- [ ] Sort by: Points, Gross, Net, Name
- [ ] Filter by: Front 9, Back 9, All 18

### Match Play Display

For 2-team games:
- Show holes up/down (e.g., "2 UP" or "3 DN")
- Show "AS" for all square
- Show final result format (e.g., "3 & 2" = won 3 up with 2 to play)

### Implementation Notes

- Use horizontal ScrollView for hole columns (18 holes don't fit on screen)
- Fixed left column for player names
- Responsive to both phone and tablet layouts
- Consider virtualization for games with many players

---

## Task Checklist

### Phase 1: PR Feedback (Quick Wins)
- [ ] 2.7 Fix Jazz pattern violation in GameOptionsList
- [ ] 2.9 Remove dead playerInfoMap code
- [ ] 2.12 Standardize null vs empty string in seed data
- [ ] 2.13 Fix defaultValue type in discount_percent.json
- [ ] 2.14 Fix accessibility label whitespace
- [ ] 2.16 Update api-0.3 README
- [ ] 2.17 Fix silent test skipping
- [ ] 2.18 Use targeted biome-ignore comments
- [ ] 2.19 Fix unistyles keyword typo

### Phase 2: PR Feedback (Medium Effort)
- [ ] 2.3 Fix empty type assertions in pipeline.ts
- [ ] 2.10 Fix type assertion ordering in junk-engine
- [ ] 2.11 Convert seed data to valid JSON
- [ ] 2.15 Fix icon type casting

### Phase 3: PR Feedback (Significant Work)
- [ ] 2.1 Complete Wolf game implementation (or mark as incomplete)
- [ ] 2.2 Add seed data validation script
- [ ] 2.4 Fix countJunk to include player junk
- [ ] 2.5 Centralize ranking logic
- [ ] 2.6 Add comprehensive test coverage

### Phase 4: Scoring UI Redesign
- [ ] Extract utility functions from ScoringView
- [ ] Create HoleStatusBar component
- [ ] Create ScoreIndicator component
- [ ] Refactor TeamSection layout
- [ ] Add score-to-par labels
- [ ] Style junk buttons by type

### Phase 5: Leaderboard Screen (Separate PR)
- [ ] Design Leaderboard data model
- [ ] Create LeaderboardTable component
- [ ] Implement score notation (circles, squares)
- [ ] Add match play status display
- [ ] Add view toggles (gross/net/points)
- [ ] Test with all game types
