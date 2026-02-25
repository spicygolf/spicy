/**
 * Skins Scoring Tests
 *
 * Tests for gross skins behavior in Big Game (quota) scoring:
 * - Chop: when multiple players birdie, no skin is awarded
 * - Eagle override: eagle skin supersedes birdie skin
 * - Sole birdie: only player to birdie wins the skin
 * - Ace/albatross: wins entire skins pool (pool sweep)
 */

import { describe, expect, it } from "bun:test";
import { evaluateJunkForHole, resolvePoolSweepSkins } from "../junk-engine";
import type {
  HoleInfo,
  HoleResult,
  PlayerHoleResult,
  ScoringContext,
} from "../types";

// =============================================================================
// Test Helpers
// =============================================================================

const PAR_4_HOLE: HoleInfo = {
  hole: "1",
  par: 4,
  allocation: 9,
  yards: 380,
};

function makePlayer(
  playerId: string,
  gross: number,
  par: number,
  rank: number,
  tieCount: number,
): PlayerHoleResult {
  return {
    playerId,
    hasScore: gross > 0,
    gross,
    pops: 0,
    net: gross,
    scoreToPar: gross - par,
    netToPar: gross - par,
    rank,
    tieCount,
    junk: [],
    multipliers: [],
    points: 0,
  };
}

function makeHoleResult(
  players: Record<string, PlayerHoleResult>,
  holeNum = "1",
  par = 4,
): HoleResult {
  return {
    hole: holeNum,
    holeInfo: { hole: holeNum, par, allocation: 9, yards: 380 },
    players,
    teams: {},
  };
}

/** Base skin options shared by all contexts */
const SKIN_OPTIONS = {
  gross_ace_skin: {
    name: "gross_ace_skin",
    disp: "Ace (wins pool)",
    type: "junk" as const,
    sub_type: "skin" as const,
    value: 1,
    seq: 7,
    scope: "player" as const,
    icon: "trophy",
    based_on: "gross" as const,
    limit: "one_per_hole",
    better: "lower" as const,
    gross_score: "exactly 1",
    pool_sweep: true,
  },
  gross_albatross_skin: {
    name: "gross_albatross_skin",
    disp: "Albatross (wins pool)",
    type: "junk" as const,
    sub_type: "skin" as const,
    value: 1,
    seq: 8,
    scope: "player" as const,
    icon: "trophy",
    based_on: "gross" as const,
    limit: "one_per_hole",
    better: "lower" as const,
    score_to_par: "at_most -3",
    pool_sweep: true,
  },
  gross_eagle_skin: {
    name: "gross_eagle_skin",
    disp: "Eagle Skin (Overrides Birdie)",
    type: "junk" as const,
    sub_type: "skin" as const,
    value: 1,
    seq: 9,
    scope: "player" as const,
    icon: "trophy",
    based_on: "gross" as const,
    limit: "one_per_hole",
    better: "lower" as const,
    score_to_par: "at_most -2",
    logic: '{"rankWithTies": [1, 1]}',
  },
  gross_skin: {
    name: "gross_skin",
    disp: "Skin (Gross Birdie)",
    type: "junk" as const,
    sub_type: "skin" as const,
    value: 1,
    seq: 10,
    scope: "player" as const,
    icon: "trophy",
    based_on: "gross" as const,
    limit: "one_per_hole",
    better: "lower" as const,
    score_to_par: "at_most -1",
    logic: '{"rankWithTies": [1, 1]}',
  },
};

