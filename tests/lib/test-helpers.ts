/**
 * Test Helpers
 *
 * Utility functions for loading fixtures and asserting on scoreboard results.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { validateFixture } from "./fixture-schema";
import {
  type TransformedFixture,
  transformFixture,
} from "./fixture-transformer";
import type { Fixture } from "./fixture-types";

// =============================================================================
// Path Resolution
// =============================================================================

/**
 * Find the project root by looking for the tests/fixtures directory
 */
function findProjectRoot(): string {
  let dir = process.cwd();

  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "tests", "fixtures"))) {
      return dir;
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error("Could not find project root with tests/fixtures directory");
}

const PROJECT_ROOT = findProjectRoot();
const FIXTURES_DIR = join(PROJECT_ROOT, "tests", "fixtures");

// =============================================================================
// Fixture Loading
// =============================================================================

/**
 * Load a fixture file by path relative to tests/fixtures/
 *
 * @param path - Relative path like "five_points/basic_game.json"
 * @returns Validated fixture object
 * @throws Error if file not found or validation fails
 */
export function loadFixture(path: string): Fixture {
  const fullPath = join(FIXTURES_DIR, path);

  if (!existsSync(fullPath)) {
    throw new Error(`Fixture not found: ${path} (expected at ${fullPath})`);
  }

  const content = readFileSync(fullPath, "utf-8");
  const data = JSON.parse(content);

  // Validate with Zod
  return validateFixture(data);
}

/**
 * Load and transform a fixture in one step
 */
export function loadAndTransformFixture(path: string): TransformedFixture {
  const fixture = loadFixture(path);
  return transformFixture(fixture);
}

/**
 * List all fixture files for a game type
 *
 * @param gameType - Game type folder name like "five_points"
 * @returns Array of fixture file names (without path)
 */
export function listFixtures(gameType: string): string[] {
  const dir = join(FIXTURES_DIR, gameType);

  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => basename(f, ".json"));
}

/**
 * Load all fixtures for a game type
 *
 * @param gameType - Game type folder name like "five_points"
 * @returns Map of fixture name to fixture object
 */
