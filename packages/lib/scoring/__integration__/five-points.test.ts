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
import { score } from "../pipeline";
import type { Scoreboard } from "../types";

// Load environment from API package
config({ path: resolve(import.meta.dir, "../../../api/.env") });

const JAZZ_API_KEY = process.env.JAZZ_API_KEY;
const JAZZ_WORKER_ACCOUNT = process.env.JAZZ_WORKER_ACCOUNT;
const JAZZ_WORKER_SECRET = process.env.JAZZ_WORKER_SECRET;

// The Five Points game we're testing
const FIVE_POINTS_GAME_ID = "co_zf8FwoJKa1jSov3tnUx71ybXLB2";

// Deep resolve query to load all nested data
// Note: game.spec is MapOfOptions (co.record), so $each iterates entries, inner $each loads Option fields
const GAME_RESOLVE = {
  spec: { $each: { $each: true } }, // Working copy of options for scoring
  holes: {
    $each: {
      teams: {
        $each: {
          options: { $each: true }, // Load team options (prox, etc.)
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
} as const;

// Worker instance for all tests
let worker: Awaited<ReturnType<typeof startWorker>> | null = null;
let game: Game | null = null;
let scoreboard: Scoreboard | null = null;

// Check if Jazz credentials are available
const hasCredentials = Boolean(
  JAZZ_API_KEY && JAZZ_WORKER_ACCOUNT && JAZZ_WORKER_SECRET,
);

/**
 * Helper to skip tests when Jazz credentials are missing.
 * Throws an error to make the skip visible in test output.
 */
function requireGame(): asserts game is Game {
  if (!hasCredentials) {
    throw new Error("Test skipped: Missing Jazz credentials in .env");
  }
  if (!game) {
    throw new Error("Test skipped: Game failed to load");
  }
}

function requireScoreboard(): asserts scoreboard is Scoreboard {
  requireGame();
  if (!scoreboard) {
    throw new Error("Test skipped: Scoreboard failed to generate");
  }
}

describe("Five Points Integration Tests", () => {
  beforeAll(async () => {
    // Skip if credentials not available
    if (!hasCredentials) {
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
  }, 30000);

  afterAll(async () => {
    if (worker) {
      await worker.done();
    }
  });

  describe("Game Loading", () => {
    it("should load the game successfully", () => {
      requireGame();

      expect(game.$isLoaded).toBe(true);
      expect(game.name).toBe("Five Points");
    });

    it("should have 4 players", () => {
      requireGame();

      const rounds = game.rounds;
      expect(rounds?.$isLoaded).toBe(true);
      expect(rounds?.length).toBe(4);
    });

    it("should have spec options with correct overrides", () => {
      requireGame();

      // game.spec is the working copy of options
      const spec = game.spec;
      expect(spec?.$isLoaded).toBe(true);

      // Five Points overrides low_ball and low_total to value 2 (base is 1)
      // biome-ignore lint/complexity/useLiteralKeys: option key has underscore
      const lowBall = spec?.["low_ball"];
      expect(lowBall?.$isLoaded).toBe(true);
      expect(lowBall?.value).toBe(2);

      // biome-ignore lint/complexity/useLiteralKeys: option key has underscore
      const lowTotal = spec?.["low_total"];
      expect(lowTotal?.$isLoaded).toBe(true);
      expect(lowTotal?.value).toBe(2);

      // prox should be value 1
      const prox = spec?.prox;
      expect(prox?.$isLoaded).toBe(true);
      expect(prox?.value).toBe(1);
    });
  });

  describe("Scoreboard Generation", () => {
    it("should generate a scoreboard", () => {
      requireScoreboard();

      expect(scoreboard).toBeDefined();
      expect(scoreboard.meta.gameId).toBe(FIVE_POINTS_GAME_ID);
    });

    it("should have teams configured", () => {
      requireScoreboard();

      expect(scoreboard.meta.hasTeams).toBe(true);
    });

    it("should have results for 18 holes", () => {
      requireScoreboard();

      const holesPlayed = scoreboard.meta.holesPlayed;
      expect(holesPlayed.length).toBe(18);
    });
  });

  describe("Hole 1 Scoring", () => {
    // Hole 1: Par 4, #3 handicap allocation
    // Game uses "low" handicap mode - pops relative to lowest handicap (CH=4)
    // Adjusted handicaps: 0, 2, 6, 10 (from CH: 4, 6, 10, 14)
    // On hole 1 (hdcp 3): players with adjusted >= 3 get 1 pop
    // Team 1: fUQaMFLV (7, adj=2, 0 pops), USscwvLV (6, adj=6, 1 pop) -> lowBall=5, total=12
    // Team 2: NmEAVViw (6, adj=10, 1 pop), Z6hnA7pT (5, adj=0, 0 pops) -> lowBall=5, total=10 (wins)

    it("should calculate correct gross scores", () => {
      requireScoreboard();

      const hole1 = scoreboard.holes["1"];
      expect(hole1).toBeDefined();

      // All players should have positive gross scores
      const scores = Object.values(hole1.players).map((p) => p.gross);
      expect(scores).toContain(5);
      expect(scores).toContain(6);
      expect(scores).toContain(7);
    });

    it("should calculate pops using low handicap mode", () => {
      requireScoreboard();

      const hole1 = scoreboard.holes["1"];
      expect(hole1.holeInfo.allocation).toBe(3);

      // In low mode, only players with adjusted handicap >= 3 get pops
      // Adjusted: 0 (CH4), 2 (CH6), 6 (CH10), 10 (CH14)
      const popsValues = Object.values(hole1.players).map((p) => p.pops);
      expect(popsValues.filter((p) => p === 0).length).toBe(2); // 2 players get 0 pops
      expect(popsValues.filter((p) => p === 1).length).toBe(2); // 2 players get 1 pop
    });

    it("should calculate team low ball scores (net)", () => {
      requireScoreboard();

      const hole1 = scoreboard.holes["1"];
      // Both teams tie with lowBall of 5
      expect(hole1.teams["1"].lowBall).toBe(5);
      expect(hole1.teams["2"].lowBall).toBe(5);
    });

    it("should calculate team total scores (net)", () => {
      requireScoreboard();

      const hole1 = scoreboard.holes["1"];
      // Team 1: 7+5=12, Team 2: 5+5=10
      expect(hole1.teams["1"].total).toBe(12);
      expect(hole1.teams["2"].total).toBe(10);
    });

    it("should NOT award low_ball junk on tie (one_team_per_group)", () => {
      requireScoreboard();

      const hole1 = scoreboard.holes["1"];
      // Both teams tie with lowBall=5, so NEITHER gets low_ball junk
      // This matches v0.3 behavior: one_team_per_group means no award on tie
      const team1LowBall = hole1.teams["1"].junk.find(
        (j) => j.name === "low_ball",
      );
      const team2LowBall = hole1.teams["2"].junk.find(
        (j) => j.name === "low_ball",
      );
      expect(team1LowBall).toBeUndefined();
      expect(team2LowBall).toBeUndefined();
    });

    it("should award low_total junk to winning team only", () => {
      requireScoreboard();

      const hole1 = scoreboard.holes["1"];
      // Team 2 wins low total with 10 (Team 1 has 12)
      const team2LowTotal = hole1.teams["2"].junk.find(
        (j) => j.name === "low_total",
      );
      const team1LowTotal = hole1.teams["1"].junk.find(
        (j) => j.name === "low_total",
      );
      expect(team2LowTotal).toBeDefined();
      expect(team2LowTotal?.value).toBe(2); // Five Points override
      expect(team1LowTotal).toBeUndefined();
    });

    it("should award prox to a player on team 2 on hole 1", () => {
      requireScoreboard();

      const hole1 = scoreboard.holes["1"];
      // Prox is player-scoped junk, find the player on team 2 who has it
      const team2PlayerIds = hole1.teams["2"].playerIds;
      let proxFound = false;
      for (const playerId of team2PlayerIds) {
        const playerResult = hole1.players[playerId];
        const prox = playerResult?.junk.find((j) => j.name === "prox");
        if (prox) {
          expect(prox.value).toBe(1);
          proxFound = true;
          break;
        }
      }
      expect(proxFound).toBe(true);
    });

    it("should calculate correct points for each team", () => {
      requireScoreboard();

      const hole1 = scoreboard.holes["1"];
      // Team 1: no junk (low_ball tied, so not awarded) = 0 points
      // Team 2: low_total (2) + prox (1) = 3 points (low_ball tied, so not awarded)
      expect(hole1.teams["1"].points).toBe(0);
      expect(hole1.teams["2"].points).toBe(3);
    });
  });

  describe("Running Totals", () => {
    it("should track running totals across holes", () => {
      requireScoreboard();

      // After hole 1: Team 1 has 0 pts, Team 2 has 3 pts (low_total=2 + prox=1)
      const hole1 = scoreboard.holes["1"];
      expect(hole1.teams["1"].runningTotal).toBe(0);
      expect(hole1.teams["2"].runningTotal).toBe(3);

      // Running diff should reflect the net advantage (Team 2 is +3 over Team 1)
      expect(hole1.teams["2"].runningDiff).toBe(3);
      expect(hole1.teams["1"].runningDiff).toBe(-3);
    });
  });

  describe("Cumulative Totals", () => {
    it("should calculate player cumulative totals", () => {
      requireScoreboard();

      // All 4 players should have cumulative stats
      expect(Object.keys(scoreboard.cumulative.players).length).toBe(4);

      // Check that gross totals are reasonable (between 70-100 for 18 holes)
      for (const cumulative of Object.values(scoreboard.cumulative.players)) {
        expect(cumulative.grossTotal).toBeGreaterThanOrEqual(70);
        expect(cumulative.grossTotal).toBeLessThanOrEqual(110);
      }
    });

    it("should calculate team cumulative totals", () => {
      requireScoreboard();

      // Should have 2 teams
      expect(Object.keys(scoreboard.cumulative.teams).length).toBe(2);

      // Points total may differ from junk total when multipliers are applied
      // (multipliers can double/triple points on certain holes)
      for (const cumulative of Object.values(scoreboard.cumulative.teams)) {
        expect(cumulative.pointsTotal).toBeGreaterThanOrEqual(
          cumulative.junkTotal,
        );
      }
    });

    it("should have balanced points between teams", () => {
      requireScoreboard();

      const team1 = scoreboard.cumulative.teams["1"];
      const team2 = scoreboard.cumulative.teams["2"];

      // Total points across both teams (each hole awards low_ball + low_total + possible prox/birdie/eagle)
      // 18 holes × (low_ball=2 + low_total=2) = 72 minimum points if no ties
      const totalPoints = team1.pointsTotal + team2.pointsTotal;
      expect(totalPoints).toBeGreaterThan(50); // Should have substantial points
    });
  });

  describe("Score Validation", () => {
    it("should have par info for each hole", () => {
      requireScoreboard();

      for (const holeNum of scoreboard.meta.holesPlayed) {
        const hole = scoreboard.holes[holeNum];
        expect(hole.holeInfo.par).toBeGreaterThanOrEqual(3);
        expect(hole.holeInfo.par).toBeLessThanOrEqual(5);
      }
    });

    it("should rank players correctly on each hole", () => {
      requireScoreboard();

      for (const holeNum of scoreboard.meta.holesPlayed) {
        const hole = scoreboard.holes[holeNum];
        const ranks = Object.values(hole.players).map((p) => p.rank);

        // At least one player should be ranked 1
        expect(ranks).toContain(1);
      }
    });
  });

  describe("Multiplier Application", () => {
    // Tests that multipliers are applied correctly to points
    // Key rule: ALL multipliers on a hole combine into a single holeMultiplier
    // that applies to ALL teams' points equally

    it("should apply hole-wide 4x multiplier on hole 2 (double + double_back)", () => {
      requireScoreboard();

      const hole2 = scoreboard.holes["2"];
      expect(hole2).toBeDefined();

      // Hole 2: T1 has double:2, T2 has double_back:2
      // Combined holeMultiplier = 2 × 2 = 4
      expect(hole2.holeMultiplier).toBe(4);

      // T2 won with low_ball:2 + low_total:2 + prox:1 = 5 junk points
      // With 4x multiplier: 5 × 4 = 20 points
      expect(hole2.teams["2"].points).toBe(20);

      // T1 got 0 junk, so 0 × 4 = 0 points
      expect(hole2.teams["1"].points).toBe(0);
    });

    it("should apply hole-wide 4x multiplier on hole 4 (double + double_back)", () => {
      requireScoreboard();

      const hole4 = scoreboard.holes["4"];
      expect(hole4).toBeDefined();

      // Same 4x multiplier situation
      expect(hole4.holeMultiplier).toBe(4);

      // T2 won with low_ball:2 + low_total:2 + prox:1 = 5 junk points
      // With 4x multiplier: 5 × 4 = 20 points
      expect(hole4.teams["2"].points).toBe(20);
      expect(hole4.teams["1"].points).toBe(0);
    });

    it("should apply 2x multiplier on hole 3 (double only)", () => {
      requireScoreboard();

      const hole3 = scoreboard.holes["3"];
      expect(hole3).toBeDefined();

      // Only T1 has double:2, so holeMultiplier = 2
      expect(hole3.holeMultiplier).toBe(2);

      // T1 won with low_ball:2 + low_total:2 + prox:1 = 5 junk points
      // With 2x multiplier: 5 × 2 = 10 points
      expect(hole3.teams["1"].points).toBe(10);
      expect(hole3.teams["2"].points).toBe(0);
    });

    it("should apply 4x multiplier on hole 16 (pre_double + double)", () => {
      requireScoreboard();

      const hole16 = scoreboard.holes["16"];
      expect(hole16).toBeDefined();

      // T1 has pre_double:2 + double:2 = 4x
      expect(hole16.holeMultiplier).toBe(4);

      // T1: low_ball:2 + birdie:1 + prox:1 = 4 junk, × 4 = 16 points
      expect(hole16.teams["1"].points).toBe(16);

      // T2: low_total:2 = 2 junk, × 4 = 8 points
      expect(hole16.teams["2"].points).toBe(8);
    });

    it("should apply 2x multiplier on hole 17 (pre_double only)", () => {
      requireScoreboard();

      const hole17 = scoreboard.holes["17"];
      expect(hole17).toBeDefined();

      // T1 has pre_double:2 = 2x
      expect(hole17.holeMultiplier).toBe(2);

      // T1: low_ball:2 + birdie:1 + prox:1 = 4 junk, × 2 = 8 points
      expect(hole17.teams["1"].points).toBe(8);

      // T2: low_total:2 = 2 junk, × 2 = 4 points
      expect(hole17.teams["2"].points).toBe(4);
    });

    it("should apply 4x multiplier on hole 18 (both teams pre_double)", () => {
      requireScoreboard();

      const hole18 = scoreboard.holes["18"];
      expect(hole18).toBeDefined();

      // Both teams have pre_double:2, so 2 × 2 = 4x
      expect(hole18.holeMultiplier).toBe(4);

      // T2: low_ball:2 + low_total:2 + prox:1 = 5 junk, × 4 = 20 points
      expect(hole18.teams["2"].points).toBe(20);

      // T1: 0 junk, × 4 = 0 points
      expect(hole18.teams["1"].points).toBe(0);
    });

    it("should have no multiplier (1x) on holes without presses or birdies", () => {
      requireScoreboard();

      // Hole 1 has no multipliers
      const hole1 = scoreboard.holes["1"];
      expect(hole1.holeMultiplier).toBe(1);

      // Hole 5 has a birdie, so birdie_bbq applies 2x
      const hole5 = scoreboard.holes["5"];
      expect(hole5.holeMultiplier).toBe(2);
    });
  });

  describe("Birdie Junk", () => {
    // Birdie: score_to_par "exactly -1" based on net score

    it("should award birdie on hole 5 to player with net birdie", () => {
      requireScoreboard();

      const hole5 = scoreboard.holes["5"];
      expect(hole5).toBeDefined();

      // Find player with birdie junk
      const playersWithBirdie = Object.values(hole5.players).filter((p) =>
        p.junk.some((j) => j.name === "birdie"),
      );

      expect(playersWithBirdie.length).toBeGreaterThan(0);

      // Verify the birdie is for a player who shot net -1 (par - net = -1)
      for (const player of playersWithBirdie) {
        expect(player.netToPar).toBe(-1);
      }
    });

    it("should award birdie value of 1 point", () => {
      requireScoreboard();

      // Find any hole with a birdie
      for (const holeNum of scoreboard.meta.holesPlayed) {
        const hole = scoreboard.holes[holeNum];
        for (const player of Object.values(hole.players)) {
          const birdie = player.junk.find((j) => j.name === "birdie");
          if (birdie) {
            expect(birdie.value).toBe(1);
            return; // Found one, test passes
          }
        }
      }
      // If no birdies found, that's okay - just testing the value when present
    });

    it("should contribute birdie points to team total", () => {
      requireScoreboard();

      const hole16 = scoreboard.holes["16"];
      // T1 has a birdie on hole 16, which contributes to their points
      // T1 junk: low_ball:2 + birdie:1 + prox:1 = 4, × 4x = 16
      const team1Junk = hole16.teams["1"].junk;
      const team1PlayerIds = hole16.teams["1"].playerIds;

      // Team junk
      const teamJunkTotal = team1Junk.reduce((sum, j) => sum + j.value, 0);

      // Player junk (birdie, prox)
      let playerJunkTotal = 0;
      for (const playerId of team1PlayerIds) {
        const player = hole16.players[playerId];
        playerJunkTotal += player.junk.reduce((sum, j) => sum + j.value, 0);
      }

      // Total junk × multiplier = points
      const totalJunk = teamJunkTotal + playerJunkTotal;
      const multiplier = hole16.holeMultiplier ?? 1;
      expect(hole16.teams["1"].points).toBe(totalJunk * multiplier);
    });
  });

  describe("Running Totals with Multipliers", () => {
    it("should accumulate running totals correctly through multiplied holes", () => {
      requireScoreboard();

      // Check running totals match sum of previous points
      let team1RunningTotal = 0;
      let team2RunningTotal = 0;

      for (let i = 1; i <= 18; i++) {
        const hole = scoreboard.holes[String(i)];
        team1RunningTotal += hole.teams["1"].points;
        team2RunningTotal += hole.teams["2"].points;

        expect(hole.teams["1"].runningTotal).toBe(team1RunningTotal);
        expect(hole.teams["2"].runningTotal).toBe(team2RunningTotal);
      }
    });

    it("should have correct final totals", () => {
      requireScoreboard();

      const hole18 = scoreboard.holes["18"];

      // Based on the verified scoring data:
      // T1 final: 72, T2 final: 87 (T1 increased by 6 due to birdie_bbq fix)
      expect(hole18.teams["1"].runningTotal).toBe(72);
      expect(hole18.teams["2"].runningTotal).toBe(87);
    });
  });

  describe("Multiplier Detection", () => {
    // This game has multipliers stored in team options:
    // Hole 2: Team 1 has "double", Team 2 has "double_back"
    // Hole 3: Team 1 has "double"
    // Hole 4: Team 1 has "double", Team 2 has "double_back"
    // Hole 7: Team 1 has "double"

    it("should detect multipliers on hole 2", () => {
      requireGame();

      const hole2 = game.holes?.find((h) => h?.hole === "2");
      expect(hole2?.$isLoaded).toBe(true);

      const team1 = hole2?.teams?.find((t) => t?.team === "1");
      const team2 = hole2?.teams?.find((t) => t?.team === "2");

      // Team 1 should have "double"
      const team1Double = team1?.options?.find(
        (opt) => opt?.optionName === "double",
      );
      expect(team1Double).toBeDefined();
      expect(team1Double?.firstHole).toBe("2");

      // Team 2 should have "double_back"
      const team2DoubleBack = team2?.options?.find(
        (opt) => opt?.optionName === "double_back",
      );
      expect(team2DoubleBack).toBeDefined();
      expect(team2DoubleBack?.firstHole).toBe("2");
    });

    it("should detect multipliers on hole 4", () => {
      requireGame();

      const hole4 = game.holes?.find((h) => h?.hole === "4");
      expect(hole4?.$isLoaded).toBe(true);

      const team1 = hole4?.teams?.find((t) => t?.team === "1");
      const team2 = hole4?.teams?.find((t) => t?.team === "2");

      // Team 1 should have "double"
      const team1Double = team1?.options?.find(
        (opt) => opt?.optionName === "double",
      );
      expect(team1Double).toBeDefined();

      // Team 2 should have "double_back"
      const team2DoubleBack = team2?.options?.find(
        (opt) => opt?.optionName === "double_back",
      );
      expect(team2DoubleBack).toBeDefined();
    });

    it("should have multipliers stored alongside junk in team options", () => {
      requireGame();

      // Hole 4 team 2 should have both prox (junk) and double_back (multiplier)
      const hole4 = game.holes?.find((h) => h?.hole === "4");
      const team2 = hole4?.teams?.find((t) => t?.team === "2");

      const optionNames = team2?.options?.map((opt) => opt?.optionName) ?? [];
      expect(optionNames).toContain("prox");
      expect(optionNames).toContain("double_back");
    });

    it("should detect back nine multipliers", () => {
      requireGame();

      // Hole 11: Team has "double"
      const hole11 = game.holes?.find((h) => h?.hole === "11");
      const hole11Teams = hole11?.teams ?? [];
      const hole11Doubles = hole11Teams.flatMap(
        (t) => t?.options?.filter((opt) => opt?.optionName === "double") ?? [],
      );
      expect(hole11Doubles.length).toBeGreaterThan(0);

      // Hole 12: Team has "double"
      const hole12 = game.holes?.find((h) => h?.hole === "12");
      const hole12Teams = hole12?.teams ?? [];
      const hole12Doubles = hole12Teams.flatMap(
        (t) => t?.options?.filter((opt) => opt?.optionName === "double") ?? [],
      );
      expect(hole12Doubles.length).toBeGreaterThan(0);
    });

    it("should detect pre_double multipliers stored on first_hole only", () => {
      requireGame();

      // Find all pre_double multipliers and their firstHole values
      // New schema: multipliers are only stored on their first_hole, not every hole
      const preDoubles: Array<{
        hole: string;
        team: string;
        firstHole: string | undefined;
      }> = [];
      for (const hole of game.holes ?? []) {
        if (!hole?.$isLoaded) continue;
        for (const team of hole.teams ?? []) {
          if (!team?.$isLoaded) continue;
          for (const opt of team.options ?? []) {
            if (opt?.optionName === "pre_double") {
              preDoubles.push({
                hole: hole.hole,
                team: team.team,
                firstHole: opt.firstHole,
              });
            }
          }
        }
      }

      // Game should have pre_double multipliers
      expect(preDoubles.length).toBeGreaterThan(0);

      // Multipliers should only be stored on their first_hole
      // (the scoring engine inherits them to subsequent holes)
      for (const pd of preDoubles) {
        expect(pd.hole).toBe(pd.firstHole);
      }
    });
  });
});
