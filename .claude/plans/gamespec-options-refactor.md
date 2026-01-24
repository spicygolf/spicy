# GameSpec Refactor: Unified Options Model

## Overview

Refactor GameSpec to store all configuration as options in a flat key-value map. Start with Five Points validation, then build The Big Game with Stableford quota scoring + gross skins, and finally refactor the web UI for player customization.

## User Requirements Summary

**Decisions Made:**
1. **Schema**: Keep minimal GameSpec wrapper with `name`, `version`, `legacyId` as top-level fields for O(1) lookup, move everything else into options map
2. **The Big Game**: Build quota/Stableford scoring module + multi-pool settlement system (reusable)
3. **Migration**: Fresh start with new Jazz API key (no production data to migrate)
4. **Priority**: Five Points first → The Big Game → Web UI refactor
5. **Aliases**: Searchable with user-customizable display name preference
6. **Seed Data**: Remains source of truth for specs/options (not games/players/rounds)
7. **PostHog**: Disable in `__DEV__` mode

## Current State

### GameSpec Structure
```typescript
// Current
GameSpec = co.map({
  name: string,
  short: string,
  long_description?: string,
  version: number,
  status: "prod" | "dev" | "test",
  spec_type: "points" | "skins",
  min_players: number,
  location_type: "local" | "virtual",
  teamsConfig?: TeamsConfig,
  options?: MapOfOptions,
  legacyId?: string
})
```

### Game References
- `Game.specs: ListOfGameSpecs` (array, only `specs[0]` used)
- Options currently referenced, not copied
- No historical preservation when specs change

### The Big Game Requirements
**From user:**
- **Stableford**: Bogey=1, Par=2, Birdie=3, Eagle=4, Double Eagle=6 points
- **Quota System**: Players have quota (par - handicap pops)
  - Front/back split: Odd quota → +1 to easier nine (by rating)
  - Score vs quota (e.g., 18 points vs 14 quota = +4)
- **Payout**: 75% Stableford (split: front/back/overall), 25% gross skins
  - Each third pays 1st/2nd/3rd by quota performance
  - Skins: Gross birdie/eagle wins, eagles override birdies
- **Settlement**: Full reconciliation system (A owes B $10, B owes C $10 → A pays C $20)

## Phase 1: Five Points Refactor (Validation)

**Goal**: Validate the unified options approach with existing well-tested game

### 1.1 Schema Changes

**File**: `packages/lib/schema/gamespecs.ts`

Keep minimal wrapper, move fields to options:
```typescript
export const GameSpec = co.map({
  // Keep for O(1) lookup/indexing
  name: z.string(),
  version: z.number(),
  legacyId: z.optional(z.string()),
  
  // Everything else in options
  options: MapOfOptions,
});
```

**File**: `packages/lib/schema/options.ts`

Add `MetaOption` type:
```typescript
export interface MetaOption {
  type: "meta";
  name: string;
  disp: string;
  valueType: "bool" | "num" | "menu" | "text" | "text_array";
  value: string | number | boolean | string[];
  choices?: ChoicesList;
  required?: boolean;
  searchable?: boolean; // For aliases
  seq?: number;
}

export type Option = GameOption | JunkOption | MultiplierOption | MetaOption;
```

Meta options to add:
- `short` (text) - Short name/abbreviation
- `long_description` (text) - Markdown description
- `status` (menu: prod/dev/test) - Deployment status
- `spec_type` (menu: points/skins/stableford/quota) - Scoring format
- `min_players` (num) - Minimum players
- `max_players` (num) - Maximum players
- `location_type` (menu: local/virtual) - Where game is played
- `aliases` (text_array) - Searchable alternate names
- `user_display_name` (text) - User's preferred name (overrides `name`)

**File**: `packages/lib/schema/games.ts`

