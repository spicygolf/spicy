# GameSpec Refactor: Unified Options Model

## Overview

GameSpec is a unified options map. ALL data is stored as Option entries in the `options` map - there are no top-level data fields.

## Current State (Implemented)

### GameSpec Schema
```typescript
// packages/lib/schema/gamespecs.ts
export const GameSpec = co.map({
  options: co.optional(MapOfOptions),
});
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

### Game References
- `Game.specRef` - Reference to catalog spec (for display/diff/revert)
- `Game.options` - Game-level option overrides
- `GameHole.options` - Per-hole option overrides

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

The `upsertGameSpec` function transforms this into a unified options map where:
- Top-level fields (name, version, status, etc.) become meta options
- Options array references become game options (looked up from catalog)
- Junk array becomes junk options (with value overrides)
- Multipliers array becomes multiplier options
- Meta array items are added as meta options

## Key Files

### Schema
- `packages/lib/schema/gamespecs.ts` - GameSpec with options-only
- `packages/lib/schema/options.ts` - Option types (Game, Junk, Multiplier, Meta)
- `packages/lib/schema/games.ts` - Game with specRef

### Import
- `packages/api/src/lib/catalog.ts` - upsertGameSpec creates unified options
- `packages/lib/src/transform/gamespec.ts` - Transform seed format

### Reading Options
- `packages/lib/scoring/option-utils.ts` - getSpecField, getMetaOption, getOptionValueForHole

## Remaining Work

1. **Fix TypeScript errors** - Update all code that reads deprecated top-level fields
2. **Test import flow** - Reset catalog, import specs, verify options structure
3. **The Big Game** - Build quota/Stableford scoring (Phase 2)
4. **Web UI** - Player customization interface (Phase 3)
