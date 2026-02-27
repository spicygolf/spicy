/**
 * Scoreboard Utils Tests
 *
 * Tests for getQuotaRunningScore — quota-relative running totals
 * that track deviation from par (2 stableford points per hole).
 */

import { describe, expect, it } from "bun:test";
import { getQuotaRunningScore } from "../scoreboard-utils";
import type { Scoreboard } from "../types";

// =============================================================================
// Test Helpers
// =============================================================================

/** Build a minimal scoreboard with stableford junk for one player. */
function makeScoreboard(
  holesPlayed: string[],
  playerStableford: Record<string, number>,
): Scoreboard {
  const holes: Scoreboard["holes"] = {};

  for (const holeNum of holesPlayed) {
    const stableford = playerStableford[holeNum];
    const hasScore = stableford !== undefined;

    holes[holeNum] = {
      hole: holeNum,
      holeInfo: { hole: holeNum, par: 4, allocation: 1, yards: 380 },
      players: {
        P1: {
          playerId: "P1",
          hasScore,
          gross: hasScore ? 4 : 0, // placeholder
          pops: 0,
          net: hasScore ? 4 : 0,
          scoreToPar: 0,
          netToPar: 0,
          rank: 1,
          tieCount: 1,
          junk: hasScore
            ? [
                {
                  name: "stableford_par",
                  value: stableford,
                  playerId: "P1",
                  subType: "dot" as const,
                },
              ]
            : [],
          multipliers: [],
          points: 0,
        },
      },
      teams: {},
    };
  }

  return {
    holes,
    cumulative: { players: {}, teams: {} },
    meta: {
      gameId: "test",
      holesPlayed,
      hasTeams: false,
      pointsPerHole: 0,
    },
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("getQuotaRunningScore — par-based running total", () => {
  it("returns 0 when no holes have scores", () => {
    const sb = makeScoreboard(["1", "2", "3"], {});
    expect(getQuotaRunningScore(sb, "P1", "1")).toBe(0);
  });

  it("returns 0 for null scoreboard", () => {
    expect(getQuotaRunningScore(null, "P1", "1")).toBe(0);
  });

  it("returns 0 for unknown hole", () => {
    const sb = makeScoreboard(["1"], { "1": 2 });
    expect(getQuotaRunningScore(sb, "P1", "99")).toBe(0);
  });

  it("bogey (1 pt) on first hole → -1", () => {
    const sb = makeScoreboard(["1", "2"], { "1": 1 });
    expect(getQuotaRunningScore(sb, "P1", "1")).toBe(-1);
  });

  it("birdie (3 pts) on first hole → +1", () => {
    const sb = makeScoreboard(["1", "2"], { "1": 3 });
    expect(getQuotaRunningScore(sb, "P1", "1")).toBe(1);
  });

  it("par (2 pts) on first hole → 0", () => {
    const sb = makeScoreboard(["1", "2"], { "1": 2 });
    expect(getQuotaRunningScore(sb, "P1", "1")).toBe(0);
  });

  it("eagle (4 pts) on first hole → +2", () => {
    const sb = makeScoreboard(["1", "2"], { "1": 4 });
    expect(getQuotaRunningScore(sb, "P1", "1")).toBe(2);
  });

  it("double bogey (0 pts) on first hole → -2", () => {
    const sb = makeScoreboard(["1", "2"], { "1": 0 });
    // 0 pts - (1 hole * 2) = -2
    expect(getQuotaRunningScore(sb, "P1", "1")).toBe(-2);
  });

  it("accumulates across multiple holes", () => {
    // Birdie (3), par (2), bogey (1) = 6 pts - (3 holes * 2) = 0
    const sb = makeScoreboard(["1", "2", "3"], { "1": 3, "2": 2, "3": 1 });
    expect(getQuotaRunningScore(sb, "P1", "3")).toBe(0);
  });

  it("9 holes all par → 0", () => {
    const holes = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const scores: Record<string, number> = {};
    for (const h of holes) scores[h] = 2;
    const sb = makeScoreboard(holes, scores);
    // 18 pts - (9 * 2) = 0
    expect(getQuotaRunningScore(sb, "P1", "9")).toBe(0);
  });

  it("works across both nines (no nine reset)", () => {
    // 18 holes all par: 36 pts - (18 * 2) = 0
    const holes = Array.from({ length: 18 }, (_, i) => String(i + 1));
    const scores: Record<string, number> = {};
    for (const h of holes) scores[h] = 2;
    const sb = makeScoreboard(holes, scores);
    expect(getQuotaRunningScore(sb, "P1", "18")).toBe(0);

    // After 10 holes (birdie on 10): 22 pts - (10 * 2) = +2
    scores["10"] = 4; // eagle on hole 10
    const sb2 = makeScoreboard(holes, scores);
    expect(getQuotaRunningScore(sb2, "P1", "10")).toBe(2);
  });

  it("only counts holes up to current hole", () => {
    // Birdie on 1, eagle on 3 — viewing hole 2 (no score)
    const sb = makeScoreboard(["1", "2", "3"], { "1": 3, "3": 4 });
    // Hole 2 has no score, so only hole 1 counts: 3 - 2 = +1
    expect(getQuotaRunningScore(sb, "P1", "2")).toBe(1);
  });
});