Change to single spec + copy on create:
```typescript
export const Game = co.map({
  start: z.date(),
  name: z.string(),
  scope: GameScope,
  
  // NEW: Single spec reference (not copied - just for display/linking)
  specRef: co.optional(GameSpec),
  
  // NEW: Snapshot of spec options at game creation (copied)
  specSnapshot: co.optional(co.map({
    name: z.string(),
    version: z.number(),
    options: MapOfOptions, // Deep copy of all options
  })),
  
  // Keep deprecated for migration
  specs: co.optional(ListOfGameSpecs),
  
  holes: ListOfGameHoles,
  players: ListOfPlayers,
  rounds: ListOfRoundToGames,
  options: co.optional(MapOfOptions), // Game instance overrides
  legacyId: z.optional(z.string()),
});
```

### 1.2 Update Five Points Spec

**File**: `data/seed/specs/five_points.json`

Convert to unified format:
```json
{
  "name": "Five Points",
  "version": 2,
  "options": {
    "short": {
      "type": "meta",
      "name": "short",
      "disp": "Short Name",
      "valueType": "text",
      "value": "5pts"
    },
    "aliases": {
      "type": "meta",
      "name": "aliases",
      "disp": "Also Known As",
      "valueType": "text_array",
      "value": ["Scotch", "Umbrella"],
      "searchable": true
    },
    "spec_type": {
      "type": "meta",
      "name": "spec_type",
      "disp": "Scoring Format",
      "valueType": "menu",
      "value": "points",
      "choices": ["points", "skins", "stableford", "quota"]
    },
    "min_players": {
      "type": "meta",
      "name": "min_players",
      "disp": "Minimum Players",
      "valueType": "num",
      "value": 2
    },
    "use_handicaps": {
      "type": "game",
      "name": "use_handicaps",
      "disp": "Use Handicaps",
      "valueType": "bool",
      "defaultValue": "true"
    },
    "low_ball": {
      "type": "junk",
      "name": "low_ball",
      "disp": "Low Ball",
      "value": 2,
      "scope": "team",
      "calculation": "best_ball"
    }
    // ... rest of options
  }
}
```

### 1.3 Copy Spec to Game on Creation

**File**: `packages/app/src/hooks/useCreateGame.ts`

Implement deep copy:
```typescript
export function useCreateGame() {
  const createGame = async (name: string, spec: GameSpec) => {
    // ... create group, game
    
    // Create deep copy of spec options
    const copiedOptions: Record<string, Option> = {};
    
    if (spec.options?.$isLoaded) {
      for (const [key, option] of Object.entries(spec.options)) {
        if (!option?.$isLoaded) continue;
        
        // Create new CoMap instance based on option type
        let copiedOption;
        if (option.type === "game") {
          copiedOption = GameOption.create({
            name: option.name,
            disp: option.disp,
            type: "game",
            valueType: option.valueType,
            defaultValue: option.defaultValue,
            value: option.value,
            choices: option.choices,
            seq: option.seq,
          }, { owner: group });
        } else if (option.type === "junk") {
          copiedOption = JunkOption.create({
            // ... copy all junk fields
          }, { owner: group });
        } else if (option.type === "multiplier") {
          copiedOption = MultiplierOption.create({
            // ... copy all multiplier fields
          }, { owner: group });
        } else if (option.type === "meta") {
          copiedOption = MetaOption.create({
            // ... copy all meta fields
          }, { owner: group });
        }
        
        copiedOptions[key] = copiedOption;
      }
    }
    
    // Create snapshot
    const specSnapshot = co.map.create({
      name: spec.name,
      version: spec.version,
      options: copiedOptions,
    }, { owner: group });
    
    game.$jazz.set("specSnapshot", specSnapshot);
    game.$jazz.set("specRef", spec); // Reference for display only
    
    return game;
  };
  
  return { createGame };
}
```

### 1.4 Update Option Resolution

**File**: `packages/lib/scoring/option-utils.ts`

