import { describe, expect, it } from "bun:test";
import {
  type BetConfig,
  betToPoolConfig,
  extractMetricsForBets,
  settleBets,
} from "../bet-settlement";
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

const ALL_18 = [
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
];

/** Stableford junk helper: value = modified stableford points. */
function stab(name: string, value: number) {
  return { name: `stableford_${name}`, value };
}

/** Skin junk helper. */
function skin() {
  return { name: "gross_skin", value: 1 };
}

// =============================================================================
// Test Data: Big Game configuration
// =============================================================================

const BIG_GAME_BETS: BetConfig[] = [
  {
    name: "front",
    disp: "Front",
    scope: "front9",
    scoringType: "quota",
    pct: 25,
    splitType: "places",
  },
  {
    name: "back",
    disp: "Back",
    scope: "back9",
    scoringType: "quota",
    pct: 25,
    splitType: "places",
  },
  {
    name: "overall",
    disp: "Total",
    scope: "all18",
    scoringType: "quota",
    pct: 25,
    splitType: "places",
  },
  {
    name: "skins",
    disp: "Skins",
    scope: "all18",
    scoringType: "skins",
    pct: 25,
    splitType: "per_unit",
  },
];

const PLAYERS = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
  { id: "p4", name: "Diana" },
];

// Quotas: Alice=26, Bob=29, Charlie=33, Diana=30
const PLAYER_QUOTAS = new Map<string, PlayerQuota>([
  ["p1", { playerId: "p1", total: 26, front: 13, back: 13 }],
  ["p2", { playerId: "p2", total: 29, front: 14, back: 15 }],
  ["p3", { playerId: "p3", total: 33, front: 17, back: 16 }],
  ["p4", { playerId: "p4", total: 30, front: 15, back: 15 }],
]);

// Stableford junk per player per hole (18 holes).
// Alice: strong front (birdie=4pts on holes 1,3,5 + par=2pts elsewhere)
// Bob: strong back (birdie=4pts on holes 10,12,14 + par=2pts elsewhere)
// Charlie: all pars (2pts each hole)
// Diana: mixed, wins a skin on hole 7
function makeTestJunk(): Record<
  string,
  Record<string, { name: string; value: number }[]>
> {
  const p1: Record<string, { name: string; value: number }[]> = {};
  const p2: Record<string, { name: string; value: number }[]> = {};
  const p3: Record<string, { name: string; value: number }[]> = {};
  const p4: Record<string, { name: string; value: number }[]> = {};

  for (const h of ALL_18) {
    // Alice: 3 birdies on front (holes 1,3,5 = 4pts), rest pars (2pts)
    p1[h] = ["1", "3", "5"].includes(h)
      ? [stab("birdie", 4)]
      : [stab("par", 2)];

    // Bob: 3 birdies on back (holes 10,12,14 = 4pts), rest pars (2pts)
    p2[h] = ["10", "12", "14"].includes(h)
      ? [stab("birdie", 4)]
      : [stab("par", 2)];

    // Charlie: all pars
    p3[h] = [stab("par", 2)];

    // Diana: all pars, plus a skin on hole 7
    p4[h] = h === "7" ? [stab("par", 2), skin()] : [stab("par", 2)];
  }

  // Alice wins skins on holes 1 and 5
  p1["1"]?.push(skin());
  p1["5"]?.push(skin());

  // Bob wins a skin on hole 10
  p2["10"]?.push(skin());

  const junk = { p1, p2, p3, p4 };

  return junk;
}

// =============================================================================
// betToPoolConfig
// =============================================================================

const frontBet = BIG_GAME_BETS[0] as BetConfig;
const backBet = BIG_GAME_BETS[1] as BetConfig;
const overallBet = BIG_GAME_BETS[2] as BetConfig;
const skinsBet = BIG_GAME_BETS[3] as BetConfig;

