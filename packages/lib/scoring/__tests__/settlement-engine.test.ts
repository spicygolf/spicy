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
      disp: "Front Nine",
      pct: 25,
      metric: "quota_front",
      splitType: "places",
      placesPaid: 3,
    },
    {
      name: "back",
      disp: "Back Nine",
      pct: 25,
      metric: "quota_back",
      splitType: "places",
      placesPaid: 3,
    },
    {
      name: "overall",
      disp: "Overall",
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
        disp: "Front Nine",
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
      expect(netPositions["p1"]).toBeGreaterThan(0);

      // Charlie should be negative (won nothing, last in most categories)
      expect(netPositions["p3"]).toBeLessThan(0);
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
          disp: "Overall",
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
      expect(result.netPositions["p1"]).toBeGreaterThan(100);

      // Losers should have negative nets
      expect(result.netPositions["p2"]).toBeLessThan(0);
      expect(result.netPositions["p3"]).toBeLessThan(0);
      expect(result.netPositions["p4"]).toBeLessThan(0);
    });
  });
});