Read from snapshot:
```typescript
export function getOptionValue(
  game: Game,
  hole: GameHole | undefined,
  optionName: string,
  optionType?: OptionType
): any {
  // 1. Check hole-level override
  if (hole?.options?.$isLoaded && hole.options[optionName]) {
    return hole.options[optionName].value;
  }
  
  // 2. Check game-level override
  if (game.options?.$isLoaded && game.options[optionName]) {
    return game.options[optionName].value;
  }
  
  // 3. Check spec snapshot (historical consistency)
  if (game.specSnapshot?.options?.$isLoaded) {
    const option = game.specSnapshot.options[optionName];
    if (option) {
      return option.value ?? option.defaultValue;
    }
  }
  
  // 4. Fallback to specRef for backwards compatibility
  if (game.specRef?.options?.$isLoaded) {
    const option = game.specRef.options[optionName];
    if (option) {
      return option.value ?? option.defaultValue;
    }
  }
  
  return undefined;
}

export function getMetaOption(spec: GameSpec, optionName: string): any {
  if (!spec.options?.$isLoaded) return undefined;
  const option = spec.options[optionName];
  if (option?.type === "meta") {
    return option.value;
  }
  return undefined;
}
```

### 1.5 Update Tests

**File**: `packages/lib/scoring/__tests__/five-points.test.ts`

Update fixture loading to use new schema:
- Load spec with unified options
- Verify option resolution from snapshot
- Ensure scoring matches existing test expectations

### 1.6 PostHog Dev Mode Fix

**File**: `packages/app/src/providers/posthog/index.tsx`

```typescript
// Line 18: Add __DEV__ check
if (__DEV__ || !POSTHOG_API_KEY) {
  if (!__DEV__) {
    console.warn("PostHog analytics disabled: POSTHOG_API_KEY not set...");
  }
  return <>{children}</>;
}
```

## Phase 2: The Big Game Implementation

**Goal**: Build quota/Stableford scoring + multi-pool settlement system

### 2.1 Stableford Junk Options

**File**: `data/seed/options/stableford_double_eagle.json`
```json
{
  "name": "stableford_double_eagle",
  "type": "junk",
  "disp": "Double Eagle (Stableford)",
  "value": 6,
  "scope": "player",
  "based_on": "net",
  "score_to_par": "at_most -3",
  "sub_type": "dot",
  "seq": 10
}
```

**Files**: Similar for eagle (4pts), birdie (3pts), par (2pts), bogey (1pt)

### 2.2 Quota Scoring Module

**File**: `packages/lib/scoring/quota-engine.ts` (NEW)

