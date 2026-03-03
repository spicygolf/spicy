import { describe, expect, it } from "bun:test";
import { type BetConfig, settleBets } from "../bet-settlement";
import type { PlayerQuota, Scoreboard } from "../types";

// =============================================================================
// Helpers
// =============================================================================

/** Build a minimal scoreboard with stableford + skin junk per player per hole. */
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

const ALL_18 = Array.from({ length: 18 }, (_, i) => String(i + 1));

function stab(name: string, value: number) {
  return { name: `stableford_${name}`, value, subType: "dot" as const };
}

function skin() {
  return { name: "gross_skin", value: 1, subType: "skin" as const };
}

// =============================================================================
// Stakes Test Data: Nassau configuration
// =============================================================================

const NASSAU_BETS: BetConfig[] = [
  {
    name: "front_match",
    disp: "Front",
    scope: "front9",
    scoringType: "quota",
    amount: 10,
    splitType: "winner_take_all",
  },
  {
    name: "back_match",
    disp: "Back",
    scope: "back9",
    scoringType: "quota",
    amount: 10,
    splitType: "winner_take_all",
  },
  {
    name: "overall_match",
    disp: "Overall",
    scope: "all18",
    scoringType: "quota",
    amount: 20,
    splitType: "winner_take_all",
  },
];

const TWO_PLAYERS = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
];

const FOUR_PLAYERS = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
  { id: "p4", name: "Diana" },
];

// Quotas for 2-player test
const TWO_PLAYER_QUOTAS = new Map<string, PlayerQuota>([
  ["p1", { playerId: "p1", total: 26, front: 13, back: 13 }],
  ["p2", { playerId: "p2", total: 28, front: 14, back: 14 }],
]);

// Quotas for 4-player test
const FOUR_PLAYER_QUOTAS = new Map<string, PlayerQuota>([
  ["p1", { playerId: "p1", total: 26, front: 13, back: 13 }],
  ["p2", { playerId: "p2", total: 28, front: 14, back: 14 }],
  ["p3", { playerId: "p3", total: 30, front: 15, back: 15 }],
  ["p4", { playerId: "p4", total: 32, front: 16, back: 16 }],
]);

// =============================================================================
// Stakes Settlement Tests
// =============================================================================

