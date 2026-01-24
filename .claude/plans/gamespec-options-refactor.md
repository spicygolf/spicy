# GameSpec Refactor: Unified Options Model

## Overview

GameSpec is a unified options map. ALL data is stored as Option entries in the map - there are no top-level data fields.

## Current State (Implemented)

### GameSpec Schema
```typescript
// packages/lib/schema/gamespecs.ts
// GameSpec IS MapOfOptions directly
export const GameSpec = MapOfOptions;
```

### Meta Options for Spec Metadata
All spec metadata is stored as MetaOption entries:
- `name` (text, required) - Spec display name
- `version` (num) - Version number
- `legacyId` (text) - ArangoDB _key for import matching
- `short` (text) - Short name/abbreviation
- `long_description` (text) - Markdown description
- `status` (menu: prod/dev/test) - Deployment status
- `spec_type` (menu: points/skins/stableford/quota) - Scoring format
- `min_players` (num) - Minimum players
- `max_players` (num) - Maximum players
- `location_type` (menu: local/virtual) - Where game is played
- `teams` (bool) - Is this a team game
- `team_size` (num) - Players per team
- `team_change_every` (num) - Rotate teams every N holes
- `aliases` (text_array, searchable) - Alternate names

### Reading Spec Fields
```typescript
import { getSpecField } from "spicylib/scoring/option-utils";

// Read any spec field
const name = getSpecField(spec, "name") as string;
const minPlayers = getSpecField(spec, "min_players") as number;
const status = getSpecField(spec, "status") as string;
```

### Game References - IMPORTANT
- `Game.spec` - **Working copy** of the spec's options for this game. Created by copying from catalog spec at game creation. User modifications go here directly.
- `Game.specRef` - Reference to the **original** catalog spec. Used for:
  - "Reset to defaults" - Copy specRef options back to spec
  - "Show diff" - Compare spec vs specRef to see what changed
  - Display original spec name/description
- `GameHole.options` - Per-hole option overrides (optional)

**CRITICAL**: When rendering/using game options, read from `game.spec`, NOT `game.specRef`. The `specRef` is only for comparison/revert operations.

**DEPRECATED**: `Game.options` is being removed - user changes go directly into `game.spec`.

**DEPRECATED**: `Game.specs` (array) is being removed - use `game.spec` (single copy) instead.

## Seed File Format

```json
{
  "_key": "65384954",
  "name": "five_points",
  "disp": "Five Points",
  "version": 2,
  "status": "prod",
  "type": "points",
  "min_players": 4,
  "max_players": 4,
  "location_type": "local",
  "teams": true,
  "team_size": 2,
  "long_description": "### Description\n...",
  "options": ["stakes", "use_handicaps", ...],
  "junk": [
    { "name": "low_ball", "value": 2 },
    "birdie"
  ],
  "multipliers": ["pre_double", "double", ...],
  "meta": [
    { "name": "short", "disp": "Short Name", "valueType": "text", "value": "5pts" },
    { "name": "aliases", "disp": "Also Known As", "valueType": "text_array", "value": ["Scotch", "Umbrella"], "searchable": true },
    { "name": "spec_type", "disp": "Scoring Format", "valueType": "menu", "value": "points" },
    { "name": "min_players", "disp": "Minimum Players", "valueType": "num", "value": 4 }
  ]
}
```

## Key Files

### Schema
- `packages/lib/schema/gamespecs.ts` - GameSpec = MapOfOptions
- `packages/lib/schema/options.ts` - Option types (Game, Junk, Multiplier, Meta)
- `packages/lib/schema/games.ts` - Game with spec + specRef

### Import
- `packages/api/src/lib/catalog.ts` - upsertGameSpec creates unified options
- `packages/lib/src/transform/gamespec.ts` - Transform seed format

### Reading Options
- `packages/lib/scoring/option-utils.ts` - getSpecField, getMetaOption, getOptionValueForHole

## Remaining Work

1. **Add `spec` field to Game schema** - Working copy of options (MapOfOptions)
2. **Update useCreateGame** - Copy spec options into game.spec at creation
3. **Update game import (catalog.ts)** - Copy spec options into game.spec
4. **Update GameOptionsList** - Read from game.spec not game.specs
5. **Update other components** - Change from specs/specRef to spec
6. **Remove deprecated fields** - game.options, game.specs (after migration)