```typescript
import type { Game, GameHole, Player } from "../schema";

export interface QuotaCalculation {
  playerId: string;
  quota: number;
  quotaFront: number;
  quotaBack: number;
  stablefordPoints: number;
  stablefordFront: number;
  stablefordBack: number;
  quotaPerformance: number; // e.g., +4 means beat quota by 4
  quotaPerformanceFront: number;
  quotaPerformanceBack: number;
}

/**
 * Calculate quota from handicap pops (strokes allocated to holes)
 * Quota = Par - Handicap Pops
 */
export function calculateQuota(
  player: Player,
  game: Game,
  holes: GameHole[]
): { quota: number; quotaFront: number; quotaBack: number } {
  // Get total pops from handicap allocation
  const totalPops = holes.reduce((sum, hole) => {
    const playerHole = hole.players?.find(p => p.player?.id === player.id);
    return sum + (playerHole?.pops ?? 0);
  }, 0);
  
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const quota = totalPar - totalPops;
  
  // Split front/back
  const frontHoles = holes.filter(h => h.number <= 9);
  const backHoles = holes.filter(h => h.number > 9);
  
  const frontPar = frontHoles.reduce((sum, h) => sum + h.par, 0);
  const backPar = backHoles.reduce((sum, h) => sum + h.par, 0);
  const frontPops = frontHoles.reduce((sum, h) => {
    const ph = h.players?.find(p => p.player?.id === player.id);
    return sum + (ph?.pops ?? 0);
  }, 0);
  const backPops = backHoles.reduce((sum, h) => {
    const ph = h.players?.find(p => p.player?.id === player.id);
    return sum + (ph?.pops ?? 0);
  }, 0);
  
  let quotaFront = frontPar - frontPops;
  let quotaBack = backPar - backPops;
  
  // Odd quota adjustment: Add 1 to easier nine
  if (quota % 2 === 1) {
    const frontRating = getMetaOption(game.specSnapshot, "front_nine_rating") ?? 0;
    const backRating = getMetaOption(game.specSnapshot, "back_nine_rating") ?? 0;
    
    if (frontRating > backRating) {
      quotaBack += 1; // Back is easier
    } else {
      quotaFront += 1; // Front is easier
    }
  }
  
  return { quota, quotaFront, quotaBack };
}

/**
 * Calculate quota performance (how much player beat/missed quota)
 */
export function calculateQuotaPerformance(
  stablefordPoints: number,
  quota: number
): number {
  return stablefordPoints - quota;
}

/**
 * Get Stableford points for all players with quota performance
 */
export function calculateAllQuotas(
  game: Game,
  holes: GameHole[],
  players: Player[]
): QuotaCalculation[] {
  return players.map(player => {
    const { quota, quotaFront, quotaBack } = calculateQuota(player, game, holes);
    
    // Sum Stableford junk points
    const stablefordPoints = holes.reduce((sum, hole) => {
      const playerHole = hole.players?.find(p => p.player?.id === player.id);
      const stableford = (playerHole?.junk?.stableford_double_eagle ?? 0) +
                        (playerHole?.junk?.stableford_eagle ?? 0) +
                        (playerHole?.junk?.stableford_birdie ?? 0) +
                        (playerHole?.junk?.stableford_par ?? 0) +
                        (playerHole?.junk?.stableford_bogey ?? 0);
      return sum + stableford;
    }, 0);
    
    const frontHoles = holes.filter(h => h.number <= 9);
    const backHoles = holes.filter(h => h.number > 9);
    
    const stablefordFront = frontHoles.reduce(/* same logic */, 0);
    const stablefordBack = backHoles.reduce(/* same logic */, 0);
    
    return {
      playerId: player.id,
      quota,
      quotaFront,
      quotaBack,
      stablefordPoints,
      stablefordFront,
      stablefordBack,
      quotaPerformance: calculateQuotaPerformance(stablefordPoints, quota),
      quotaPerformanceFront: calculateQuotaPerformance(stablefordFront, quotaFront),
      quotaPerformanceBack: calculateQuotaPerformance(stablefordBack, quotaBack),
    };
  });
}
```

### 2.3 Gross Skins Logic

**File**: `data/seed/options/gross_skin.json`
```json
{
  "name": "gross_skin",
  "type": "junk",
  "disp": "Skin (Gross Birdie)",
  "value": 1,
  "scope": "player",
  "based_on": "gross",
  "score_to_par": "at_most -1",
  "sub_type": "skin",
  "limit": "one_per_hole",
  "logic": "{'rankWithTies': [1, 1]}"
}
```

**File**: `data/seed/options/gross_eagle_skin.json`
```json
{
  "name": "gross_eagle_skin",
  "type": "junk",
  "disp": "Eagle Skin (Overrides Birdie)",
  "value": 999,
  "scope": "player",
  "based_on": "gross",
  "score_to_par": "at_most -2",
  "sub_type": "skin",
  "limit": "one_per_hole",
  "logic": "{'rankWithTies': [1, 1]}",
  "invalidates": ["gross_skin"]
}
```

**File**: `packages/lib/scoring/junk-engine.ts`