describe("betToPoolConfig", () => {
  it("maps quota + front9 to quota_front metric", () => {
    const pool = betToPoolConfig(frontBet, 3);
    expect(pool.metric).toBe("quota_front");
    expect(pool.splitType).toBe("places");
    expect(pool.placesPaid).toBe(3);
  });

  it("maps quota + back9 to quota_back metric", () => {
    const pool = betToPoolConfig(backBet, 3);
    expect(pool.metric).toBe("quota_back");
  });

  it("maps quota + all18 to quota_overall metric", () => {
    const pool = betToPoolConfig(overallBet, 3);
    expect(pool.metric).toBe("quota_overall");
  });

  it("maps skins to skins_won metric", () => {
    const pool = betToPoolConfig(skinsBet, 3);
    expect(pool.metric).toBe("skins_won");
    expect(pool.splitType).toBe("per_unit");
    expect(pool.placesPaid).toBeUndefined();
  });

  it("uses bet placesPaid over default when specified", () => {
    const bet: BetConfig = {
      ...frontBet,
      placesPaid: 5,
    };
    const pool = betToPoolConfig(bet, 3);
    expect(pool.placesPaid).toBe(5);
  });

  it("falls back to defaultPlacesPaid when bet has none", () => {
    const pool = betToPoolConfig(frontBet, 4);
    expect(pool.placesPaid).toBe(4);
  });
});

// =============================================================================
// extractMetricsForBets
// =============================================================================

describe("extractMetricsForBets", () => {
  it("extracts quota and skins metrics for all players", () => {
    const scoreboard = makeScoreboard(ALL_18, makeTestJunk());
    const metrics = extractMetricsForBets(
      BIG_GAME_BETS,
      scoreboard,
      PLAYER_QUOTAS,
      PLAYERS,
    );

    expect(metrics).toHaveLength(4);

    // Check Alice's metrics
    const alice = metrics.find((m) => m.playerId === "p1");
    expect(alice).toBeDefined();
    expect(alice?.playerName).toBe("Alice");

    // Alice stableford: front = 3*4 + 6*2 = 24, back = 9*2 = 18, total = 42
    // Alice quota: front=13, back=13, total=26
    // Alice performance: front=24-13=11, back=18-13=5, total=42-26=16
    expect(alice?.metrics.quota_front).toBe(11);
    expect(alice?.metrics.quota_back).toBe(5);
    expect(alice?.metrics.quota_overall).toBe(16);
    expect(alice?.metrics.skins_won).toBe(2);
  });

  it("handles players with no skins", () => {
    const scoreboard = makeScoreboard(ALL_18, makeTestJunk());
    const metrics = extractMetricsForBets(
      BIG_GAME_BETS,
      scoreboard,
      PLAYER_QUOTAS,
      PLAYERS,
    );

    const charlie = metrics.find((m) => m.playerId === "p3");
    expect(charlie?.metrics.skins_won).toBe(0);
  });

  it("only extracts skins when no quota bets present", () => {
    const skinsOnlyBets: BetConfig[] = [
      {
        name: "skins",
        disp: "Skins",
        scope: "all18",
        scoringType: "skins",
        pct: 100,
        splitType: "per_unit",
      },
    ];
    const scoreboard = makeScoreboard(ALL_18, makeTestJunk());
    const metrics = extractMetricsForBets(
      skinsOnlyBets,
      scoreboard,
      undefined,
      PLAYERS,
    );

    const alice = metrics.find((m) => m.playerId === "p1");
    expect(alice?.metrics.skins_won).toBe(2);
    // No quota metrics should be present
    expect(alice?.metrics.quota_front).toBeUndefined();
  });
});

// =============================================================================
// settleBets (full integration)
// =============================================================================

