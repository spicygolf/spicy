import { describe, expect, it } from "bun:test";
import { rankWithTies } from "../ranking-engine";

describe("rankWithTies", () => {
  describe("basic ranking", () => {
    it("ranks items correctly when all scores are different", () => {
      const items = [
        { id: "a", score: 4 },
        { id: "b", score: 3 },
        { id: "c", score: 5 },
      ];

      const ranked = rankWithTies(items, (i) => i.score, "lower");

      expect(ranked).toHaveLength(3);
      expect(ranked[0]).toEqual({
        item: { id: "b", score: 3 },
        rank: 1,
        tieCount: 1,
      });
      expect(ranked[1]).toEqual({
        item: { id: "a", score: 4 },
        rank: 2,
        tieCount: 1,
      });
      expect(ranked[2]).toEqual({
        item: { id: "c", score: 5 },
        rank: 3,
        tieCount: 1,
      });
    });

    it("handles empty array", () => {
      const ranked = rankWithTies(
        [],
        (i: { score: number }) => i.score,
        "lower",
      );
      expect(ranked).toEqual([]);
    });

    it("handles single item", () => {
      const items = [{ id: "a", score: 4 }];
      const ranked = rankWithTies(items, (i) => i.score, "lower");

      expect(ranked).toHaveLength(1);
      expect(ranked[0]).toEqual({
        item: { id: "a", score: 4 },
        rank: 1,
        tieCount: 1,
      });
    });
  });

  describe("tie handling", () => {
    it("handles two-way tie for first place", () => {
      const items = [
        { id: "a", score: 3 },
        { id: "b", score: 3 },
        { id: "c", score: 5 },
      ];

      const ranked = rankWithTies(items, (i) => i.score, "lower");

      expect(ranked).toHaveLength(3);
      // Both tied players get rank 1 with tieCount 2
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].tieCount).toBe(2);
      expect(ranked[1].rank).toBe(1);
      expect(ranked[1].tieCount).toBe(2);
      // Next player gets rank 3 (not 2)
      expect(ranked[2].rank).toBe(3);
      expect(ranked[2].tieCount).toBe(1);
    });

    it("handles three-way tie for first place", () => {
      const items = [
        { id: "a", score: 3 },
        { id: "b", score: 3 },
        { id: "c", score: 3 },
        { id: "d", score: 5 },
      ];

      const ranked = rankWithTies(items, (i) => i.score, "lower");

      expect(ranked).toHaveLength(4);
      // All three tied players get rank 1 with tieCount 3
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].tieCount).toBe(3);
      expect(ranked[1].rank).toBe(1);
      expect(ranked[1].tieCount).toBe(3);
      expect(ranked[2].rank).toBe(1);
      expect(ranked[2].tieCount).toBe(3);
      // Fourth player gets rank 4
      expect(ranked[3].rank).toBe(4);
      expect(ranked[3].tieCount).toBe(1);
    });

    it("handles tie for second place", () => {
      const items = [
        { id: "a", score: 3 },
        { id: "b", score: 4 },
        { id: "c", score: 4 },
        { id: "d", score: 5 },
      ];

      const ranked = rankWithTies(items, (i) => i.score, "lower");

      expect(ranked).toHaveLength(4);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].tieCount).toBe(1);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1].tieCount).toBe(2);
      expect(ranked[2].rank).toBe(2);
      expect(ranked[2].tieCount).toBe(2);
      expect(ranked[3].rank).toBe(4);
      expect(ranked[3].tieCount).toBe(1);
    });

    it("handles all players tied", () => {
      const items = [
        { id: "a", score: 4 },
        { id: "b", score: 4 },
        { id: "c", score: 4 },
      ];

      const ranked = rankWithTies(items, (i) => i.score, "lower");

      expect(ranked).toHaveLength(3);
      for (const r of ranked) {
        expect(r.rank).toBe(1);
        expect(r.tieCount).toBe(3);
      }
    });
  });

  describe("direction", () => {
    it("ranks with lower is better (golf scoring)", () => {
      const items = [
        { id: "a", score: 4 },
        { id: "b", score: 3 },
        { id: "c", score: 5 },
      ];

      const ranked = rankWithTies(items, (i) => i.score, "lower");

      expect(ranked[0].item.id).toBe("b"); // lowest score is rank 1
      expect(ranked[0].item.score).toBe(3);
    });

    it("ranks with higher is better (points scoring)", () => {
      const items = [
        { id: "a", score: 4 },
        { id: "b", score: 3 },
        { id: "c", score: 5 },
      ];

      const ranked = rankWithTies(items, (i) => i.score, "higher");

      expect(ranked[0].item.id).toBe("c"); // highest score is rank 1
      expect(ranked[0].item.score).toBe(5);
    });
  });
});