Add invalidation logic:
```typescript
export function evaluateJunkForHole(/* ... */) {
  const awarded: Record<string, JunkAward[]> = {};
  
  // Evaluate all junk options
  for (const option of junkOptions) {
    // ... existing evaluation
    if (playerMeetsCondition) {
      awarded[option.name] = [...];
    }
  }
  
  // Handle invalidations (eagle skins override birdie skins)
  for (const [junkName, awards] of Object.entries(awarded)) {
    const option = junkOptions.find(o => o.name === junkName);
    if (option?.invalidates) {
      for (const invalidatedName of option.invalidates) {
        if (awards.length > 0) {
          delete awarded[invalidatedName];
        }
      }
    }
  }
  
  return awarded;
}
```

### 2.4 Multi-Pool Settlement System

**File**: `packages/lib/schema/settlement.ts` (NEW)

```typescript
import { co, z } from "jazz-tools";

export interface PaymentPool {
  name: string; // "Stableford Front", "Stableford Back", "Skins"
  totalAmount: number;
  payouts: Payout[];
}

export interface Payout {
  playerId: string;
  amount: number;
  place: number; // 1st, 2nd, 3rd
}

export interface Debt {
  from: string; // player ID
  to: string; // player ID
  amount: number;
}

export const Settlement = co.map({
  gameId: z.string(),
  pools: co.list(co.map({
    name: z.string(),
    totalAmount: z.number(),
    payouts: co.list(co.map({
      playerId: z.string(),
      amount: z.number(),
      place: z.number(),
    })),
  })),
  debts: co.list(co.map({
    from: z.string(),
    to: z.string(),
    amount: z.number(),
  })),
  reconciledDebts: co.list(co.map({
    from: z.string(),
    to: z.string(),
    amount: z.number(),
  })),
});

export type Settlement = co.loaded<typeof Settlement>;
```

**File**: `packages/lib/scoring/settlement-engine.ts` (NEW)

```typescript
import type { Settlement, PaymentPool, Debt } from "../schema/settlement";
import type { QuotaCalculation } from "./quota-engine";

export function calculatePayoutPools(
  quotas: QuotaCalculation[],
  skinsWon: Record<string, number>, // playerId → skin count
  potTotal: number
): PaymentPool[] {
  const stablefordPot = potTotal * 0.75;
  const skinsPot = potTotal * 0.25;
  
  const frontPool = stablefordPot / 3;
  const backPool = stablefordPot / 3;
  const overallPool = stablefordPot / 3;
  
  // Rank by quota performance
  const frontRanked = [...quotas].sort((a, b) => 
    b.quotaPerformanceFront - a.quotaPerformanceFront
  );
  const backRanked = [...quotas].sort((a, b) => 
    b.quotaPerformanceBack - a.quotaPerformanceBack
  );
  const overallRanked = [...quotas].sort((a, b) => 
    b.quotaPerformance - a.quotaPerformance
  );
  
  return [
    createPoolPayouts("Stableford Front", frontPool, frontRanked),
    createPoolPayouts("Stableford Back", backPool, backRanked),
    createPoolPayouts("Stableford Overall", overallPool, overallRanked),
    createSkinsPayouts("Skins", skinsPot, skinsWon),
  ];
}

function createPoolPayouts(
  name: string,
  totalAmount: number,
  ranked: QuotaCalculation[]
): PaymentPool {
  // Simple 50/30/20 split for 1st/2nd/3rd
  const payouts = [
    { playerId: ranked[0].playerId, amount: totalAmount * 0.5, place: 1 },
    { playerId: ranked[1].playerId, amount: totalAmount * 0.3, place: 2 },
    { playerId: ranked[2].playerId, amount: totalAmount * 0.2, place: 3 },
  ];
  
  return { name, totalAmount, payouts };
}

export function reconcileDebts(pools: PaymentPool[]): Debt[] {
  // Calculate net position for each player
  const netPositions: Record<string, number> = {};
  
  for (const pool of pools) {
    for (const payout of pool.payouts) {
      netPositions[payout.playerId] = 
        (netPositions[payout.playerId] ?? 0) + payout.amount;
    }
  }
  
  // Split into creditors and debtors
  const creditors = Object.entries(netPositions)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);
  const debtors = Object.entries(netPositions)
    .filter(([_, amount]) => amount < 0)
    .map(([id, amt]) => [id, -amt] as [string, number])
    .sort((a, b) => b[1] - a[1]);
  
  // Greedy reconciliation
  const debts: Debt[] = [];
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const [creditorId, creditAmount] = creditors[i];
    const [debtorId, debtAmount] = debtors[j];
    
    const payment = Math.min(creditAmount, debtAmount);
    
    debts.push({ from: debtorId, to: creditorId, amount: payment });
    
    creditors[i][1] -= payment;
    debtors[j][1] -= payment;
    
    if (creditors[i][1] === 0) i++;
    if (debtors[j][1] === 0) j++;
  }
  
  return debts;
}
```

