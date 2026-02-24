import { describe, expect, test } from "bun:test";
import {
  calculateQuotaPerformances,
  extractSkinCounts,
  extractStablefordTotals,
} from "../quota-metrics";
import type { PlayerQuota, Scoreboard } from "../types";

// =============================================================================
// Helpers
// =============================================================================

function makeScoreboard(
  holesPlayed: string[],
  playerJunkByHole: Record<
    string,
    Record<string, { name: string; value: number }[]>
  >,
): Scoreboard {
  const holes: Scoreboard["holes"] = {};

  for (const holeNum of holesPlayed) {
    const players: Record<
      string,
      Scoreboard["holes"][string]["players"][string]
    > = {};

    for (const [playerId, holeJunk] of Object.entries(playerJunkByHole)) {
      players[playerId] = {
        playerId,
        hasScore: true,
        gross: 0,
        pops: 0,
        net: 0,
        scoreToPar: 0,
        netToPar: 0,
        rank: 0,
        tieCount: 0,
        junk: holeJunk[holeNum] ?? [],
        multipliers: [],
        points: 0,
      };
    }

    holes[holeNum] = {
      hole: holeNum,
      holeInfo: { hole: holeNum, par: 4, allocation: 0, yards: 0 },
      players,
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
// extractStablefordTotals
// =============================================================================

describe("extractStablefordTotals", () => {
  test("sums stableford junk across 18 holes", () => {
    const scoreboard = makeScoreboard(
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
      ],
      {
        p1: {
          "1": [{ name: "stableford_par", value: 2 }],
          "5": [{ name: "stableford_birdie", value: 3 }],
          "10": [{ name: "stableford_par", value: 2 }],
          "18": [{ name: "stableford_eagle", value: 4 }],
        },
      },
    );

    const totals = extractStablefordTotals(scoreboard);
    const p1 = totals.get("p1");
    expect(p1).toBeDefined();

    expect(p1?.front).toBe(5); // hole 1 (2) + hole 5 (3)
    expect(p1?.back).toBe(6); // hole 10 (2) + hole 18 (4)
    expect(p1?.total).toBe(11);
  });

  test("handles multiple players", () => {
    const scoreboard = makeScoreboard(
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
      ],
      {
        p1: {
          "1": [{ name: "stableford_par", value: 2 }],
        },
        p2: {
          "1": [{ name: "stableford_birdie", value: 3 }],
          "10": [{ name: "stableford_bogey", value: 1 }],
        },
      },
    );

    const totals = extractStablefordTotals(scoreboard);
    expect(totals.get("p1")).toEqual({ front: 2, back: 0, total: 2 });
    expect(totals.get("p2")).toEqual({ front: 3, back: 1, total: 4 });
  });

  test("ignores non-stableford junk", () => {
    const scoreboard = makeScoreboard(
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
      ],
      {
        p1: {
          "1": [
            { name: "stableford_par", value: 2 },
            { name: "birdie", value: 1 },
          ],
        },
      },
    );

    const totals = extractStablefordTotals(scoreboard);
    expect(totals.get("p1")?.total).toBe(2);
  });

  test("handles shotgun start (play order differs from hole numbers)", () => {
    // Shotgun: starting on hole 10, play order is 10-18, 1-9
    const holesPlayed = [
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
    ];

    const scoreboard = makeScoreboard(holesPlayed, {
      p1: {
        "10": [{ name: "stableford_birdie", value: 3 }], // front (first 9 in play order)
        "1": [{ name: "stableford_par", value: 2 }], // back (second 9 in play order)
      },
    });

    const totals = extractStablefordTotals(scoreboard);
    const p1 = totals.get("p1");
    expect(p1).toBeDefined();

    // In shotgun: holes 10-18 are "front" (first 9 played), 1-9 are "back"
    expect(p1?.front).toBe(3);
    expect(p1?.back).toBe(2);
    expect(p1?.total).toBe(5);
  });

  test("returns empty map for no stableford junk", () => {
    const scoreboard = makeScoreboard(
      ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
      {
        p1: {
          "1": [{ name: "birdie", value: 1 }],
        },
      },
    );

    const totals = extractStablefordTotals(scoreboard);
    // p1 exists with all zeros (entry created from iterating hole players)
    const p1 = totals.get("p1");
    expect(p1).toEqual({ front: 0, back: 0, total: 0 });
  });

  test("handles partial round (9 holes only)", () => {
    const scoreboard = makeScoreboard(
      ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
      {
        p1: {
          "3": [{ name: "stableford_par", value: 2 }],
          "7": [{ name: "stableford_birdie", value: 3 }],
        },
      },
    );

    const totals = extractStablefordTotals(scoreboard);
    const p1 = totals.get("p1");
    expect(p1).toBeDefined();

    expect(p1?.front).toBe(5);
    expect(p1?.back).toBe(0);
    expect(p1?.total).toBe(5);
  });
});

// =============================================================================
// extractSkinCounts
// =============================================================================

