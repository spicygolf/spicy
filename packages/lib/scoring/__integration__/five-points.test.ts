/**
 * Five Points Integration Tests
 *
 * Tests the scoring pipeline against a real Five Points game from Jazz.
 * Game ID: co_zEEke11BQDqGfoPUeQztziP2wf7
 *
 * This test requires Jazz credentials in packages/api/.env:
 * - JAZZ_API_KEY
 * - JAZZ_WORKER_ACCOUNT
 * - JAZZ_WORKER_SECRET
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { config } from "dotenv";
import type { ID } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import { Game, PlayerAccount } from "../../schema";
import { getJunkOptions } from "../junk-engine";
import { buildContext, score } from "../pipeline";
import type { Scoreboard, ScoringContext } from "../types";

// Load environment from API package
// import.meta.dir gives the source file directory, we need to go up to packages/lib, then to packages/api
config({ path: resolve(import.meta.dir, "../../../api/.env") });

const JAZZ_API_KEY = process.env.JAZZ_API_KEY;
const JAZZ_WORKER_ACCOUNT = process.env.JAZZ_WORKER_ACCOUNT;
const JAZZ_WORKER_SECRET = process.env.JAZZ_WORKER_SECRET;

// The Five Points game we're testing
const FIVE_POINTS_GAME_ID = "co_zEEke11BQDqGfoPUeQztziP2wf7";

// Deep resolve query to load all nested data
const GAME_RESOLVE = {
  specs: {
    $each: {
      options: { $each: true }, // Load each option inside the map
      teamsConfig: true,
    },
  },
  holes: {
    $each: {
      teams: {
        $each: {
          rounds: {
            $each: {
              roundToGame: {
                round: {
                  tee: {
                    holes: { $each: true },
                  },
                },
              },
            },
          },
        },
      },
      options: true,
    },
  },
  rounds: {
    $each: {
      round: {
        tee: {
          holes: { $each: true },
        },
        scores: { $each: true },
      },
    },
  },
  players: { $each: { handicap: true } },
  options: true,
} as const;

// Worker instance for all tests
let worker: Awaited<ReturnType<typeof startWorker>> | null = null;
let game: Game | null = null;
let scoreboard: Scoreboard | null = null;

describe("Five Points Integration Tests", () => {
  beforeAll(async () => {
    // Skip if credentials not available
    if (!JAZZ_API_KEY || !JAZZ_WORKER_ACCOUNT || !JAZZ_WORKER_SECRET) {
      console.warn("Skipping integration tests: Missing Jazz credentials");
      return;
    }

    // Start Jazz worker
    worker = await startWorker({
      AccountSchema: PlayerAccount,
      syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
      accountID: JAZZ_WORKER_ACCOUNT,
      accountSecret: JAZZ_WORKER_SECRET,
    });

    // Load the game with all nested data
    game = await Game.load(FIVE_POINTS_GAME_ID as ID<typeof Game>, {
      loadAs: worker.worker,
      resolve: GAME_RESOLVE,
    });

    if (!game?.$isLoaded) {
      throw new Error(`Failed to load game ${FIVE_POINTS_GAME_ID}`);
    }

    // Run the scoring pipeline
    scoreboard = score(game);
  }, 30000); // 30 second timeout for loading

  afterAll(async () => {
    if (worker) {
      await worker.done();
    }
  });

  it("should load the game successfully", () => {
    if (!game) {
      console.warn("Skipping: No game loaded");
      return;
    }

    expect(game.$isLoaded).toBe(true);
    expect(game.name).toBe("Five Points");

    // Debug: Check where options are stored
    console.log("\n=== DEBUG: Options Location ===");
    console.log("game.options loaded?", game.options?.$isLoaded);
    if (game.options?.$isLoaded) {
      const optKeys = Object.keys(game.options).filter(
        (k) => !k.startsWith("$") && k !== "_refs",
      );
      console.log("game.options keys:", optKeys);
    }

    const spec = game.specs?.[0];
    console.log("spec loaded?", spec?.$isLoaded);
    console.log("spec.options loaded?", spec?.options?.$isLoaded);
    if (spec?.options?.$isLoaded) {
      const specOptKeys = Object.keys(spec.options).filter(
        (k) => !k.startsWith("$") && k !== "_refs",
      );
      console.log("spec.options keys:", specOptKeys);
      // Check first option
      const firstKey = specOptKeys[0];
      if (firstKey) {
        const firstOpt = spec.options[firstKey];
        console.log(`First option (${firstKey}):`, {
          loaded: firstOpt?.$isLoaded,
          type: firstOpt?.type,
          name: firstOpt?.name,
        });
      }

      // Check low_ball value specifically
      const lowBall = spec.options["low_ball"];
      console.log("low_ball option:", {
        loaded: lowBall?.$isLoaded,
        value: lowBall?.value,
        name: lowBall?.name,
      });
      const lowTotal = spec.options["low_total"];
      console.log("low_total option:", {
        loaded: lowTotal?.$isLoaded,
        value: lowTotal?.value,
        name: lowTotal?.name,
      });
    }

    // Check first hole options
    const firstHole = game.holes?.[0];
    console.log("firstHole loaded?", firstHole?.$isLoaded);
    console.log("firstHole.options loaded?", firstHole?.options?.$isLoaded);
    if (firstHole?.options?.$isLoaded) {
      const holeOptKeys = Object.keys(firstHole.options).filter(
        (k) => !k.startsWith("$") && k !== "_refs",
      );
      console.log("firstHole.options keys:", holeOptKeys);
    }

    // Check handicaps on rounds
    console.log("\n=== DEBUG: Handicaps ===");
    if (game.rounds?.$isLoaded) {
      for (const rtg of game.rounds) {
        if (rtg?.$isLoaded) {
          const round = rtg.round;
          console.log(
            `RTG: courseHandicap=${rtg.courseHandicap}, gameHandicap=${rtg.gameHandicap}, handicapIndex=${rtg.handicapIndex}`,
          );
          if (round?.$isLoaded) {
            console.log(`  Round playerId: ${round.playerId}`);
          }
        }
      }
    }
  });

  it("should have 4 players", () => {
    if (!game) return;

    const rounds = game.rounds;
    expect(rounds?.$isLoaded).toBe(true);
    expect(rounds?.length).toBe(4);
  });

  it("should generate a scoreboard", () => {
    if (!scoreboard) return;

    expect(scoreboard).toBeDefined();
    expect(scoreboard.meta.gameId).toBe(FIVE_POINTS_GAME_ID);
  });

  it("should have teams configured", () => {
    if (!scoreboard) return;

    expect(scoreboard.meta.hasTeams).toBe(true);
  });

  it("should have results for played holes", () => {
    if (!scoreboard) return;

    const holesPlayed = scoreboard.meta.holesPlayed;
    expect(holesPlayed.length).toBeGreaterThan(0);

    // Each hole should have results
    for (const holeNum of holesPlayed) {
      const holeResult = scoreboard.holes[holeNum];
      expect(holeResult).toBeDefined();
      expect(Object.keys(holeResult.players).length).toBe(4);
    }
  });

  // Hole-by-hole tests - we'll add specific assertions once we know the expected values
  describe("Hole 1", () => {
    it("should calculate gross scores", () => {
      if (!scoreboard) return;

      const hole1 = scoreboard.holes["1"];
      if (!hole1) {
        console.warn("Hole 1 not found in scoreboard");
        return;
      }

      // Log the actual values so we can set up proper assertions
      console.log("Hole 1 results:");
      for (const [playerId, result] of Object.entries(hole1.players)) {
        console.log(
          `  ${playerId}: gross=${result.gross}, net=${result.net}, pops=${result.pops}`,
        );
      }

      // Basic assertion - all players should have valid scores
      for (const result of Object.values(hole1.players)) {
        expect(result.gross).toBeGreaterThan(0);
      }
    });

    it("should calculate team scores", () => {
      if (!scoreboard) return;

      const hole1 = scoreboard.holes["1"];
      if (!hole1) return;

      console.log("Hole 1 team results:");
      for (const [teamId, result] of Object.entries(hole1.teams)) {
        console.log(
          `  ${teamId}: lowBall=${result.lowBall}, total=${result.total}, rank=${result.rank}`,
        );
      }

      // Should have 2 teams
      expect(Object.keys(hole1.teams).length).toBe(2);
    });

    it("should award junk points", () => {
      if (!scoreboard) return;

      const hole1 = scoreboard.holes["1"];
      if (!hole1) return;

      // Log junk awards
      console.log("Hole 1 junk:");
      for (const [teamId, result] of Object.entries(hole1.teams)) {
        if (result.junk.length > 0) {
          console.log(`  Team ${teamId}:`, result.junk);
        }
      }
      for (const [playerId, result] of Object.entries(hole1.players)) {
        if (result.junk.length > 0) {
          console.log(`  Player ${playerId}:`, result.junk);
        }
      }
    });
  });

  describe("Cumulative Totals", () => {
    it("should calculate player cumulative totals", () => {
      if (!scoreboard) return;

      console.log("\nPlayer Cumulative Totals:");
      for (const [playerId, cumulative] of Object.entries(
        scoreboard.cumulative.players,
      )) {
        console.log(
          `  ${playerId}: gross=${cumulative.grossTotal}, net=${cumulative.netTotal}, points=${cumulative.pointsTotal}, junk=${cumulative.junkTotal}`,
        );
      }

      // All players should have cumulative stats
      expect(Object.keys(scoreboard.cumulative.players).length).toBe(4);
    });

    it("should calculate team cumulative totals", () => {
      if (!scoreboard) return;

      console.log("\nTeam Cumulative Totals:");
      for (const [teamId, cumulative] of Object.entries(
        scoreboard.cumulative.teams,
      )) {
        console.log(
          `  ${teamId}: score=${cumulative.scoreTotal}, points=${cumulative.pointsTotal}, junk=${cumulative.junkTotal}`,
        );
      }

      // Should have 2 teams
      expect(Object.keys(scoreboard.cumulative.teams).length).toBe(2);
    });
  });

  // Debug: dump full scoreboard
  it("should dump scoreboard for inspection", () => {
    if (!scoreboard) return;

    console.log("\n=== FULL SCOREBOARD ===");
    console.log(JSON.stringify(scoreboard, null, 2));
  });
});
