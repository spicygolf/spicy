# Seed Option Pipeline

How option fields flow from JSON seed files into Jazz CoValues. **Every new field must be added to ALL layers.**

## The Pipeline (6 layers for junk, 5 for multipliers)

When you add a new field to a seed option JSON file, it must pass through every layer below or it will be silently dropped.

### Layer 1: Seed JSON File
`data/seed/options/<name>.json` — source of truth

### Layer 2: Seed Loader Types
`packages/api/src/utils/seed-loader.ts`
- `SeedJunkOption` interface (~line 32)
- `SeedMultiplierOption` interface (~line 50)
- `SeedGameOption` interface (~line 22)

### Layer 3: V03 Conversion Mapping
`packages/api/src/utils/seed-loader.ts` — `loadSeedSpecsAsV03()`
- Junk mapping (~line 326): explicitly lists every field to copy
- Multiplier mapping (~line 351): explicitly lists every field to copy
- **Also**: the return type annotation (~line 398 for junk, ~line 414 for multipliers)

### Layer 4: Catalog Types
`packages/api/src/lib/catalog.ts`
- `JunkOptionData` interface (~line 178)
- `MultiplierOptionData` interface (~line 198)

### Layer 5: Option Writer (catalog import)
`packages/api/src/lib/catalog.ts` — `importOptions()` / option creation
- Junk option creation (~line 888): builds the Jazz-stored object field by field
- Multiplier option creation (~line 920): same pattern

### Layer 6: Spec-to-Catalog Junk Override
`packages/api/src/lib/catalog.ts` — `importSpecFromSeed()`
- Junk override block (~line 687): when a spec overrides a junk value, rebuilds the full object
- Multiplier override block (~line 731): same pattern

### Layer 7 (legacy): V03 Fallback
`packages/api/src/lib/catalog.ts` — `importSpecFromV03()`
- Junk fallback (~line 1784): maps fields from V03 format
- Multiplier fallback (~line 1808): same pattern

## Downstream (no changes needed)

These layers pass fields through generically:
- **Schema** (`packages/lib/schema/options.ts`) — Zod schema, add field here too
- **`copySpecOptions()`** (`packages/lib/scoring/option-utils.ts`) — uses `deepClone`, passes all fields
- **`resetSpecFromRef()`** — copies from catalog spec, passes all fields
- **Scoring pipeline** (`packages/lib/scoring/pipeline.ts`) — reads options as-is from Jazz

## Checklist for Adding a New Option Field

1. [ ] Add to seed JSON file (`data/seed/options/`)
2. [ ] Add to Zod schema (`packages/lib/schema/options.ts`)
3. [ ] Add to `Seed*Option` interface (`packages/api/src/utils/seed-loader.ts`)
4. [ ] Add to `loadSeedSpecsAsV03()` field mapping AND return type (`seed-loader.ts`)
5. [ ] Add to `*OptionData` interface (`packages/api/src/lib/catalog.ts`)
6. [ ] Add to option creation in `importOptions()` (`catalog.ts`)
7. [ ] Add to spec override block in `importSpecFromSeed()` (`catalog.ts`)
8. [ ] Add to V03 fallback in `importSpecFromV03()` (`catalog.ts`)
9. [ ] Add to scoring engine evaluation (`packages/lib/scoring/junk-engine.ts` or similar)
10. [ ] Re-import specs via web admin and reset game specs to pick up new fields

## Why This Happens

Options are stored as plain JSON blobs in Jazz `co.record()`. Each layer in the import pipeline explicitly enumerates fields rather than passing through the raw JSON object. This means new fields are silently dropped unless added to every layer.

The `copySpecOptions()` and `resetSpecFromRef()` functions use `deepClone()` so they don't have this problem — but the initial import into the catalog does.