### 2.5 The Big Game Spec

**File**: `data/seed/specs/the_big_game.json`
```json
{
  "name": "The Big Game",
  "version": 1,
  "options": {
    "short": { "type": "meta", "valueType": "text", "value": "BigGame" },
    "aliases": { "type": "meta", "valueType": "text_array", "value": ["Chicago"], "searchable": true },
    "spec_type": { "type": "meta", "valueType": "menu", "value": "quota" },
    "min_players": { "type": "meta", "valueType": "num", "value": 2 },
    "max_players": { "type": "meta", "valueType": "num", "value": 20 },
    
    "use_handicaps": { "type": "game", "valueType": "bool", "defaultValue": "true" },
    
    "stableford_double_eagle": { "...": "..." },
    "stableford_eagle": { "...": "..." },
    "stableford_birdie": { "...": "..." },
    "stableford_par": { "...": "..." },
    "stableford_bogey": { "...": "..." },
    
    "gross_skin": { "...": "..." },
    "gross_eagle_skin": { "...": "..." },
    
    "pot_total": { "type": "game", "valueType": "num", "defaultValue": "100" },
    "stableford_percentage": { "type": "game", "valueType": "num", "defaultValue": "75" },
    "skins_percentage": { "type": "game", "valueType": "num", "defaultValue": "25" }
  }
}
```

### 2.6 Integrate into Scoring Pipeline

**File**: `packages/lib/scoring/pipeline.ts`

```typescript
import { calculateAllQuotas } from "./quota-engine";
import { calculatePayoutPools, reconcileDebts } from "./settlement-engine";

export async function scoreGame(game: Game) {
  // ... existing scoring stages
  
  const specType = getMetaOption(game.specSnapshot, "spec_type");
  
  if (specType === "quota") {
    // Run quota calculations
    const quotas = calculateAllQuotas(game, game.holes, game.players);
    
    // Calculate skins won
    const skinsWon: Record<string, number> = {};
    for (const hole of game.holes) {
      for (const [junkName, awards] of Object.entries(hole.junk ?? {})) {
        if (junkName.includes("skin")) {
          for (const award of awards) {
            skinsWon[award.playerId] = (skinsWon[award.playerId] ?? 0) + 1;
          }
        }
      }
    }
    
    // Calculate settlement
    const potTotal = getOptionValue(game, undefined, "pot_total") ?? 100;
    const pools = calculatePayoutPools(quotas, skinsWon, potTotal);
    const debts = reconcileDebts(pools);
    
    // Store settlement
    const settlement = Settlement.create({
      gameId: game.id,
      pools,
      debts,
      reconciledDebts: debts,
    }, { owner: game.$jazz.owner });
    
    game.$jazz.set("settlement", settlement);
  }
  
  return game;
}
```

## Phase 3: Web UI Refactor

**Goal**: Player-facing customization on large screen, admin tools separated

### 3.1 Add React Router

**File**: `packages/web/package.json`
```json
{
  "dependencies": {
    "react-router-dom": "6.26.0"
  }
}
```

