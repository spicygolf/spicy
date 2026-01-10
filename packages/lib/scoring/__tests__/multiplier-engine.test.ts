import { describe, expect, it } from "bun:test";
import { evaluateMultipliersForHole } from "../multiplier-engine";
import type {
  HoleResult,
  MultiplierOption,
  ScoringContext,
  TeamHoleResult,
} from "../types";

// Helper to create a minimal team hole result
function createTeamResult(teamId: string): TeamHoleResult {
  return {
    teamId,
    score: 0,
    lowBall: 0,
    total: 0,
    playerIds: [],
    rank: 0,
    tieCount: 0,
    junk: [],
    multipliers: [],
    points: 0,
  };
}

// Helper to create a minimal hole result
function createHoleResult(holeNum: string, teamIds: string[]): HoleResult {
  const teams: Record<string, TeamHoleResult> = {};
  for (const teamId of teamIds) {
    teams[teamId] = createTeamResult(teamId);
  }
  return {
    hole: holeNum,
    holeInfo: { hole: holeNum, par: 4, allocation: 1, yards: 400 },
    players: {},
    teams,
  };
}

// Helper to create a mock game hole with team options
function createMockGameHole(
  holeNum: string,
  teams: Array<{
    teamId: string;
    options?: Array<{ optionName: string; value: string; firstHole?: string }>;
  }>,
) {
  return {
    hole: holeNum,
    $isLoaded: true,
    teams: {
      $isLoaded: true,
      [Symbol.iterator]: function* () {
        for (const team of teams) {
          yield {
            $isLoaded: true,
            team: team.teamId,
            options: team.options
              ? {
                  $isLoaded: true,
                  [Symbol.iterator]: function* () {
                    for (const opt of team.options!) {
                      yield {
                        $isLoaded: true,
                        optionName: opt.optionName,
                        value: opt.value,
                        firstHole: opt.firstHole,
                      };
                    }
                  },
                }
              : undefined,
          };
        }
      },
    },
  };
}

// Helper to create a minimal scoring context
function createContext(
  gameHoles: ReturnType<typeof createMockGameHole>[],
  options: Record<string, MultiplierOption>,
): ScoringContext {
  return {
    game: { $isLoaded: true, $jazz: { id: "test-game" } } as any,
    gameHoles: gameHoles as any,
    rounds: [],
    playerHandicaps: new Map(),
    holeInfoMap: new Map(),
    teamsPerHole: new Map(),
    playerTeamMap: new Map(),
    options: options as any,
    scoreboard: {
      holes: {},
      cumulative: { players: {}, teams: {} },
      meta: {
        gameId: "test",
        holesPlayed: [],
        hasTeams: true,
        pointsPerHole: 5,
      },
    },
  };
}