export function loadAllFixtures(gameType: string): Map<string, Fixture> {
  const fixtures = new Map<string, Fixture>();
  const names = listFixtures(gameType);

  for (const name of names) {
    const fixture = loadFixture(`${gameType}/${name}.json`);
    fixtures.set(name, fixture);
  }

  return fixtures;
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Result from scoreboard lookup
 */
export interface ScoreboardLookup {
  /** Found the expected path */
  found: boolean;
  /** Actual value (if found) */
  actual?: number | string | string[];
  /** Expected value */
  expected: number | string | string[];
  /** Path description for error messages */
  path: string;
}

/**
 * Compare junk arrays (order-independent)
 */
export function compareJunkArrays(
  actual: Array<{ name: string }>,
  expected: string[],
): { match: boolean; missing: string[]; extra: string[] } {
  const actualNames = actual.map((j) => j.name);
  const missing = expected.filter((e) => !actualNames.includes(e));
  const extra = actualNames.filter((a) => !expected.includes(a));

  return {
    match: missing.length === 0 && extra.length === 0,
    missing,
    extra,
  };
}

/**
 * Format a path for error messages
 */
export function formatPath(parts: string[]): string {
  return parts.join(".");
}

/**
 * Deep get a value from an object by path
 */
export function deepGet(obj: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = obj;

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

// =============================================================================
// Test Generation Types
// =============================================================================

/**
 * A single test case generated from fixture expected values
 */
export interface GeneratedTestCase {
  /** Test description */
  name: string;
  /** Path to the expected value in the fixture */
  expectedPath: string[];
  /** Path to the actual value in the scoreboard */
  actualPath: string[];
  /** Expected value */
  expected: number | string | string[];
  /** Assertion type */
  assertionType: "equals" | "containsAll";
}

/**
 * Generate test cases from a fixture's expected values
 */
export function generateTestCases(fixture: Fixture): GeneratedTestCase[] {
  const cases: GeneratedTestCase[] = [];

  // Hole-level expected values
  if (fixture.expected.holes) {
    for (const [holeNum, holeExp] of Object.entries(fixture.expected.holes)) {
      // Team expected values
      if (holeExp.teams) {
        for (const [teamId, teamExp] of Object.entries(holeExp.teams)) {
          if (teamExp.points !== undefined) {
            cases.push({
              name: `hole ${holeNum} team ${teamId} points`,
              expectedPath: [
                "expected",
                "holes",
                holeNum,
                "teams",
                teamId,
                "points",
              ],
              actualPath: ["holes", holeNum, "teams", teamId, "points"],
              expected: teamExp.points,
              assertionType: "equals",
            });
          }
          if (teamExp.lowBall !== undefined) {
            cases.push({
              name: `hole ${holeNum} team ${teamId} lowBall`,
              expectedPath: [
                "expected",
                "holes",
                holeNum,
                "teams",
                teamId,
                "lowBall",
              ],
              actualPath: ["holes", holeNum, "teams", teamId, "lowBall"],
              expected: teamExp.lowBall,
              assertionType: "equals",
            });
          }
          if (teamExp.total !== undefined) {
            cases.push({
              name: `hole ${holeNum} team ${teamId} total`,
              expectedPath: [
                "expected",
                "holes",
                holeNum,
                "teams",
                teamId,
                "total",
              ],
              actualPath: ["holes", holeNum, "teams", teamId, "total"],
              expected: teamExp.total,
              assertionType: "equals",
            });
          }
        }
      }

      // Player expected values
      if (holeExp.players) {
        for (const [playerId, playerExp] of Object.entries(holeExp.players)) {
          if (playerExp.junk !== undefined) {
            cases.push({
              name: `hole ${holeNum} player ${playerId} junk`,
              expectedPath: [
                "expected",
                "holes",
                holeNum,
                "players",
                playerId,
                "junk",
              ],
              actualPath: ["holes", holeNum, "players", playerId, "junk"],
              expected: playerExp.junk,
              assertionType: "containsAll",
            });
          }
          if (playerExp.points !== undefined) {
            cases.push({
              name: `hole ${holeNum} player ${playerId} points`,
              expectedPath: [
                "expected",
                "holes",
                holeNum,
                "players",
                playerId,
                "points",
              ],
              actualPath: ["holes", holeNum, "players", playerId, "points"],
              expected: playerExp.points,
              assertionType: "equals",
            });
          }
          if (playerExp.gross !== undefined) {
            cases.push({
              name: `hole ${holeNum} player ${playerId} gross`,
              expectedPath: [
                "expected",
                "holes",
                holeNum,
                "players",
                playerId,
                "gross",
              ],
              actualPath: ["holes", holeNum, "players", playerId, "gross"],
              expected: playerExp.gross,
              assertionType: "equals",
            });
          }
          if (playerExp.net !== undefined) {
            cases.push({
              name: `hole ${holeNum} player ${playerId} net`,
              expectedPath: [
                "expected",
                "holes",
                holeNum,
                "players",
                playerId,
                "net",
              ],
              actualPath: ["holes", holeNum, "players", playerId, "net"],
              expected: playerExp.net,
              assertionType: "equals",
            });
          }
        }
      }

      // Hole-level multiplier
      if (holeExp.holeMultiplier !== undefined) {
        cases.push({
          name: `hole ${holeNum} holeMultiplier`,
          expectedPath: ["expected", "holes", holeNum, "holeMultiplier"],
          actualPath: ["holes", holeNum, "holeMultiplier"],
          expected: holeExp.holeMultiplier,
          assertionType: "equals",
        });
      }
    }
  }

  // Cumulative expected values
  if (fixture.expected.cumulative) {
    if (fixture.expected.cumulative.teams) {
      for (const [teamId, teamExp] of Object.entries(
        fixture.expected.cumulative.teams,
      )) {
        if (teamExp.pointsTotal !== undefined) {
          cases.push({
            name: `cumulative team ${teamId} pointsTotal`,
            expectedPath: [
              "expected",
              "cumulative",
              "teams",
              teamId,
              "pointsTotal",
            ],
            actualPath: ["cumulative", "teams", teamId, "pointsTotal"],
            expected: teamExp.pointsTotal,
            assertionType: "equals",
          });
        }
      }
    }

    if (fixture.expected.cumulative.players) {
      for (const [playerId, playerExp] of Object.entries(
        fixture.expected.cumulative.players,
      )) {
        if (playerExp.pointsTotal !== undefined) {
          cases.push({
            name: `cumulative player ${playerId} pointsTotal`,
            expectedPath: [
              "expected",
              "cumulative",
              "players",
              playerId,
              "pointsTotal",
            ],
            actualPath: ["cumulative", "players", playerId, "pointsTotal"],
            expected: playerExp.pointsTotal,
            assertionType: "equals",
          });
        }
        if (playerExp.grossTotal !== undefined) {
          cases.push({
            name: `cumulative player ${playerId} grossTotal`,
            expectedPath: [
              "expected",
              "cumulative",
              "players",
              playerId,
              "grossTotal",
            ],
            actualPath: ["cumulative", "players", playerId, "grossTotal"],
            expected: playerExp.grossTotal,
            assertionType: "equals",
          });
        }
      }
    }
  }

  return cases;
}

// =============================================================================
// Re-exports
// =============================================================================

export { safeValidateFixture, validateFixture } from "./fixture-schema";
export type { TransformedFixture } from "./fixture-transformer";
export {
  transformFixture,
  transformFixtureToGame,
} from "./fixture-transformer";
export type { Fixture } from "./fixture-types";