**File**: `packages/web/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PlayerApp } from "./player/PlayerApp";
import { AdminApp } from "./admin/AdminApp";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<PlayerApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 3.2 Reorganize Components

**New Directory Structure:**
```text
packages/web/src/
├── player/           # Player-facing UI
│   ├── PlayerApp.tsx
│   ├── pages/
│   │   ├── SpecBrowser.tsx
│   │   ├── SpecEditor.tsx
│   │   ├── GameList.tsx
│   │   └── Profile.tsx
│   └── components/
│       ├── SpecCard.tsx
│       ├── OptionEditor.tsx
│       └── AliasSearch.tsx
├── admin/            # Admin/dev tools
│   ├── AdminApp.tsx
│   └── tabs/
│       ├── ImportTab.tsx
│       ├── BrowseTab.tsx
│       ├── ScoringTab.tsx
│       ├── MigrationTab.tsx
│       └── ProfileTab.tsx
├── shared/           # Shared components
│   ├── Navigation.tsx
│   └── Layout.tsx
└── auth/
    └── JazzAuth.tsx
```

### 3.3 Player Spec Browser with Alias Search

**File**: `packages/web/src/player/pages/SpecBrowser.tsx`

```typescript
import { useState } from "react";
import { useGamespecs } from "@/hooks/useGamespecs";

