/**
 * Skins Scoring Tests
 *
 * Tests for gross skins behavior in Big Game (quota) scoring:
 * - Chop: when multiple players birdie, no skin is awarded
 * - Eagle override: eagle skin supersedes birdie skin
 * - Sole birdie: only player to birdie wins the skin
 */

import { describe, expect, it } from "bun:test";
import { evaluateJunkForHole } from "../junk-engine";
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

function makeHoleResult(players: Record<string, PlayerHoleResult>): HoleResult {
  return {
    hole: "1",
    holeInfo: PAR_4_HOLE,
    players,
    teams: {},
  };
}

/** Minimal ScoringContext with gross skin + eagle skin junk options */
function makeSkinsScoringCtx(): ScoringContext {
  return {
    options: {
      gross_skin: {
        name: "gross_skin",
        disp: "Skin (Gross Birdie)",
        type: "junk",
        sub_type: "skin",
        value: 1,
        seq: 10,
        scope: "player",
        icon: "trophy",
        based_on: "gross",
        limit: "one_per_hole",
        better: "lower",
        score_to_par: "at_most -1",
        logic: '{"rankWithTies": [1, 1]}',
      },
      gross_eagle_skin: {
        name: "gross_eagle_skin",
        disp: "Eagle Skin (Overrides Birdie)",
        type: "junk",
        sub_type: "skin",
        value: 1,
        seq: 9,
        scope: "player",
        icon: "trophy",
        based_on: "gross",
        limit: "one_per_hole",
        better: "lower",
        score_to_par: "at_most -2",
        logic: '{"rankWithTies": [1, 1]}',
      },
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
