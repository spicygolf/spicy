import { describe, expect, it } from "bun:test";
import {
  calculateAllPayouts,
  calculateNetPositions,
  calculatePoolPayouts,
  calculateSettlement,
  type PlayerMetrics,
  type PoolConfig,
  reconcileDebts,
} from "../settlement-engine";

describe("settlement-engine", () => {
  // Test data: 4-player game with quota performance
  const players: PlayerMetrics[] = [
    {
      playerId: "p1",
      playerName: "Alice",
      metrics: {
        quota_front: 4,
        quota_back: 2,
        quota_overall: 6,
        skins_won: 2,
      },
    },
    {
      playerId: "p2",
      playerName: "Bob",
      metrics: {
        quota_front: 1,
        quota_back: 3,
        quota_overall: 4,
        skins_won: 1,
      },
    },
    {
      playerId: "p3",
      playerName: "Charlie",
      metrics: {
        quota_front: -2,
        quota_back: 1,
        quota_overall: -1,
        skins_won: 0,
      },
    },
    {
      playerId: "p4",
      playerName: "Diana",
      metrics: {
        quota_front: 0,
        quota_back: -1,
        quota_overall: -1,
        skins_won: 1,
      },
    },
  ];

  const bigGamePools: PoolConfig[] = [
    {
      name: "front",
      disp: "Front",
      pct: 25,
      metric: "quota_front",
      splitType: "places",
      placesPaid: 3,
    },
    {
      name: "back",
      disp: "Back",
      pct: 25,
      metric: "quota_back",
      splitType: "places",
      placesPaid: 3,
    },
    {
      name: "overall",
      disp: "Total",
      pct: 25,
      metric: "quota_overall",
      splitType: "places",
      placesPaid: 3,
    },
    {
      name: "skins",
      disp: "Skins",
      pct: 25,
      metric: "skins_won",
      splitType: "per_unit",
    },
  ];

  describe("calculatePoolPayouts", () => {
    it("calculates places payouts correctly", () => {
      const pool: PoolConfig = {
        name: "front",
        disp: "Front",
        pct: 25,
        metric: "quota_front",
        splitType: "places",
        placesPaid: 3,
      };

      const payouts = calculatePoolPayouts(pool, players, 100);

      // Alice (4) gets 1st: 50%
      // Bob (1) gets 2nd: 30%
      // Diana (0) gets 3rd: 20%
      expect(payouts).toHaveLength(3);
      expect(payouts[0]).toMatchObject({
        playerId: "p1",
        place: 1,
        amount: 50,
      });
      expect(payouts[1]).toMatchObject({
        playerId: "p2",
        place: 2,
        amount: 30,
      });
      expect(payouts[2]).toMatchObject({
        playerId: "p4",
        place: 3,
        amount: 20,
      });
    });

    it("calculates per_unit payouts correctly", () => {
      const pool: PoolConfig = {
        name: "skins",
        disp: "Skins",
        pct: 25,
        metric: "skins_won",
        splitType: "per_unit",
      };

      const payouts = calculatePoolPayouts(pool, players, 100);

      // Total skins: 4 (Alice: 2, Bob: 1, Diana: 1)
      // $100 / 4 = $25 per skin
      expect(payouts).toHaveLength(3); // Charlie has 0 skins
      expect(payouts[0]).toMatchObject({
        playerId: "p1",
        metricValue: 2,
        amount: 50,
      });
      expect(payouts[1]).toMatchObject({
        playerId: "p2",
        metricValue: 1,
        amount: 25,
      });
      expect(payouts[2]).toMatchObject({
        playerId: "p4",
        metricValue: 1,
        amount: 25,
      });
    });

    it("calculates winner_take_all correctly", () => {
      const pool: PoolConfig = {
        name: "bonus",
        disp: "Bonus",
        pct: 10,
        metric: "quota_overall",
        splitType: "winner_take_all",
      };

      const payouts = calculatePoolPayouts(pool, players, 100);

      expect(payouts).toHaveLength(1);
      expect(payouts[0]).toMatchObject({
        playerId: "p1",
        place: 1,
        amount: 100,
      });
    });

    it("assigns correct ranks with no false ties (13, 12, 11, 11)", () => {
      // From screenshot: Front scores 13, 12, 11, 11
      // Rank 1: 13, Rank 2: 12 (solo), Rank T3: 11, 11
      const tiePlayers: PlayerMetrics[] = [
        { playerId: "dean", playerName: "Dean", metrics: { front: 13 } },
        { playerId: "vince", playerName: "Vince", metrics: { front: 12 } },
        { playerId: "chip", playerName: "Chip", metrics: { front: 11 } },
        { playerId: "bud", playerName: "Bud", metrics: { front: 11 } },
      ];
      const pool: PoolConfig = {
        name: "front",
        disp: "Front",
        pct: 100,
        metric: "front",
        splitType: "places",
        placesPaid: 3,
      };

      const payouts = calculatePoolPayouts(pool, tiePlayers, 1000);

      // Dean = 1st ($500), Vince = 2nd alone ($300)
      // Chip & Bud = T3, share (20%) → $100 each
      expect(payouts).toHaveLength(4); // All 4 paid (tie at 3rd pulls in both)

      const dean = payouts.find((p) => p.playerId === "dean")!;
      expect(dean.rankLabel).toBe("1");
      expect(dean.amount).toBe(500);

      const vince = payouts.find((p) => p.playerId === "vince")!;
      expect(vince.rankLabel).toBe("2");
      expect(vince.amount).toBe(300);

      const chip = payouts.find((p) => p.playerId === "chip")!;
      expect(chip.rankLabel).toBe("T3");
      expect(chip.amount).toBe(100);

      const bud = payouts.find((p) => p.playerId === "bud")!;
      expect(bud.rankLabel).toBe("T3");
      expect(bud.amount).toBe(100);
    });

    it("splits pot correctly for 2-way tie at 3rd (positions 3+4)", () => {
      // 2 players tied for 3rd in a placesPaid=4 pool
      // They share positions 3 (18%) + 4 (10%) = 28% / 2 = 14% each
      const tiePlayers: PlayerMetrics[] = [
        { playerId: "p1", playerName: "P1", metrics: { v: 10 } },
        { playerId: "p2", playerName: "P2", metrics: { v: 8 } },
        { playerId: "p3", playerName: "P3", metrics: { v: 5 } },
        { playerId: "p4", playerName: "P4", metrics: { v: 5 } },
        { playerId: "p5", playerName: "P5", metrics: { v: 2 } },
      ];
      const pool: PoolConfig = {
        name: "test",
        disp: "Test",
        pct: 100,
        metric: "v",
        splitType: "places",
        placesPaid: 4,
        payoutPcts: [45, 27, 18, 10],
      };

      const payouts = calculatePoolPayouts(pool, tiePlayers, 1000);

      const p3 = payouts.find((p) => p.playerId === "p3")!;
      const p4 = payouts.find((p) => p.playerId === "p4")!;
      // (18 + 10) / 2 = 14% each = $140
      expect(p3.rankLabel).toBe("T3");
      expect(p3.amount).toBe(140);
      expect(p4.rankLabel).toBe("T3");
      expect(p4.amount).toBe(140);
    });

    it("includes all 5 tied players at 3rd when placesPaid=3", () => {
      // From screenshot: Back column has 5 players tied at 10 for 3rd
      // Only positions 1-3 are paid: 50, 30, 20
      // 5 players at rank 3 share position 3 (20%) = 20/5 = 4% each
      const tiePlayers: PlayerMetrics[] = [
        { playerId: "p1", playerName: "P1", metrics: { back: 12 } },
        { playerId: "p2", playerName: "P2", metrics: { back: 11 } },
        { playerId: "p3", playerName: "P3", metrics: { back: 10 } },
        { playerId: "p4", playerName: "P4", metrics: { back: 10 } },
        { playerId: "p5", playerName: "P5", metrics: { back: 10 } },
        { playerId: "p6", playerName: "P6", metrics: { back: 10 } },
        { playerId: "p7", playerName: "P7", metrics: { back: 10 } },
        { playerId: "p8", playerName: "P8", metrics: { back: 8 } },
      ];
      const pool: PoolConfig = {
        name: "back",
        disp: "Back",
        pct: 100,
        metric: "back",
        splitType: "places",
        placesPaid: 3,
      };

      const payouts = calculatePoolPayouts(pool, tiePlayers, 1000);

      // P1 = 1st ($500), P2 = 2nd ($300)
      // P3-P7 = T3, share 20% / 5 = 4% each = $40
      expect(payouts).toHaveLength(7); // 1 + 1 + 5 tied

      const p1 = payouts.find((p) => p.playerId === "p1")!;
      expect(p1.rankLabel).toBe("1");
      expect(p1.amount).toBe(500);

      const p2 = payouts.find((p) => p.playerId === "p2")!;
      expect(p2.rankLabel).toBe("2");
      expect(p2.amount).toBe(300);

      // All 5 tied players get T3 and $40 each
      for (const id of ["p3", "p4", "p5", "p6", "p7"]) {
        const p = payouts.find((pp) => pp.playerId === id)!;
        expect(p.rankLabel).toBe("T3");
        expect(p.amount).toBe(40);
      }

      // P8 not paid (rank 8 > placesPaid 3)
      expect(payouts.find((p) => p.playerId === "p8")).toBeUndefined();

      // Total should equal pool amount
      const total = payouts.reduce((s, p) => s + p.amount, 0);
      expect(total).toBe(1000);
    });

    it("handles custom payout percentages", () => {
      const pool: PoolConfig = {
        name: "custom",
        disp: "Custom",
        pct: 25,
        metric: "quota_front",
        splitType: "places",
        placesPaid: 2,
        payoutPcts: [60, 40],
      };

      const payouts = calculatePoolPayouts(pool, players, 100);

      expect(payouts).toHaveLength(2);
      expect(payouts[0]).toMatchObject({ playerId: "p1", amount: 60 });
      expect(payouts[1]).toMatchObject({ playerId: "p2", amount: 40 });
    });
  });

  describe("calculateAllPayouts", () => {
    it("calculates payouts for all pools", () => {
      const potTotal = 400; // $100 per player
      const payouts = calculateAllPayouts(bigGamePools, players, potTotal);

      // 4 pools, at least 3 payouts each (places) + variable for skins
      expect(payouts.length).toBeGreaterThanOrEqual(9);

      // Check pool distribution
      const frontPayouts = payouts.filter((p) => p.poolName === "front");
      const skinsPayouts = payouts.filter((p) => p.poolName === "skins");

      expect(frontPayouts).toHaveLength(3);
      expect(skinsPayouts).toHaveLength(3); // 3 players have skins
    });
  });

  describe("calculateNetPositions", () => {
    it("calculates net positions correctly", () => {
      const potTotal = 400;
      const payouts = calculateAllPayouts(bigGamePools, players, potTotal);
      const netPositions = calculateNetPositions(payouts, players, potTotal);

      // Everyone starts at -$100 (buy-in)
      // Net should sum to 0 (zero-sum game)
      const totalNet = Object.values(netPositions).reduce(
        (sum, n) => sum + n,
        0,
      );
      expect(Math.abs(totalNet)).toBeLessThan(1); // Allow for rounding

      // Alice should be positive (won front, overall, 2 skins)
      expect(netPositions.p1).toBeGreaterThan(0);

      // Charlie should be negative (won nothing, last in most categories)
      expect(netPositions.p3).toBeLessThan(0);
    });
  });

  describe("reconcileDebts", () => {
    it("minimizes transactions", () => {
      // Simple case: A owes $50, B is owed $30, C is owed $20
      const netPositions = {
        p1: -50, // A owes $50
        p2: 30, // B is owed $30
        p3: 20, // C is owed $20
      };

      const playerNames = { p1: "Alice", p2: "Bob", p3: "Charlie" };
      const debts = reconcileDebts(netPositions, playerNames);

      // Should produce 2 transactions: A pays B $30, A pays C $20
      expect(debts).toHaveLength(2);

      const total = debts.reduce((sum, d) => sum + d.amount, 0);
      expect(total).toBe(50);
    });

    it("handles complex reconciliation", () => {
      // A owes $30, B owes $20, C is owed $25, D is owed $25
      const netPositions = {
        p1: -30,
        p2: -20,
        p3: 25,
        p4: 25,
      };

      const playerNames = { p1: "A", p2: "B", p3: "C", p4: "D" };
      const debts = reconcileDebts(netPositions, playerNames);

      // Verify total debt matches
      const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
      expect(totalDebt).toBe(50);

      // Verify no circular debts
      for (const debt of debts) {
        expect(debt.fromPlayerId).not.toBe(debt.toPlayerId);
      }
    });

    it("handles zero net positions", () => {
      const netPositions = {
        p1: 0,
        p2: 0,
        p3: 0,
        p4: 0,
      };

      const playerNames = { p1: "A", p2: "B", p3: "C", p4: "D" };
      const debts = reconcileDebts(netPositions, playerNames);

      expect(debts).toHaveLength(0);
    });
  });

  describe("calculateSettlement (full integration)", () => {
    it("calculates complete settlement for The Big Game", () => {
      const potTotal = 400;
      const result = calculateSettlement(bigGamePools, players, potTotal);

      // Check structure
      expect(result.potTotal).toBe(400);
      expect(result.buyIn).toBe(100);
      expect(result.payouts.length).toBeGreaterThan(0);
      expect(result.debts.length).toBeGreaterThanOrEqual(0);

      // Net positions should be zero-sum
      const totalNet = Object.values(result.netPositions).reduce(
        (sum, n) => sum + n,
        0,
      );
      expect(Math.abs(totalNet)).toBeLessThan(1);

      // Debts should cover the total amount owed
      const totalDebt = result.debts.reduce((sum, d) => sum + d.amount, 0);
      const totalOwed = Object.values(result.netPositions)
        .filter((n) => n < 0)
        .reduce((sum, n) => sum + Math.abs(n), 0);

      expect(Math.abs(totalDebt - totalOwed)).toBeLessThan(1);
    });

    it("handles edge case: one dominant winner", () => {
      const dominantPlayers: PlayerMetrics[] = [
        {
          playerId: "p1",
          playerName: "Winner",
          metrics: { quota_overall: 10, skins_won: 5 },
        },
        {
          playerId: "p2",
          playerName: "Loser1",
          metrics: { quota_overall: -5, skins_won: 0 },
        },
        {
          playerId: "p3",
          playerName: "Loser2",
          metrics: { quota_overall: -3, skins_won: 0 },
        },
        {
          playerId: "p4",
          playerName: "Loser3",
          metrics: { quota_overall: -2, skins_won: 0 },
        },
      ];

      const simplePools: PoolConfig[] = [
        {
          name: "overall",
          disp: "Total",
          pct: 75,
          metric: "quota_overall",
          splitType: "places",
          placesPaid: 3,
        },
        {
          name: "skins",
          disp: "Skins",
          pct: 25,
          metric: "skins_won",
          splitType: "per_unit",
        },
      ];

      const result = calculateSettlement(simplePools, dominantPlayers, 400);

      // Winner should have very positive net
      expect(result.netPositions.p1).toBeGreaterThan(100);

      // Losers should have negative nets
      expect(result.netPositions.p2).toBeLessThan(0);
      expect(result.netPositions.p3).toBeLessThan(0);
      expect(result.netPositions.p4).toBeLessThan(0);
    });
  });
});