/** Minimal ScoringContext with gross skin + eagle skin junk options */
function makeSkinsScoringCtx(): ScoringContext {
  return {
    options: {
      gross_skin: SKIN_OPTIONS.gross_skin,
      gross_eagle_skin: SKIN_OPTIONS.gross_eagle_skin,
    },
    // Remaining fields are not accessed by evaluateJunkForHole
    game: {} as ScoringContext["game"],
    gameSpec: {} as ScoringContext["gameSpec"],
    gameHoles: [],
    rounds: [],
    holeInfoMap: new Map(),
    playerHandicaps: new Map(),
    teamsPerHole: new Map(),
    playerTeamMap: new Map(),
    scoreboard: {
      holes: {},
      cumulative: { players: {}, teams: {} },
      meta: {
        gameId: "test",
        holesPlayed: ["1"],
        hasTeams: false,
        pointsPerHole: 0,
      },
    },
  };
}

/** Full Big Game context with all skin tiers (sweep / eagle / birdie) */
function makeFullSkinsScoringCtx(): ScoringContext {
  return {
    ...makeSkinsScoringCtx(),
    options: { ...SKIN_OPTIONS },
  };
}

function getPlayerJunkNames(result: HoleResult, playerId: string): string[] {
  return result.players[playerId]?.junk.map((j) => j.name) ?? [];
}

// =============================================================================
// Tests
// =============================================================================