describe("stakes settlement", () => {
  describe("routing", () => {
    it("uses stakes path when bets have amount", () => {
      // Build simple scoreboard: Alice wins front, Bob wins back, Alice wins overall
      const junk: Record<
        string,
        Record<string, { name: string; value: number }[]>
      > = {};
      for (const p of TWO_PLAYERS) {
        junk[p.id] = {};
        for (const h of ALL_18) {
          const hNum = Number.parseInt(h, 10);
          // Alice: birdies on front (holes 1-5), pars on back
          if (p.id === "p1") {
            junk[p.id]![h] = hNum <= 5 ? [stab("birdie", 4)] : [stab("par", 2)];
          }
          // Bob: pars on front, birdies on back (holes 10-14)
          if (p.id === "p2") {
            junk[p.id]![h] =
              hNum >= 10 && hNum <= 14 ? [stab("birdie", 4)] : [stab("par", 2)];
          }
        }
      }

      const scoreboard = makeScoreboard(ALL_18, junk);
      const result = settleBets({
        bets: NASSAU_BETS,
        players: TWO_PLAYERS,
        scoreboard,
        playerQuotas: TWO_PLAYER_QUOTAS,
        buyIn: 0, // Not used for stakes
        defaultPlacesPaid: 1,
      });

      // Total stakes = (10 + 10 + 20) × 2 players = $80
      expect(result.potTotal).toBe(80);
      // Buy-in per player = 10 + 10 + 20 = $40
      expect(result.buyIn).toBe(40);
    });

    it("uses pool path when bets have pct", () => {
      const poolBets: BetConfig[] = [
        {
          name: "front",
          disp: "Front",
          scope: "front9",
          scoringType: "quota",
          pct: 50,
          splitType: "places",
        },
        {
          name: "back",
          disp: "Back",
          scope: "back9",
          scoringType: "quota",
          pct: 50,
          splitType: "places",
        },
      ];

      const junk: Record<
        string,
        Record<string, { name: string; value: number }[]>
      > = {};
      for (const p of TWO_PLAYERS) {
        junk[p.id] = {};
        for (const h of ALL_18) {
          junk[p.id]![h] = [stab("par", 2)];
        }
      }

      const scoreboard = makeScoreboard(ALL_18, junk);
      const result = settleBets({
        bets: poolBets,
        players: TWO_PLAYERS,
        scoreboard,
        playerQuotas: TWO_PLAYER_QUOTAS,
        buyIn: 40,
        defaultPlacesPaid: 1,
      });

      // Pool path: pot = 2 × $40 = $80
      expect(result.potTotal).toBe(80);
      expect(result.buyIn).toBe(40);
    });
  });

  describe("2-player Nassau", () => {
    it("Alice sweeps all three bets when she outperforms everywhere", () => {
      const junk: Record<
        string,
        Record<string, { name: string; value: number }[]>
      > = {};
      for (const p of TWO_PLAYERS) {
        junk[p.id] = {};
        for (const h of ALL_18) {
          // Alice: birdie every hole (4pts)
          // Bob: par every hole (2pts)
          junk[p.id]![h] =
            p.id === "p1" ? [stab("birdie", 4)] : [stab("par", 2)];
        }
      }

      const scoreboard = makeScoreboard(ALL_18, junk);
      const result = settleBets({
        bets: NASSAU_BETS,
        players: TWO_PLAYERS,
        scoreboard,
        playerQuotas: TWO_PLAYER_QUOTAS,
        buyIn: 0,
      });

      // Alice wins all three bets
      // Front bet: Alice gets $20 (2 × $10), Bob gets $0
      // Back bet: Alice gets $20 (2 × $10), Bob gets $0
      // Overall bet: Alice gets $40 (2 × $20), Bob gets $0
      // Alice total winnings = $80, buy-in = $40, net = +$40
      // Bob total winnings = $0, buy-in = $40, net = -$40
      expect(result.netPositions.p1).toBe(40);
      expect(result.netPositions.p2).toBe(-40);

      // One debt: Bob pays Alice $40
      expect(result.debts).toHaveLength(1);
      expect(result.debts[0]?.fromPlayerId).toBe("p2");
      expect(result.debts[0]?.toPlayerId).toBe("p1");
      expect(result.debts[0]?.amount).toBe(40);
    });

    it("split bets: Alice wins front, Bob wins back, Alice wins overall", () => {
      const junk: Record<
        string,
        Record<string, { name: string; value: number }[]>
      > = {};
      for (const p of TWO_PLAYERS) {
        junk[p.id] = {};
        for (const h of ALL_18) {
          const hNum = Number.parseInt(h, 10);
          if (p.id === "p1") {
            // Alice: birdies on front (1-9), bogeys on back (10-18)
            junk[p.id]![h] =
              hNum <= 9 ? [stab("birdie", 4)] : [stab("bogey", 1)];
          } else {
            // Bob: bogeys on front (1-9), birdies on back (10-18)
            junk[p.id]![h] =
              hNum <= 9 ? [stab("bogey", 1)] : [stab("birdie", 4)];
          }
        }
      }

      const scoreboard = makeScoreboard(ALL_18, junk);
      const result = settleBets({
        bets: NASSAU_BETS,
        players: TWO_PLAYERS,
        scoreboard,
        playerQuotas: TWO_PLAYER_QUOTAS,
        buyIn: 0,
      });

      // Alice wins front ($10 pool = $20)
      // Bob wins back ($10 pool = $20)
      // Overall: Alice front = 9×4=36, back = 9×1=9, total=45, quota=26, perf=19
      //          Bob front = 9×1=9, back = 9×4=36, total=45, quota=28, perf=17
      // Alice wins overall ($20 pool = $40)
      // Alice net: -40 + 20 + 0 + 40 = +20
      // Bob net: -40 + 0 + 20 + 0 = -20
      expect(result.netPositions.p1).toBe(20);
      expect(result.netPositions.p2).toBe(-20);
    });
  });

  describe("4-player Nassau", () => {
    it("distributes stakes across 4 players correctly", () => {
      const junk: Record<
        string,
        Record<string, { name: string; value: number }[]>
      > = {};
      for (const p of FOUR_PLAYERS) {
        junk[p.id] = {};
        for (const h of ALL_18) {
          // Everyone pars, except Alice gets 3 birdies on front
          if (p.id === "p1" && ["1", "3", "5"].includes(h)) {
            junk[p.id]![h] = [stab("birdie", 4)];
          } else {
            junk[p.id]![h] = [stab("par", 2)];
          }
        }
      }

      const scoreboard = makeScoreboard(ALL_18, junk);
      const result = settleBets({
        bets: NASSAU_BETS,
        players: FOUR_PLAYERS,
        scoreboard,
        playerQuotas: FOUR_PLAYER_QUOTAS,
        buyIn: 0,
      });

      // 4 players × ($10 + $10 + $20) = $160 total pot
      expect(result.potTotal).toBe(160);
      expect(result.buyIn).toBe(40);

      // Net positions should sum to ~$0
      const totalNet = Object.values(result.netPositions).reduce(
        (sum, n) => sum + n,
        0,
      );
      expect(Math.abs(totalNet)).toBeLessThan(1);

      // Alice should be positive (wins front and overall due to birdies)
      expect(result.netPositions.p1).toBeGreaterThan(0);
    });
  });

  describe("net position math", () => {
    it("net positions sum to zero", () => {
      const junk: Record<
        string,
        Record<string, { name: string; value: number }[]>
      > = {};
      for (const p of FOUR_PLAYERS) {
        junk[p.id] = {};
        for (const h of ALL_18) {
          junk[p.id]![h] = [stab("par", 2)];
        }
      }

      const scoreboard = makeScoreboard(ALL_18, junk);
      const result = settleBets({
        bets: NASSAU_BETS,
        players: FOUR_PLAYERS,
        scoreboard,
        playerQuotas: FOUR_PLAYER_QUOTAS,
        buyIn: 0,
      });

      const totalNet = Object.values(result.netPositions).reduce(
        (sum, n) => sum + n,
        0,
      );
      expect(Math.abs(totalNet)).toBeLessThan(1);
    });

    it("debt reconciliation covers total owed", () => {
      const junk: Record<
        string,
        Record<string, { name: string; value: number }[]>
      > = {};
      for (const p of FOUR_PLAYERS) {
        junk[p.id] = {};
        for (const h of ALL_18) {
          // Make Alice clearly dominant
          if (p.id === "p1") {
            junk[p.id]![h] = [stab("birdie", 4)];
          } else {
            junk[p.id]![h] = [stab("par", 2)];
          }
        }
      }

      const scoreboard = makeScoreboard(ALL_18, junk);
      const result = settleBets({
        bets: NASSAU_BETS,
        players: FOUR_PLAYERS,
        scoreboard,
        playerQuotas: FOUR_PLAYER_QUOTAS,
        buyIn: 0,
      });

      const totalDebt = result.debts.reduce((sum, d) => sum + d.amount, 0);
      const totalOwed = Object.values(result.netPositions)
        .filter((n) => n < 0)
        .reduce((sum, n) => sum + Math.abs(n), 0);

      expect(Math.abs(totalDebt - totalOwed)).toBeLessThan(1);
    });
  });

  describe("edge cases", () => {
    it("single bet with amount works", () => {
      const singleBet: BetConfig[] = [
        {
          name: "match",
          disp: "Match",
          scope: "all18",
          scoringType: "quota",
          amount: 20,
          splitType: "winner_take_all",
        },
      ];

      const junk: Record<
        string,
        Record<string, { name: string; value: number }[]>
      > = {};
      for (const p of TWO_PLAYERS) {
        junk[p.id] = {};
        for (const h of ALL_18) {
          junk[p.id]![h] =
            p.id === "p1" ? [stab("birdie", 4)] : [stab("par", 2)];
        }
      }

      const scoreboard = makeScoreboard(ALL_18, junk);
      const result = settleBets({
        bets: singleBet,
        players: TWO_PLAYERS,
        scoreboard,
        playerQuotas: TWO_PLAYER_QUOTAS,
        buyIn: 0,
      });

      // Alice wins $40 (2 × $20), buy-in $20, net +$20
      // Bob wins $0, buy-in $20, net -$20
      expect(result.netPositions.p1).toBe(20);
      expect(result.netPositions.p2).toBe(-20);
      expect(result.potTotal).toBe(40);
      expect(result.buyIn).toBe(20);
    });

    it("handles zero amount gracefully", () => {
      const zeroBet: BetConfig[] = [
        {
          name: "match",
          disp: "Match",
          scope: "all18",
          scoringType: "quota",
          amount: 0,
          splitType: "winner_take_all",
        },
      ];

      const junk: Record<
        string,
        Record<string, { name: string; value: number }[]>
      > = {};
      for (const p of TWO_PLAYERS) {
        junk[p.id] = {};
        for (const h of ALL_18) {
          junk[p.id]![h] = [stab("par", 2)];
        }
      }

      const scoreboard = makeScoreboard(ALL_18, junk);
      const result = settleBets({
        bets: zeroBet,
        players: TWO_PLAYERS,
        scoreboard,
        playerQuotas: TWO_PLAYER_QUOTAS,
        buyIn: 0,
      });

      // Everything should be zero
      expect(result.potTotal).toBe(0);
      expect(result.buyIn).toBe(0);
      expect(result.debts).toHaveLength(0);
    });
  });
});
