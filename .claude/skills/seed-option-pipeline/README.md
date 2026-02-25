# Seed Option Pipeline

How option fields flow from JSON seed files into Jazz CoValues. **Every new field must be added to ALL layers.**

## The Pipeline (7 layers for junk, 7 for multipliers)

When you add a new field to a seed option JSON file, it must pass through every layer below or it will be silently dropped.

### Layer 1: Seed JSON File

`data/seed/options/<name>.json` — source of truth

### Layer 2: Seed Loader Types

`packages/api/src/utils/seed-loader.ts`
- `SeedJunkOption` interface
- `SeedMultiplierOption` interface
- `SeedGameOption` interface

### Layer 3: V03 Conversion Mapping

`packages/api/src/utils/seed-loader.ts` — `loadSeedSpecsAsV03()`
- Junk mapping: explicitly lists every field to copy
- Multiplier mapping: explicitly lists every field to copy
- **Also**: the return type annotation (junk and multiplier arrays)

### Layer 4: Catalog Types

`packages/api/src/lib/catalog.ts`
- `JunkOptionData` interface
- `MultiplierOptionData` interface

### Layer 5: Option Writer (catalog import)

`packages/api/src/lib/catalog.ts` — `importOptions()` / option creation
- Junk option creation: builds the Jazz-stored object field by field
- Multiplier option creation: same pattern

### Layer 6: Spec-to-Catalog Junk Override

`packages/api/src/lib/catalog.ts` — `importSpecFromSeed()`
- Junk override block: when a spec overrides a junk value, rebuilds the full object
- Multiplier override block: same pattern

### Layer 7 (legacy): V03 Fallback

`packages/api/src/lib/catalog.ts` — `importSpecFromV03()`
- Junk fallback: maps fields from V03 format
- Multiplier fallback: same pattern

## Also Requires Changes

- **Schema** (`packages/lib/schema/options.ts`) — Zod schema requires explicit field addition (see checklist step 2)

## Downstream (no changes needed)

These layers pass fields through generically:
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