describe("extractSkinCounts", () => {
  test("counts gross_skin junk", () => {
    const scoreboard = makeScoreboard(
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
      ],
      {
        p1: {
          "3": [{ name: "gross_skin", value: 1 }],
          "7": [{ name: "gross_skin", value: 1 }],
        },
        p2: {
          "5": [{ name: "gross_skin", value: 1 }],
        },
      },
    );

    const counts = extractSkinCounts(scoreboard);
    expect(counts.get("p1")).toBe(2);
    expect(counts.get("p2")).toBe(1);
  });

  test("counts gross_eagle_skin separately", () => {
    const scoreboard = makeScoreboard(
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
      ],
      {
        p1: {
          "3": [{ name: "gross_skin", value: 1 }],
          "7": [{ name: "gross_eagle_skin", value: 2 }],
        },
      },
    );

    const counts = extractSkinCounts(scoreboard);
    // Both gross_skin and gross_eagle_skin start with "gross_skin"
    expect(counts.get("p1")).toBe(2);
  });

  test("returns empty map for no skins", () => {
    const scoreboard = makeScoreboard(["1", "2", "3"], {
      p1: {
        "1": [{ name: "stableford_par", value: 2 }],
      },
    });

    const counts = extractSkinCounts(scoreboard);
    expect(counts.size).toBe(0);
  });
});

// =============================================================================
// calculateQuotaPerformances
// =============================================================================

describe("calculateQuotaPerformances", () => {
  test("computes performance = stableford - quota", () => {
    const scoreboard = makeScoreboard(
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
      ],
      {
        p1: {
          // Front: 2+3+2 = 7
          "1": [{ name: "stableford_par", value: 2 }],
          "5": [{ name: "stableford_birdie", value: 3 }],
          "9": [{ name: "stableford_par", value: 2 }],
          // Back: 2+2+4 = 8
          "10": [{ name: "stableford_par", value: 2 }],
          "14": [{ name: "stableford_par", value: 2 }],
          "18": [{ name: "stableford_eagle", value: 4 }],
        },
      },
    );

    const playerQuotas = new Map<string, PlayerQuota>([
      ["p1", { playerId: "p1", total: 29, front: 14, back: 15 }],
    ]);

    const perfs = calculateQuotaPerformances(scoreboard, playerQuotas);
    expect(perfs).toHaveLength(1);

    const p1 = perfs[0];
    expect(p1.playerId).toBe("p1");
    expect(p1.stableford).toEqual({ front: 7, back: 8, total: 15 });
    expect(p1.quota).toEqual({ front: 14, back: 15, total: 29 });
    expect(p1.performance).toEqual({ front: -7, back: -7, total: -14 });
  });

  test("handles player with no stableford points", () => {
    const scoreboard = makeScoreboard(
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
      ],
      {
        p1: {},
      },
    );

    const playerQuotas = new Map<string, PlayerQuota>([
      ["p1", { playerId: "p1", total: 36, front: 18, back: 18 }],
    ]);

    const perfs = calculateQuotaPerformances(scoreboard, playerQuotas);
    expect(perfs[0].performance).toEqual({ front: -18, back: -18, total: -36 });
  });

  test("handles over-quota performance (positive)", () => {
    const scoreboard = makeScoreboard(
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
      ],
      {
        p1: {
          // Front: birdie on every hole = 3*9 = 27
          "1": [{ name: "stableford_birdie", value: 3 }],
          "2": [{ name: "stableford_birdie", value: 3 }],
          "3": [{ name: "stableford_birdie", value: 3 }],
          "4": [{ name: "stableford_birdie", value: 3 }],
          "5": [{ name: "stableford_birdie", value: 3 }],
          "6": [{ name: "stableford_birdie", value: 3 }],
          "7": [{ name: "stableford_birdie", value: 3 }],
          "8": [{ name: "stableford_birdie", value: 3 }],
          "9": [{ name: "stableford_birdie", value: 3 }],
        },
      },
    );

    const playerQuotas = new Map<string, PlayerQuota>([
      ["p1", { playerId: "p1", total: 29, front: 14, back: 15 }],
    ]);

    const perfs = calculateQuotaPerformances(scoreboard, playerQuotas);
    const p1 = perfs[0];

    expect(p1.stableford.front).toBe(27);
    expect(p1.performance.front).toBe(13); // 27 - 14
    expect(p1.performance.back).toBe(-15); // 0 - 15
    expect(p1.performance.total).toBe(-2); // 27 - 29
  });

  test("handles multiple players", () => {
    const scoreboard = makeScoreboard(
      [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
      ],
      {
        p1: {
          "1": [{ name: "stableford_par", value: 2 }],
        },
        p2: {
          "1": [{ name: "stableford_birdie", value: 3 }],
          "10": [{ name: "stableford_par", value: 2 }],
        },
      },
    );

    const playerQuotas = new Map<string, PlayerQuota>([
      ["p1", { playerId: "p1", total: 20, front: 10, back: 10 }],
      ["p2", { playerId: "p2", total: 30, front: 15, back: 15 }],
    ]);

    const perfs = calculateQuotaPerformances(scoreboard, playerQuotas);
    expect(perfs).toHaveLength(2);

    const p1 = perfs.find((p) => p.playerId === "p1");
    expect(p1).toBeDefined();
    expect(p1?.performance.total).toBe(-18); // 2 - 20

    const p2 = perfs.find((p) => p.playerId === "p2");
    expect(p2).toBeDefined();
    expect(p2?.performance.total).toBe(-25); // 5 - 30
  });
});
