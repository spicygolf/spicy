/**
 * Five Points Integration Tests
 *
 * Tests the scoring engine with Five Points game fixtures.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import {
  loadFixture,
  transformFixture,
  generateTestCases,
  compareJunkArrays,
  deepGet,
  type Fixture,
  type TransformedFixture,
} from "../lib";
import { score } from "../../packages/lib/scoring/pipeline";
import type { Scoreboard } from "../../packages/lib/scoring/types";

describe("Five Points", () => {
  describe("basic_game fixture", () => {
    let fixture: Fixture;
    let transformed: TransformedFixture;
    let scoreboard: Scoreboard;

    beforeAll(() => {
      fixture = loadFixture("five_points/basic_game.json");
      transformed = transformFixture(fixture);
      // Cast mock game to Game type for scoring pipeline
      // The mock objects satisfy the interface requirements
      scoreboard = score(transformed.game as Parameters<typeof score>[0]);
    });

    it("loads fixture successfully", () => {
      expect(fixture).toBeDefined();
      expect(fixture.name).toBe("Five Points - Basic 2-Hole Game");
      expect(fixture.spec).toBe("five_points");
    });

    it("transforms fixture to game", () => {
      expect(transformed.game).toBeDefined();
      expect(transformed.game.$isLoaded).toBe(true);
      expect(transformed.gameSpec).toBeDefined();
      expect(transformed.options).toBeDefined();
    });

    it("calculates course handicaps", () => {
      expect(transformed.courseHandicaps.size).toBe(4);
      // With slope 128: handicap * (128/113)
      // Alice: 10.5 * 1.133 = 11.9 -> 12
      // Bob: 15.2 * 1.133 = 17.2 -> 17
      // Carol: 8.0 * 1.133 = 9.1 -> 9
      // Dave: 12.3 * 1.133 = 13.9 -> 14
      expect(transformed.courseHandicaps.get("p1")).toBe(12);
      expect(transformed.courseHandicaps.get("p2")).toBe(17);
      expect(transformed.courseHandicaps.get("p3")).toBe(9);
      expect(transformed.courseHandicaps.get("p4")).toBe(14);
    });

    it("produces a valid scoreboard", () => {
      expect(scoreboard).toBeDefined();
      expect(scoreboard.holes).toBeDefined();
      expect(scoreboard.cumulative).toBeDefined();
      expect(scoreboard.meta).toBeDefined();
    });

    it("has results for all holes", () => {
      expect(Object.keys(scoreboard.holes)).toContain("1");
      expect(Object.keys(scoreboard.holes)).toContain("2");
    });

    // Dynamic tests from fixture expected values
    describe("expected values", () => {
      const testCases = generateTestCases(
        loadFixture("five_points/basic_game.json"),
      );

      for (const tc of testCases) {
        it(tc.name, () => {
          if (tc.assertionType === "equals") {
            const actual = deepGet(
              scoreboard as unknown as Record<string, unknown>,
              tc.actualPath,
            );
            expect(actual).toBe(tc.expected);
          } else if (tc.assertionType === "containsAll") {
            const actual = deepGet(
              scoreboard as unknown as Record<string, unknown>,
              tc.actualPath,
            ) as Array<{ name: string }> | undefined;
            expect(actual).toBeDefined();
            if (actual && Array.isArray(tc.expected)) {
              const comparison = compareJunkArrays(actual, tc.expected);
              expect(comparison.match).toBe(true);
              if (!comparison.match) {
                console.log(`Missing: ${comparison.missing.join(", ")}`);
                console.log(`Extra: ${comparison.extra.join(", ")}`);
              }
            }
          }
        });
      }
    });
  });
});