describe("Skins scoring — chop behavior", () => {
  it("awards skin to sole birdie maker", () => {
    // Player A birdies (3 on par 4), Player B pars (4 on par 4)
    // Player A: rank 1, tieCount 1 (sole leader)
    const holeResult = makeHoleResult({
      A: makePlayer("A", 3, 4, 1, 1),
      B: makePlayer("B", 4, 4, 2, 1),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).toContain("gross_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
  });

  it("chops skin when two players birdie (no skin awarded)", () => {
    // Player A and B both birdie (3 on par 4)
    // Both: rank 1, tieCount 2
    const holeResult = makeHoleResult({
      A: makePlayer("A", 3, 4, 1, 2),
      B: makePlayer("B", 3, 4, 1, 2),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
  });

  it("chops skin when three players birdie", () => {
    // Three players birdie: rank 1, tieCount 3
    const holeResult = makeHoleResult({
      A: makePlayer("A", 3, 4, 1, 3),
      B: makePlayer("B", 3, 4, 1, 3),
      C: makePlayer("C", 3, 4, 1, 3),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "C")).not.toContain("gross_skin");
  });

  it("does not award skin when best score is par (no birdie)", () => {
    // Both players par
    const holeResult = makeHoleResult({
      A: makePlayer("A", 4, 4, 1, 2),
      B: makePlayer("B", 4, 4, 1, 2),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
  });

  it("awards skin to sole birdie among many players", () => {
    // Simulates 4 players: A birdies, B/C/D par or worse
    const holeResult = makeHoleResult({
      A: makePlayer("A", 3, 4, 1, 1),
      B: makePlayer("B", 4, 4, 2, 2),
      C: makePlayer("C", 4, 4, 2, 2),
      D: makePlayer("D", 5, 4, 4, 1),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).toContain("gross_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "C")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "D")).not.toContain("gross_skin");
  });
});

describe("Skins scoring — eagle overrides birdie", () => {
  it("eagle skin awarded to sole eagle maker", () => {
    // Player A eagles (2 on par 4), Player B birdies (3 on par 4)
    // A: rank 1, tieCount 1
    // B: rank 2, tieCount 1
    const holeResult = makeHoleResult({
      A: makePlayer("A", 2, 4, 1, 1),
      B: makePlayer("B", 3, 4, 2, 1),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).toContain("gross_eagle_skin");
    // Eagle overrides birdie: B should NOT get birdie skin
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
  });

  it("eagle player does not also get birdie skin", () => {
    // Player A eagles — should only get eagle_skin, not gross_skin too
    const holeResult = makeHoleResult({
      A: makePlayer("A", 2, 4, 1, 1),
      B: makePlayer("B", 4, 4, 2, 1),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).toContain("gross_eagle_skin");
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_skin");
  });

  it("two eagles chop — no eagle skin or birdie skin awarded", () => {
    // Player A and B both eagle: rank 1, tieCount 2
    const holeResult = makeHoleResult({
      A: makePlayer("A", 2, 4, 1, 2),
      B: makePlayer("B", 2, 4, 1, 2),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_eagle_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_eagle_skin");
    // And no birdie skins either
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
  });

  it("eagle wins over birdie — birdie player gets nothing", () => {
    // A eagles, B and C birdie — eagle overrides all birdie skins
    const holeResult = makeHoleResult({
      A: makePlayer("A", 2, 4, 1, 1),
      B: makePlayer("B", 3, 4, 2, 2),
      C: makePlayer("C", 3, 4, 2, 2),
      D: makePlayer("D", 4, 4, 4, 1),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).toContain("gross_eagle_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "C")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "D")).not.toContain("gross_skin");
  });

  it("no scores entered — no skins awarded", () => {
    const holeResult = makeHoleResult({
      A: makePlayer("A", 0, 4, 0, 0),
      B: makePlayer("B", 0, 4, 0, 0),
    });

    const result = evaluateJunkForHole(holeResult, makeSkinsScoringCtx());
    expect(getPlayerJunkNames(result, "A")).toEqual([]);
    expect(getPlayerJunkNames(result, "B")).toEqual([]);
  });
});

// =============================================================================
// Ace and Albatross Skins
// =============================================================================

describe("Skins scoring — ace (hole-in-one)", () => {
  it("ace on par 3 awards gross_ace_skin", () => {
    // Player A aces par 3 (gross=1, scoreToPar=-2), Player B pars
    const holeResult = makeHoleResult(
      {
        A: makePlayer("A", 1, 3, 1, 1),
        B: makePlayer("B", 3, 3, 2, 1),
      },
      "1",
      3,
    );

    const ctx = makeFullSkinsScoringCtx();
    const result = evaluateJunkForHole(holeResult, ctx);
    expect(getPlayerJunkNames(result, "A")).toContain("gross_ace_skin");
  });

  it("ace on par 4 awards gross_ace_skin", () => {
    // Player A aces par 4 (gross=1, scoreToPar=-3)
    const holeResult = makeHoleResult(
      {
        A: makePlayer("A", 1, 4, 1, 1),
        B: makePlayer("B", 4, 4, 2, 1),
      },
      "1",
      4,
    );

    const ctx = makeFullSkinsScoringCtx();
    const result = evaluateJunkForHole(holeResult, ctx);
    expect(getPlayerJunkNames(result, "A")).toContain("gross_ace_skin");
  });

  it("ace overrides eagle and birdie skins on same hole", () => {
    // Player A aces — should get ace skin, not eagle or birdie
    const holeResult = makeHoleResult(
      {
        A: makePlayer("A", 1, 3, 1, 1),
        B: makePlayer("B", 3, 3, 2, 1),
      },
      "1",
      3,
    );

    const ctx = makeFullSkinsScoringCtx();
    const result = evaluateJunkForHole(holeResult, ctx);
    expect(getPlayerJunkNames(result, "A")).toContain("gross_ace_skin");
    expect(getPlayerJunkNames(result, "A")).not.toContain(
      "gross_albatross_skin",
    );
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_eagle_skin");
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_skin");
    // B should also get no skins
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
  });

  it("ace on par 4 gets ace skin only, not albatross (dedup within sweep tier)", () => {
    // Ace on par 4: gross=1, scoreToPar=-3 qualifies for both ace AND albatross.
    // Ace is more specific — albatross should be deduplicated for this player.
    const holeResult = makeHoleResult(
      {
        A: makePlayer("A", 1, 4, 1, 1),
        B: makePlayer("B", 4, 4, 2, 1),
      },
      "1",
      4,
    );

    const ctx = makeFullSkinsScoringCtx();
    const result = evaluateJunkForHole(holeResult, ctx);
    expect(getPlayerJunkNames(result, "A")).toContain("gross_ace_skin");
    expect(getPlayerJunkNames(result, "A")).not.toContain(
      "gross_albatross_skin",
    );
  });

  it("ace and albatross by different players on same hole — both kept (split pot)", () => {
    // Par 5: Player A aces (gross=1, scoreToPar=-4), Player B albatrosses (gross=2, scoreToPar=-3)
    const holeResult = makeHoleResult(
      {
        A: makePlayer("A", 1, 5, 1, 1),
        B: makePlayer("B", 2, 5, 2, 1),
      },
      "1",
      5,
    );

    const ctx = makeFullSkinsScoringCtx();
    const result = evaluateJunkForHole(holeResult, ctx);
    // A gets ace (deduped from albatross), B gets albatross — both sweep skins survive
    expect(getPlayerJunkNames(result, "A")).toContain("gross_ace_skin");
    expect(getPlayerJunkNames(result, "A")).not.toContain(
      "gross_albatross_skin",
    );
    expect(getPlayerJunkNames(result, "B")).toContain("gross_albatross_skin");
    // Neither should have eagle or birdie skins
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_eagle_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_eagle_skin");
  });

  it("eagle (gross=2) does NOT get ace skin", () => {
    // Player A eagles (gross=2 on par 4) — not an ace
    const holeResult = makeHoleResult({
      A: makePlayer("A", 2, 4, 1, 1),
      B: makePlayer("B", 4, 4, 2, 1),
    });

    const ctx = makeFullSkinsScoringCtx();
    const result = evaluateJunkForHole(holeResult, ctx);
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_ace_skin");
    expect(getPlayerJunkNames(result, "A")).toContain("gross_eagle_skin");
  });
});

describe("Skins scoring — albatross (double eagle)", () => {
  it("albatross on par 5 awards gross_albatross_skin", () => {
    // Player A scores 2 on par 5 (scoreToPar=-3)
    const holeResult = makeHoleResult(
      {
        A: makePlayer("A", 2, 5, 1, 1),
        B: makePlayer("B", 5, 5, 2, 1),
      },
      "1",
      5,
    );

    const ctx = makeFullSkinsScoringCtx();
    const result = evaluateJunkForHole(holeResult, ctx);
    expect(getPlayerJunkNames(result, "A")).toContain("gross_albatross_skin");
  });

  it("albatross overrides eagle and birdie skins", () => {
    const holeResult = makeHoleResult(
      {
        A: makePlayer("A", 2, 5, 1, 1),
        B: makePlayer("B", 4, 5, 2, 1), // birdie
      },
      "1",
      5,
    );

    const ctx = makeFullSkinsScoringCtx();
    const result = evaluateJunkForHole(holeResult, ctx);
    expect(getPlayerJunkNames(result, "A")).toContain("gross_albatross_skin");
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_eagle_skin");
    expect(getPlayerJunkNames(result, "A")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(result, "B")).not.toContain("gross_skin");
  });

  it("eagle on par 4 (scoreToPar=-2) does NOT get albatross skin", () => {
    // Eagle is only -2, not -3
    const holeResult = makeHoleResult({
      A: makePlayer("A", 2, 4, 1, 1),
      B: makePlayer("B", 4, 4, 2, 1),
    });

    const ctx = makeFullSkinsScoringCtx();
    const result = evaluateJunkForHole(holeResult, ctx);
    expect(getPlayerJunkNames(result, "A")).not.toContain(
      "gross_albatross_skin",
    );
    expect(getPlayerJunkNames(result, "A")).toContain("gross_eagle_skin");
  });
});

describe("Skins scoring — pool sweep", () => {
  /** Helper: get all junk option definitions for resolvePoolSweepSkins */
  function getJunkOptions() {
    return Object.values(SKIN_OPTIONS);
  }

  it("ace on hole 3 removes birdie skin from hole 1", () => {
    // Hole 1: Player A birdies (sole birdie skin)
    const hole1 = makeHoleResult(
      {
        A: makePlayer("A", 3, 4, 1, 1),
        B: makePlayer("B", 4, 4, 2, 1),
      },
      "1",
    );
    // Award birdie skin to A on hole 1
    hole1.players.A!.junk.push({
      name: "gross_skin",
      value: 1,
      playerId: "A",
    });

    // Hole 3: Player B aces par 3
    const hole3 = makeHoleResult(
      {
        A: makePlayer("A", 3, 3, 2, 1),
        B: makePlayer("B", 1, 3, 1, 1),
      },
      "3",
      3,
    );
    hole3.players.B!.junk.push({
      name: "gross_ace_skin",
      value: 1,
      playerId: "B",
    });

    const scoreboard = { holes: { "1": hole1, "3": hole3 } };
    resolvePoolSweepSkins(scoreboard, getJunkOptions());

    // A's birdie skin on hole 1 should be removed
    expect(getPlayerJunkNames(hole1, "A")).not.toContain("gross_skin");
    // B's ace skin on hole 3 should remain
    expect(getPlayerJunkNames(hole3, "B")).toContain("gross_ace_skin");
  });

  it("albatross sweeps all other skins", () => {
    // Hole 1: Player A birdies
    const hole1 = makeHoleResult(
      {
        A: makePlayer("A", 3, 4, 1, 1),
        B: makePlayer("B", 4, 4, 2, 1),
      },
      "1",
    );
    hole1.players.A!.junk.push({
      name: "gross_skin",
      value: 1,
      playerId: "A",
    });

    // Hole 5: Player B albatrosses par 5
    const hole5 = makeHoleResult(
      {
        A: makePlayer("A", 5, 5, 2, 1),
        B: makePlayer("B", 2, 5, 1, 1),
      },
      "5",
      5,
    );
    hole5.players.B!.junk.push({
      name: "gross_albatross_skin",
      value: 1,
      playerId: "B",
    });

    const scoreboard = { holes: { "1": hole1, "5": hole5 } };
    resolvePoolSweepSkins(scoreboard, getJunkOptions());

    expect(getPlayerJunkNames(hole1, "A")).not.toContain("gross_skin");
    expect(getPlayerJunkNames(hole5, "B")).toContain("gross_albatross_skin");
  });

  it("two aces on different holes — both sweep skins kept", () => {
    // Hole 3: Player A aces
    const hole3 = makeHoleResult(
      {
        A: makePlayer("A", 1, 3, 1, 1),
        B: makePlayer("B", 3, 3, 2, 1),
      },
      "3",
      3,
    );
    hole3.players.A!.junk.push({
      name: "gross_ace_skin",
      value: 1,
      playerId: "A",
    });

    // Hole 7: Player B aces
    const hole7 = makeHoleResult(
      {
        A: makePlayer("A", 3, 3, 2, 1),
        B: makePlayer("B", 1, 3, 1, 1),
      },
      "7",
      3,
    );
    hole7.players.B!.junk.push({
      name: "gross_ace_skin",
      value: 1,
      playerId: "B",
    });

    const scoreboard = { holes: { "3": hole3, "7": hole7 } };
    resolvePoolSweepSkins(scoreboard, getJunkOptions());

    // Both ace skins should remain
    expect(getPlayerJunkNames(hole3, "A")).toContain("gross_ace_skin");
    expect(getPlayerJunkNames(hole7, "B")).toContain("gross_ace_skin");
  });

  it("no sweep skins — regular skins untouched", () => {
    const hole1 = makeHoleResult(
      {
        A: makePlayer("A", 3, 4, 1, 1),
        B: makePlayer("B", 4, 4, 2, 1),
      },
      "1",
    );
    hole1.players.A!.junk.push({
      name: "gross_skin",
      value: 1,
      playerId: "A",
    });

    const scoreboard = { holes: { "1": hole1 } };
    resolvePoolSweepSkins(scoreboard, getJunkOptions());

    // Birdie skin should remain (no sweep occurred)
    expect(getPlayerJunkNames(hole1, "A")).toContain("gross_skin");
  });
});