export function SpecBrowser() {
  const { specs } = useGamespecs();
  const [search, setSearch] = useState("");
  
  const filteredSpecs = specs?.filter(spec => {
    const searchLower = search.toLowerCase();
    const name = spec.name.toLowerCase();
    const aliases = getMetaOption(spec, "aliases") ?? [];
    const userDisplayName = getMetaOption(spec, "user_display_name");
    
    return name.includes(searchLower) ||
           (userDisplayName?.toLowerCase().includes(searchLower)) ||
           aliases.some((alias: string) => alias.toLowerCase().includes(searchLower));
  });
  
  return (
    <div>
      <input 
        value={search} 
        onChange={e => setSearch(e.target.value)}
        placeholder="Search specs (try 'Scotch')"
      />
      
      {filteredSpecs?.map(spec => (
        <SpecCard 
          key={spec.id}
          spec={spec}
          displayName={getMetaOption(spec, "user_display_name") ?? spec.name}
        />
      ))}
    </div>
  );
}
```

### 3.4 Spec Editor with Option CRUD

**File**: `packages/web/src/player/pages/SpecEditor.tsx`

Full-featured editor for all option types:
- Meta options (name, aliases, etc.)
- Game options (handicaps, settings)
- Junk options (table view with add/remove/edit)
- Multiplier options (table view)
- Visual JSON logic builder (placeholder for future)

### 3.5 User Display Name Preference

**File**: `packages/lib/schema/accounts.ts`

Add to PlayerAccountRoot:
```typescript
export const PlayerAccountRoot = co.map({
  specs: co.optional(ListOfGameSpecs),
  specPreferences: co.optional(co.record(z.string(), co.map({
    displayName: z.optional(z.string()), // User's preferred name
    favorited: z.optional(z.boolean()),
  }))),
  // ... rest
});
```

When displaying specs, check preferences first:
```typescript
function getDisplayName(spec: GameSpec, userId: string): string {
  const prefs = user.root.specPreferences?.[spec.id];
  return prefs?.displayName ?? getMetaOption(spec, "user_display_name") ?? spec.name;
}
```

## Critical Files Summary

### Schema Changes
- `packages/lib/schema/gamespecs.ts` - Minimal wrapper
- `packages/lib/schema/options.ts` - Add MetaOption
- `packages/lib/schema/games.ts` - Single spec + snapshot
- `packages/lib/schema/settlement.ts` - NEW settlement system
- `packages/lib/schema/accounts.ts` - Spec preferences

### Scoring Engine
- `packages/lib/scoring/quota-engine.ts` - NEW quota/Stableford
- `packages/lib/scoring/settlement-engine.ts` - NEW multi-pool payouts
- `packages/lib/scoring/junk-engine.ts` - Add invalidation logic
- `packages/lib/scoring/option-utils.ts` - Read from snapshot
- `packages/lib/scoring/pipeline.ts` - Integrate quota/settlement

### Game Creation
- `packages/app/src/hooks/useCreateGame.ts` - Deep copy spec to snapshot

### Seed Data
- `data/seed/specs/five_points.json` - Convert to unified
- `data/seed/specs/the_big_game.json` - NEW
- `data/seed/options/stableford_*.json` - NEW (5 files)
- `data/seed/options/gross_skin.json` - NEW
- `data/seed/options/gross_eagle_skin.json` - NEW

### Web UI
- `packages/web/src/App.tsx` - Add router
- `packages/web/src/player/` - NEW player app
- `packages/web/src/admin/` - Refactored admin tools
- `packages/web/src/player/pages/SpecBrowser.tsx` - Alias search
- `packages/web/src/player/pages/SpecEditor.tsx` - Option CRUD

### Tests
- `packages/lib/scoring/__tests__/five-points.test.ts` - Update for unified schema
- `packages/lib/scoring/__tests__/quota-engine.test.ts` - NEW
- `packages/lib/scoring/__tests__/settlement-engine.test.ts` - NEW

### Config
- `packages/app/src/providers/posthog/index.tsx` - Disable in `__DEV__`

## Verification Plan

### Phase 1 Verification (Five Points)
1. Run existing Five Points tests - all pass
2. Create new game from Five Points spec
3. Verify `game.specSnapshot` has copied options
4. Play test round, verify scoring matches expected
5. Edit spec in catalog, verify game scoring unchanged (snapshot isolation)
6. Verify PostHog disabled in dev mode

### Phase 2 Verification (The Big Game)
1. Create The Big Game from spec
2. Play 18-hole test round with 4 players
3. Verify Stableford points: bogey=1, par=2, birdie=3, eagle=4
4. Verify quota calculated correctly (including front/back odd split)
5. Verify gross skins awarded (birdie/eagle, eagles override)
6. Verify settlement: 4 pools (front/back/overall/skins)
7. Verify reconciliation: debts minimized
8. Check payout percentages: 75% Stableford, 25% Skins

### Phase 3 Verification (Web UI)
1. Browse specs with alias search - find "Scotch" → Five Points
2. Set custom display name "My Five Points"
3. Create custom junk option in spec editor
4. Clone spec, verify independent copy
5. Admin tools still accessible at `/admin`
6. All admin functionality preserved

## Success Criteria

- [ ] Five Points converted to unified options model
- [ ] Five Points tests pass (80-90% complete → 100%)
- [ ] Game creation copies spec to snapshot (historical preservation)
- [ ] PostHog disabled in `__DEV__` mode
- [ ] The Big Game spec created with quota/Stableford + skins
- [ ] Quota engine calculates front/back/overall with odd split
- [ ] Settlement engine calculates 4 pools with reconciliation
- [ ] Gross skins work (eagles override birdies)
- [ ] Web UI has player app (/) and admin app (/admin)
- [ ] Alias search finds specs by alternate names
- [ ] User can set custom display name per spec
- [ ] Spec editor allows full option CRUD
- [ ] All TypeScript checks pass: `bun tsc`
- [ ] All quality checks pass: `bun format`, `bun lint`

## Implementation Order

1. **Phase 1**: Five Points refactor (validation)
2. **Phase 2**: The Big Game implementation
3. **Phase 3**: Web UI refactor

## Notes

- Fresh Jazz start: No migration code needed for old data
- Seed data remains source of truth for specs/options
- Games/players/rounds can be imported via existing ArangoDB import
- Settlement system is reusable for future complex games
- Alias system supports both search and custom display names
