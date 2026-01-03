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

// biome-ignore-all lint/complexity/useLiteralKeys: option keys have underscores

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
const FIVE_POINTS_GAME_ID = "co_zEEke11BQDqGfoPUeQztziP2wf7";

// Deep resolve query to load all nested data
const GAME_RESOLVE = {
  specs: {
    $each: {
      options: { $each: true },
      teamsConfig: true,
    },
  },
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
  }, 30000);

  afterAll(async () => {
    if (worker) {
      await worker.done();
    }
  });

  describe("Game Loading", () => {
    it("should load the game successfully", () => {
      if (!game) {
        console.warn("Skipping: No game loaded");
        return;
      }

      expect(game.$isLoaded).toBe(true);
      expect(game.name).toBe("Five Points");
    });

    it("should have 4 players", () => {
      if (!game) return;

      const rounds = game.rounds;
      expect(rounds?.$isLoaded).toBe(true);
      expect(rounds?.length).toBe(4);
    });

    it("should have spec options with correct overrides", () => {
      if (!game) return;

      const spec = game.specs?.[0];
      expect(spec?.$isLoaded).toBe(true);
      expect(spec?.options?.$isLoaded).toBe(true);

      // Five Points overrides low_ball and low_total to value 2 (base is 1)
      const lowBall = spec?.options?.["low_ball"];
      expect(lowBall?.$isLoaded).toBe(true);
      expect(lowBall?.value).toBe(2);

      const lowTotal = spec?.options?.["low_total"];
      expect(lowTotal?.$isLoaded).toBe(true);
      expect(lowTotal?.value).toBe(2);

      // prox should be value 1
      const prox = spec?.options?.["prox"];
      expect(prox?.$isLoaded).toBe(true);
      expect(prox?.value).toBe(1);
    });
  });

  describe("Scoreboard Generation", () => {
    it("should generate a scoreboard", () => {
      if (!scoreboard) return;

      expect(scoreboard).toBeDefined();
      expect(scoreboard.meta.gameId).toBe(FIVE_POINTS_GAME_ID);
    });

    it("should have teams configured", () => {
      if (!scoreboard) return;

      expect(scoreboard.meta.hasTeams).toBe(true);
    });

    it("should have results for 18 holes", () => {
      if (!scoreboard) return;

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
      if (!scoreboard) return;

      const hole1 = scoreboard.holes["1"];
      expect(hole1).toBeDefined();

      // All players should have positive gross scores
      const scores = Object.values(hole1.players).map((p) => p.gross);
      expect(scores).toContain(5);
      expect(scores).toContain(6);
      expect(scores).toContain(7);
    });

    it("should calculate pops using low handicap mode", () => {
      if (!scoreboard) return;

      const hole1 = scoreboard.holes["1"];
      expect(hole1.holeInfo.allocation).toBe(3);

      // In low mode, only players with adjusted handicap >= 3 get pops
      // Adjusted: 0 (CH4), 2 (CH6), 6 (CH10), 10 (CH14)
      const popsValues = Object.values(hole1.players).map((p) => p.pops);
      expect(popsValues.filter((p) => p === 0).length).toBe(2); // 2 players get 0 pops
      expect(popsValues.filter((p) => p === 1).length).toBe(2); // 2 players get 1 pop
    });

    it("should calculate team low ball scores (net)", () => {
      if (!scoreboard) return;

      const hole1 = scoreboard.holes["1"];
      // Both teams tie with lowBall of 5
      expect(hole1.teams["1"].lowBall).toBe(5);
      expect(hole1.teams["2"].lowBall).toBe(5);
    });

    it("should calculate team total scores (net)", () => {
      if (!scoreboard) return;

      const hole1 = scoreboard.holes["1"];
      // Team 1: 7+5=12, Team 2: 5+5=10
      expect(hole1.teams["1"].total).toBe(12);
      expect(hole1.teams["2"].total).toBe(10);
    });

    it("should NOT award low_ball junk on tie (one_team_per_group)", () => {
      if (!scoreboard) return;

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
      if (!scoreboard) return;

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

    it("should calculate correct points for each team", () => {
      if (!scoreboard) return;

      const hole1 = scoreboard.holes["1"];
      // Team 1: no junk (low_ball tied, so not awarded) = 0 points
      // Team 2: low_total (2) = 2 points (low_ball tied, so not awarded)
      expect(hole1.teams["1"].points).toBe(0);
      expect(hole1.teams["2"].points).toBe(2);
    });
  });

  describe("Running Totals", () => {
    it("should track running totals across holes", () => {
      if (!scoreboard) return;

      // After hole 1: Team 1 has 0 pts (low_ball tied), Team 2 has 2 pts (low_total only)
      const hole1 = scoreboard.holes["1"];
      expect(hole1.teams["1"].runningTotal).toBe(0);
      expect(hole1.teams["2"].runningTotal).toBe(2);

      // Running diff should reflect the net advantage (Team 2 is +2 over Team 1)
      expect(hole1.teams["2"].runningDiff).toBe(2);
      expect(hole1.teams["1"].runningDiff).toBe(-2);
    });
  });

  describe("Cumulative Totals", () => {
    it("should calculate player cumulative totals", () => {
      if (!scoreboard) return;

      // All 4 players should have cumulative stats
      expect(Object.keys(scoreboard.cumulative.players).length).toBe(4);

      // Check that gross totals are reasonable (between 70-100 for 18 holes)
      for (const cumulative of Object.values(scoreboard.cumulative.players)) {
        expect(cumulative.grossTotal).toBeGreaterThanOrEqual(70);
        expect(cumulative.grossTotal).toBeLessThanOrEqual(110);
      }
    });

    it("should calculate team cumulative totals", () => {
      if (!scoreboard) return;

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
      if (!scoreboard) return;

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
      if (!scoreboard) return;

      for (const holeNum of scoreboard.meta.holesPlayed) {
        const hole = scoreboard.holes[holeNum];
        expect(hole.holeInfo.par).toBeGreaterThanOrEqual(3);
        expect(hole.holeInfo.par).toBeLessThanOrEqual(5);
      }
    });

    it("should rank players correctly on each hole", () => {
      if (!scoreboard) return;

      for (const holeNum of scoreboard.meta.holesPlayed) {
        const hole = scoreboard.holes[holeNum];
        const ranks = Object.values(hole.players).map((p) => p.rank);

        // At least one player should be ranked 1
        expect(ranks).toContain(1);
      }
    });
  });

  describe("Multiplier Detection", () => {
    // This game has multipliers stored in team options:
    // Hole 2: Team 1 has "double", Team 2 has "double_back"
    // Hole 3: Team 1 has "double"
    // Hole 4: Team 1 has "double", Team 2 has "double_back"
    // Hole 7: Team 1 has "double"

    it("should detect multipliers on hole 2", () => {
      if (!game) return;

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
      if (!game) return;

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
      if (!game) return;

      // Hole 4 team 2 should have both prox (junk) and double_back (multiplier)
      const hole4 = game.holes?.find((h) => h?.hole === "4");
      const team2 = hole4?.teams?.find((t) => t?.team === "2");

      const optionNames = team2?.options?.map((opt) => opt?.optionName) ?? [];
      expect(optionNames).toContain("prox");
      expect(optionNames).toContain("double_back");
    });

    it("should detect back nine multipliers", () => {
      if (!game) return;

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

    it("should detect pre_double multipliers on holes 16-18", () => {
      if (!game) return;

      // Hole 16: has both pre_double and double
      const hole16 = game.holes?.find((h) => h?.hole === "16");
      const hole16Teams = hole16?.teams ?? [];
      const hole16PreDoubles = hole16Teams.flatMap(
        (t) =>
          t?.options?.filter((opt) => opt?.optionName === "pre_double") ?? [],
      );
      expect(hole16PreDoubles.length).toBeGreaterThan(0);

      // Hole 17: has pre_double
      const hole17 = game.holes?.find((h) => h?.hole === "17");
      const hole17Teams = hole17?.teams ?? [];
      const hole17PreDoubles = hole17Teams.flatMap(
        (t) =>
          t?.options?.filter((opt) => opt?.optionName === "pre_double") ?? [],
      );
      expect(hole17PreDoubles.length).toBeGreaterThan(0);

      // Hole 18: both teams have pre_double
      const hole18 = game.holes?.find((h) => h?.hole === "18");
      const hole18Teams = hole18?.teams ?? [];
      const hole18PreDoubles = hole18Teams.flatMap(
        (t) =>
          t?.options?.filter((opt) => opt?.optionName === "pre_double") ?? [],
      );
      expect(hole18PreDoubles.length).toBe(2); // Both teams
    });
  });
});