describe("evaluateMultipliersForHole", () => {
  describe("rest_of_nine inherited multipliers", () => {
    it("should apply inherited pre_double on hole 2 when activated on hole 1", () => {
      // Create game holes: hole 1 has pre_double activated, hole 2 has no options
      const gameHoles = [
        createMockGameHole("1", [
          {
            teamId: "1",
            options: [
              { optionName: "pre_double", value: "true", firstHole: "1" },
            ],
          },
          { teamId: "2" },
        ]),
        createMockGameHole("2", [{ teamId: "1" }, { teamId: "2" }]),
      ];

      // Create the pre_double multiplier option
      const options: Record<string, MultiplierOption> = {
        pre_double: {
          $isLoaded: true,
          name: "pre_double",
          disp: "Pre 2x",
          type: "multiplier",
          sub_type: "press",
          based_on: "user",
          scope: "rest_of_nine",
          value: 2,
        } as MultiplierOption,
      };

      const ctx = createContext(gameHoles, options);

      // Create hole 2 result (no scores yet)
      const hole2Result = createHoleResult("2", ["1", "2"]);

      // Evaluate multipliers for hole 2
      const result = evaluateMultipliersForHole(hole2Result, ctx);

      // Team 1 should have the inherited pre_double multiplier
      expect(result.teams["1"].multipliers).toHaveLength(1);
      expect(result.teams["1"].multipliers[0].name).toBe("pre_double");
      expect(result.teams["1"].multipliers[0].value).toBe(2);

      // Team 2 should have no multipliers (they didn't activate pre_double)
      expect(result.teams["2"].multipliers).toHaveLength(0);
    });

    it("should apply inherited multiplier on hole 9 when activated on hole 1", () => {
      // Create game holes: hole 1 has pre_double, holes 2-9 have no options
      const gameHoles = [
        createMockGameHole("1", [
          {
            teamId: "1",
            options: [
              { optionName: "pre_double", value: "true", firstHole: "1" },
            ],
          },
        ]),
        ...Array.from({ length: 8 }, (_, i) =>
          createMockGameHole(String(i + 2), [{ teamId: "1" }]),
        ),
      ];

      const options: Record<string, MultiplierOption> = {
        pre_double: {
          $isLoaded: true,
          name: "pre_double",
          disp: "Pre 2x",
          type: "multiplier",
          sub_type: "press",
          based_on: "user",
          scope: "rest_of_nine",
          value: 2,
        } as MultiplierOption,
      };

      const ctx = createContext(gameHoles, options);

      // Create hole 9 result
      const hole9Result = createHoleResult("9", ["1"]);

      // Evaluate multipliers for hole 9
      const result = evaluateMultipliersForHole(hole9Result, ctx);

      // Team 1 should have the inherited multiplier on hole 9
      expect(result.teams["1"].multipliers).toHaveLength(1);
      expect(result.teams["1"].multipliers[0].name).toBe("pre_double");
    });

    it("should NOT apply front nine multiplier on back nine (hole 10)", () => {
      // Create game holes: hole 1 has pre_double
      const gameHoles = [
        createMockGameHole("1", [
          {
            teamId: "1",
            options: [
              { optionName: "pre_double", value: "true", firstHole: "1" },
            ],
          },
        ]),
        createMockGameHole("10", [{ teamId: "1" }]),
      ];

      const options: Record<string, MultiplierOption> = {
        pre_double: {
          $isLoaded: true,
          name: "pre_double",
          disp: "Pre 2x",
          type: "multiplier",
          sub_type: "press",
          based_on: "user",
          scope: "rest_of_nine",
          value: 2,
        } as MultiplierOption,
      };

      const ctx = createContext(gameHoles, options);

      // Create hole 10 result
      const hole10Result = createHoleResult("10", ["1"]);

      // Evaluate multipliers for hole 10
      const result = evaluateMultipliersForHole(hole10Result, ctx);

      // Team 1 should NOT have the multiplier (different nine)
      expect(result.teams["1"].multipliers).toHaveLength(0);
    });

    it("should apply back nine multiplier from hole 10 to hole 18", () => {
      // Create game holes: hole 10 has pre_double activated
      const gameHoles = [
        createMockGameHole("10", [
          {
            teamId: "1",
            options: [
              { optionName: "pre_double", value: "true", firstHole: "10" },
            ],
          },
        ]),
        createMockGameHole("18", [{ teamId: "1" }]),
      ];

      const options: Record<string, MultiplierOption> = {
        pre_double: {
          $isLoaded: true,
          name: "pre_double",
          disp: "Pre 2x",
          type: "multiplier",
          sub_type: "press",
          based_on: "user",
          scope: "rest_of_nine",
          value: 2,
        } as MultiplierOption,
      };

      const ctx = createContext(gameHoles, options);

      // Create hole 18 result
      const hole18Result = createHoleResult("18", ["1"]);

      // Evaluate multipliers for hole 18
      const result = evaluateMultipliersForHole(hole18Result, ctx);

      // Team 1 should have the inherited multiplier
      expect(result.teams["1"].multipliers).toHaveLength(1);
      expect(result.teams["1"].multipliers[0].name).toBe("pre_double");
    });
  });
});