describe("settleBets", () => {
  it("calculates Big Game settlement correctly", () => {
    const scoreboard = makeScoreboard(ALL_18, makeTestJunk());

    const result = settleBets({
      bets: BIG_GAME_BETS,
      players: PLAYERS,
      scoreboard,
      playerQuotas: PLAYER_QUOTAS,
      buyIn: 40,
      defaultPlacesPaid: 3,
    });

    // Pot = 4 * $40 = $160
    expect(result.potTotal).toBe(160);
    expect(result.buyIn).toBe(40);

    // Net positions should sum to ~$0
    const totalNet = Object.values(result.netPositions).reduce(
      (sum, n) => sum + n,
      0,
    );
    expect(Math.abs(totalNet)).toBeLessThan(1);

    // Alice should be positive (top performer in front and overall)
    expect(result.netPositions.p1).toBeGreaterThan(0);

    // Every player should have a net position
    expect(Object.keys(result.netPositions)).toHaveLength(4);
  });

  it("produces reconciled debts that cover total owed", () => {
    const scoreboard = makeScoreboard(ALL_18, makeTestJunk());

    const result = settleBets({
      bets: BIG_GAME_BETS,
      players: PLAYERS,
      scoreboard,
      playerQuotas: PLAYER_QUOTAS,
      buyIn: 40,
      defaultPlacesPaid: 3,
    });

    const totalDebt = result.debts.reduce((sum, d) => sum + d.amount, 0);
    const totalOwed = Object.values(result.netPositions)
      .filter((n) => n < 0)
      .reduce((sum, n) => sum + Math.abs(n), 0);

    expect(Math.abs(totalDebt - totalOwed)).toBeLessThan(1);
  });

  it("returns empty result for zero buy-in", () => {
    const scoreboard = makeScoreboard(ALL_18, makeTestJunk());

    const result = settleBets({
      bets: BIG_GAME_BETS,
      players: PLAYERS,
      scoreboard,
      playerQuotas: PLAYER_QUOTAS,
      buyIn: 0,
      defaultPlacesPaid: 3,
    });

    // With $0 pot, net positions should all be ~0
    for (const net of Object.values(result.netPositions)) {
      expect(Math.abs(net)).toBeLessThan(0.01);
    }
    expect(result.debts).toHaveLength(0);
  });

  it("handles large player count (48 players)", () => {
    // Generate 48 players with varying performance
    const largePlayers = Array.from({ length: 48 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
    }));

    const largeQuotas = new Map<string, PlayerQuota>(
      largePlayers.map((p, i) => [
        p.id,
        {
          playerId: p.id,
          total: 28 + (i % 10),
          front: 14,
          back: 14 + (i % 10),
        },
      ]),
    );

    // Build junk: each player gets 2pts per hole (par), some get birdies/skins
    const junk: Record<
      string,
      Record<string, { name: string; value: number }[]>
    > = {};
    for (const p of largePlayers) {
      junk[p.id] = {};
      for (const h of ALL_18) {
        const holeJunk: { name: string; value: number }[] = [stab("par", 2)];
        // Top 3 players get a birdie on their index hole
        const idx = Number.parseInt(p.id.slice(1), 10);
        if (idx < 3 && h === String(idx + 1)) {
          holeJunk.push(stab("birdie", 4));
        }
        // First player gets skins on holes 1, 10
        if (idx === 0 && (h === "1" || h === "10")) {
          holeJunk.push(skin());
        }
        const playerJunk = junk[p.id];
        if (playerJunk) playerJunk[h] = holeJunk;
      }
    }

    const scoreboard = makeScoreboard(ALL_18, junk);
    const result = settleBets({
      bets: BIG_GAME_BETS,
      players: largePlayers,
      scoreboard,
      playerQuotas: largeQuotas,
      buyIn: 40,
      defaultPlacesPaid: 3,
    });

    // Pot = 48 * $40 = $1920
    expect(result.potTotal).toBe(1920);
    expect(result.buyIn).toBe(40);

    // Net positions should sum to ~$0
    const totalNet = Object.values(result.netPositions).reduce(
      (sum, n) => sum + n,
      0,
    );
    expect(Math.abs(totalNet)).toBeLessThan(1);

    // All 48 players should have net positions
    expect(Object.keys(result.netPositions)).toHaveLength(48);
  });
});
