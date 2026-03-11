import { describe, expect, it } from "bun:test";
import {
  computeBetMatchStates,
  extractMatchMetrics,
  extractMatchMetricsForScope,
  findHoleWinner,
} from "../match-metrics";
import type { Scoreboard } from "../types";

// =============================================================================
// Helpers
// =============================================================================

const ALL_18 = Array.from({ length: 18 }, (_, i) => String(i + 1));
const FRONT_9 = ALL_18.slice(0, 9);

/** Build a scoreboard with per-player net scores per hole. */
function makeMatchScoreboard(
  holesPlayed: string[],
  playerNets: Record<string, Record<string, number>>,
): Scoreboard {
  const holes: Scoreboard["holes"] = {};

  for (const holeNum of holesPlayed) {
    const players: Record<
      string,
      Scoreboard["holes"][string]["players"][string]
    > = {};

    for (const [playerId, nets] of Object.entries(playerNets)) {
      const net = nets[holeNum] ?? 0;
      players[playerId] = {
        playerId,
        hasScore: nets[holeNum] !== undefined,
        gross: net + 1,
        pops: 1,
        net,
        scoreToPar: 0,
        netToPar: 0,
        rank: 0,
        tieCount: 0,
        junk: [],
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
// findHoleWinner
// =============================================================================

describe("findHoleWinner", () => {
  it("returns sole lowest net player", () => {
    const players = {
      p1: { hasScore: true, net: 3 },
      p2: { hasScore: true, net: 4 },
    };
    expect(findHoleWinner(players)).toBe("p1");
  });

  it("returns null on tie", () => {
    const players = {
      p1: { hasScore: true, net: 4 },
      p2: { hasScore: true, net: 4 },
    };
    expect(findHoleWinner(players)).toBeNull();
  });

  it("returns null when no scores", () => {
    const players = {
      p1: { hasScore: false, net: 0 },
      p2: { hasScore: false, net: 0 },
    };
    expect(findHoleWinner(players)).toBeNull();
  });

  it("picks winner among 4 players", () => {
    const players = {
      p1: { hasScore: true, net: 5 },
      p2: { hasScore: true, net: 3 },
      p3: { hasScore: true, net: 4 },
      p4: { hasScore: true, net: 6 },
    };
    expect(findHoleWinner(players)).toBe("p2");
  });

  it("returns null when two of four tie for lowest", () => {
    const players = {
      p1: { hasScore: true, net: 3 },
      p2: { hasScore: true, net: 3 },
      p3: { hasScore: true, net: 5 },
      p4: { hasScore: true, net: 6 },
    };
    expect(findHoleWinner(players)).toBeNull();
  });
});

// =============================================================================
// extractMatchMetrics — 2-player individual
// =============================================================================

describe("extractMatchMetrics", () => {
  describe("2-player individual", () => {
    it("Alice wins all front holes, Bob wins all back holes", () => {
      const nets: Record<string, Record<string, number>> = {
        p1: {},
        p2: {},
      };
      for (const h of ALL_18) {
        const n = Number.parseInt(h, 10);
        // Alice: net 3 on front, net 5 on back
        nets.p1![h] = n <= 9 ? 3 : 5;
        // Bob: net 5 on front, net 3 on back
        nets.p2![h] = n <= 9 ? 5 : 3;
      }

      const sb = makeMatchScoreboard(ALL_18, nets);
      const metrics = extractMatchMetrics(sb);

      expect(metrics.get("p1")).toEqual({ front: 9, back: 0, total: 9 });
      expect(metrics.get("p2")).toEqual({ front: 0, back: 9, total: 9 });
    });

    it("all holes tied → everyone at 0", () => {
      const nets: Record<string, Record<string, number>> = {
        p1: {},
        p2: {},
      };
      for (const h of ALL_18) {
        nets.p1![h] = 4;
        nets.p2![h] = 4;
      }

      const sb = makeMatchScoreboard(ALL_18, nets);
      const metrics = extractMatchMetrics(sb);

      expect(metrics.get("p1")).toEqual({ front: 0, back: 0, total: 0 });
      expect(metrics.get("p2")).toEqual({ front: 0, back: 0, total: 0 });
    });

    it("Alice wins 5, Bob wins 3, 1 halved on front 9", () => {
      const nets: Record<string, Record<string, number>> = {
        p1: {},
        p2: {},
      };
      // Holes 1-5: Alice wins (net 3 vs 4)
      // Holes 6-8: Bob wins (net 5 vs 3)
      // Hole 9: tied (net 4 vs 4)
      for (const h of FRONT_9) {
        const n = Number.parseInt(h, 10);
        if (n <= 5) {
          nets.p1![h] = 3;
          nets.p2![h] = 4;
        } else if (n <= 8) {
          nets.p1![h] = 5;
          nets.p2![h] = 3;
        } else {
          nets.p1![h] = 4;
          nets.p2![h] = 4;
        }
      }
      // Back nine: all tied
      for (let n = 10; n <= 18; n++) {
        nets.p1![String(n)] = 4;
        nets.p2![String(n)] = 4;
      }

      const sb = makeMatchScoreboard(ALL_18, nets);
      const metrics = extractMatchMetrics(sb);

      expect(metrics.get("p1")?.front).toBe(5);
      expect(metrics.get("p2")?.front).toBe(3);
      expect(metrics.get("p1")?.back).toBe(0);
      expect(metrics.get("p2")?.back).toBe(0);
      expect(metrics.get("p1")?.total).toBe(5);
      expect(metrics.get("p2")?.total).toBe(3);
    });
  });

  describe("4-player individual", () => {
    it("only sole lowest net wins the hole", () => {
      const nets: Record<string, Record<string, number>> = {
        p1: {},
        p2: {},
        p3: {},
        p4: {},
      };
      for (const h of FRONT_9) {
        const n = Number.parseInt(h, 10);
        if (n <= 3) {
          // p1 wins
          nets.p1![h] = 3;
          nets.p2![h] = 4;
          nets.p3![h] = 5;
          nets.p4![h] = 5;
        } else if (n <= 6) {
          // p2 wins
          nets.p1![h] = 5;
          nets.p2![h] = 3;
          nets.p3![h] = 4;
          nets.p4![h] = 5;
        } else {
          // p1 and p2 tie (halved)
          nets.p1![h] = 3;
          nets.p2![h] = 3;
          nets.p3![h] = 5;
          nets.p4![h] = 5;
        }
      }
      // Back nine: p3 sweeps
      for (let n = 10; n <= 18; n++) {
        nets.p1![String(n)] = 5;
        nets.p2![String(n)] = 5;
        nets.p3![String(n)] = 3;
        nets.p4![String(n)] = 5;
      }

      const sb = makeMatchScoreboard(ALL_18, nets);
      const metrics = extractMatchMetrics(sb);

      expect(metrics.get("p1")?.front).toBe(3);
      expect(metrics.get("p2")?.front).toBe(3);
      expect(metrics.get("p3")?.front).toBe(0);
      expect(metrics.get("p4")?.front).toBe(0);
      expect(metrics.get("p3")?.back).toBe(9);
      expect(metrics.get("p1")?.back).toBe(0);
    });
  });

  describe("shotgun start alignment", () => {
    it("aligns play-order nines to physical course sides", () => {
      // Start on hole 10 (shotgun back nine first)
      const holesPlayed = [
        ...Array.from({ length: 9 }, (_, i) => String(i + 10)),
        ...Array.from({ length: 9 }, (_, i) => String(i + 1)),
      ];

      const nets: Record<string, Record<string, number>> = {
        p1: {},
        p2: {},
      };
      // Play-order "front" (holes 10-18): Alice wins all
      for (let n = 10; n <= 18; n++) {
        nets.p1![String(n)] = 3;
        nets.p2![String(n)] = 5;
      }
      // Play-order "back" (holes 1-9): Bob wins all
      for (let n = 1; n <= 9; n++) {
        nets.p1![String(n)] = 5;
        nets.p2![String(n)] = 3;
      }

      const sb = makeMatchScoreboard(holesPlayed, nets);
      const metrics = extractMatchMetrics(sb);

      // Physical front (holes 1-9) = Bob wins → Bob.front=9
      // Physical back (holes 10-18) = Alice wins → Alice.back=9
      expect(metrics.get("p1")?.front).toBe(0);
      expect(metrics.get("p1")?.back).toBe(9);
      expect(metrics.get("p2")?.front).toBe(9);
      expect(metrics.get("p2")?.back).toBe(0);
    });
  });

  describe("9-hole round", () => {
    it("all wins go to front, back stays 0", () => {
      const nets: Record<string, Record<string, number>> = {
        p1: {},
        p2: {},
      };
      for (const h of FRONT_9) {
        nets.p1![h] = 3;
        nets.p2![h] = 5;
      }

      const sb = makeMatchScoreboard(FRONT_9, nets);
      const metrics = extractMatchMetrics(sb);

      expect(metrics.get("p1")).toEqual({ front: 9, back: 0, total: 9 });
      expect(metrics.get("p2")).toEqual({ front: 0, back: 0, total: 0 });
    });
  });
});

// =============================================================================
// extractMatchMetricsForScope — dynamic press scopes
// =============================================================================

describe("extractMatchMetricsForScope", () => {
  const nets: Record<string, Record<string, number>> = {
    p1: {},
    p2: {},
  };
  // Alice wins holes 1-5, Bob wins holes 6-18
  for (const h of ALL_18) {
    const n = Number.parseInt(h, 10);
    nets.p1![h] = n <= 5 ? 3 : 5;
    nets.p2![h] = n <= 5 ? 5 : 3;
  }
  const sb = makeMatchScoreboard(ALL_18, nets);

  it("front9 scope", () => {
    const result = extractMatchMetricsForScope(sb, "front9");
    expect(result.get("p1")).toBe(5);
    expect(result.get("p2")).toBe(4);
  });

  it("back9 scope", () => {
    const result = extractMatchMetricsForScope(sb, "back9");
    expect(result.get("p1")).toBe(0);
    expect(result.get("p2")).toBe(9);
  });

  it("all18 scope", () => {
    const result = extractMatchMetricsForScope(sb, "all18");
    expect(result.get("p1")).toBe(5);
    expect(result.get("p2")).toBe(13);
  });

  it("rest_of_nine from index 4 (holes 5-9)", () => {
    const result = extractMatchMetricsForScope(sb, "rest_of_nine", 4);
    // Holes at play-order indices 4-8 = holes 5-9
    // Alice wins hole 5 (index 4), Bob wins holes 6-9 (indices 5-8)
    expect(result.get("p1")).toBe(1);
    expect(result.get("p2")).toBe(4);
  });

  it("rest_of_round from index 12 (holes 13-18)", () => {
    const result = extractMatchMetricsForScope(sb, "rest_of_round", 12);
    // All Bob
    expect(result.get("p1")).toBe(0);
    expect(result.get("p2")).toBe(6);
  });

  it("rest_of_nine from index 9 (back nine start, holes 10-18)", () => {
    const result = extractMatchMetricsForScope(sb, "rest_of_nine", 9);
    expect(result.get("p1")).toBe(0);
    expect(result.get("p2")).toBe(9);
  });
});

// =============================================================================
// computeBetMatchStates — clinch detection
// =============================================================================

describe("computeBetMatchStates clinch detection", () => {
  it("clinches front bet when up 3 with 2 to play", () => {
    // p1 wins holes 1-5, p2 wins holes 6-7, holes 8-9 not yet scored
    const nets: Record<string, Record<string, number>> = { p1: {}, p2: {} };
    for (let h = 1; h <= 5; h++) {
      nets.p1![String(h)] = 3;
      nets.p2![String(h)] = 5;
    }
    for (let h = 6; h <= 7; h++) {
      nets.p1![String(h)] = 5;
      nets.p2![String(h)] = 3;
    }
    // holes 8-9: no scores yet

    const sb = makeMatchScoreboard(FRONT_9, nets);
    const bets = [
      {
        name: "front_match",
        disp: "Front",
        scope: "front9",
        scoringType: "match",
        amount: 10,
      },
    ];

    // throughHoleIndex = 6 (hole 7, 0-based), so 7 holes played, 2 remain
    const states = computeBetMatchStates(sb, bets, "p1", 6);
    expect(states).toHaveLength(1);
    expect(states[0]!.diff).toBe(3); // 5 won - 2 won
    expect(states[0]!.clinched).toBe(true);
    expect(states[0]!.clinchLabel).toBe("Won 3&2");
  });

  it("does not clinch when lead equals remaining holes (dormie)", () => {
    // p1 wins holes 1-4, p2 wins holes 5-6, holes 7-9 not scored
    const nets: Record<string, Record<string, number>> = { p1: {}, p2: {} };
    for (let h = 1; h <= 4; h++) {
      nets.p1![String(h)] = 3;
      nets.p2![String(h)] = 5;
    }
    for (let h = 5; h <= 6; h++) {
      nets.p1![String(h)] = 5;
      nets.p2![String(h)] = 3;
    }

    const sb = makeMatchScoreboard(FRONT_9, nets);
    const bets = [
      {
        name: "front_match",
        disp: "Front",
        scope: "front9",
        scoringType: "match",
        amount: 10,
      },
    ];

    // throughHoleIndex = 5 (hole 6), 6 holes played, 3 remain, diff = 2
    // 2 <= 3, so NOT clinched (dormie)
    const states = computeBetMatchStates(sb, bets, "p1", 5);
    expect(states[0]!.diff).toBe(2);
    expect(states[0]!.clinched).toBeUndefined();
  });

  it("clinches on last hole with a lead", () => {
    // p1 wins 6 holes, p2 wins 3 holes on front 9 (all scored)
    const nets: Record<string, Record<string, number>> = { p1: {}, p2: {} };
    for (let h = 1; h <= 6; h++) {
      nets.p1![String(h)] = 3;
      nets.p2![String(h)] = 5;
    }
    for (let h = 7; h <= 9; h++) {
      nets.p1![String(h)] = 5;
      nets.p2![String(h)] = 3;
    }

    const sb = makeMatchScoreboard(FRONT_9, nets);
    const bets = [
      {
        name: "front_match",
        disp: "Front",
        scope: "front9",
        scoringType: "match",
        amount: 10,
      },
    ];

    const states = computeBetMatchStates(sb, bets, "p1", 8);
    expect(states[0]!.diff).toBe(3);
    expect(states[0]!.clinched).toBe(true);
    expect(states[0]!.clinchLabel).toBe("Won 3 up");
  });

  it("shows clinch from losing perspective", () => {
    // p1 wins 2 holes, p2 wins 5 holes through hole 7, 2 remain
    const nets: Record<string, Record<string, number>> = { p1: {}, p2: {} };
    for (let h = 1; h <= 2; h++) {
      nets.p1![String(h)] = 3;
      nets.p2![String(h)] = 5;
    }
    for (let h = 3; h <= 7; h++) {
      nets.p1![String(h)] = 5;
      nets.p2![String(h)] = 3;
    }

    const sb = makeMatchScoreboard(FRONT_9, nets);
    const bets = [
      {
        name: "front_match",
        disp: "Front",
        scope: "front9",
        scoringType: "match",
        amount: 10,
      },
    ];

    const states = computeBetMatchStates(sb, bets, "p1", 6);
    expect(states[0]!.diff).toBe(-3);
    expect(states[0]!.clinched).toBe(true);
    expect(states[0]!.clinchLabel).toBe("Lost 3&2");
  });

  it("clinches press bet within its own scope", () => {
    // Press starts at hole index 5 with rest_of_nine scope (holes 6-9)
    // p2 wins all 3 scored holes (6, 7, 8), hole 9 unscored
    const nets: Record<string, Record<string, number>> = { p1: {}, p2: {} };
    for (let h = 1; h <= 5; h++) {
      nets.p1![String(h)] = 4;
      nets.p2![String(h)] = 4;
    }
    for (let h = 6; h <= 8; h++) {
      nets.p1![String(h)] = 5;
      nets.p2![String(h)] = 3;
    }

    const sb = makeMatchScoreboard(FRONT_9, nets);
    const bets = [
      {
        name: "press_1_front_match",
        disp: "P1",
        scope: "rest_of_nine",
        scoringType: "match",
        amount: 10,
        startHoleIndex: 5,
        parentBetName: "front_match",
      },
    ];

    // throughHoleIndex = 7 (hole 8), press scope has 4 holes (5-8), 3 scored, 1 remaining
    // p2 won 3, p1 won 0. diff = -3, remaining = 1 → clinched
    const states = computeBetMatchStates(sb, bets, "p1", 7);
    expect(states[0]!.diff).toBe(-3);
    expect(states[0]!.clinched).toBe(true);
    expect(states[0]!.clinchLabel).toBe("Lost 3&1");
  });
});
