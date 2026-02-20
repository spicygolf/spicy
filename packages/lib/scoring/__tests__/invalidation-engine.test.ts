import { describe, expect, it } from "bun:test";
import { detectInvalidations } from "../invalidation-engine";
import type {
  HoleResult,
  MultiplierOption,
  Scoreboard,
  ScoringContext,
  TeamHoleResult,
} from "../types";

// =============================================================================
// Helpers (mirrors multiplier-engine.test.ts patterns)
// =============================================================================

function createTeamResult(
  teamId: string,
  overrides?: Partial<TeamHoleResult>,
): TeamHoleResult {
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
    ...overrides,
  };
}

function createHoleResult(
  holeNum: string,
  teams: Record<string, Partial<TeamHoleResult>>,
): HoleResult {
  const teamsMap: Record<string, TeamHoleResult> = {};
  for (const [teamId, overrides] of Object.entries(teams)) {
    teamsMap[teamId] = createTeamResult(teamId, overrides);
  }
  return {
    hole: holeNum,
    holeInfo: { hole: holeNum, par: 4, allocation: 1, yards: 400 },
    players: {},
    teams: teamsMap,
  };
}

function createMockGameHole(
  holeNum: string,
  teams: Array<{
    teamId: string;
    options?: Array<{
      optionName: string;
      value: string;
      firstHole?: string;
      playerId?: string;
    }>;
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
                    for (const opt of team.options ?? []) {
                      yield {
                        $isLoaded: true,
                        optionName: opt.optionName,
                        value: opt.value,
                        firstHole: opt.firstHole,
                        playerId: opt.playerId,
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

function createScoreboard(
  holes: Record<string, HoleResult>,
  teamTotals?: Record<string, number>,
): Scoreboard {
  const teams: Record<string, { pointsTotal: number }> = {};
  if (teamTotals) {
    for (const [teamId, total] of Object.entries(teamTotals)) {
      teams[teamId] = {
        pointsTotal: total,
      } as Scoreboard["cumulative"]["teams"][string];
    }
  }
  return {
    holes,
    cumulative: {
      players: {},
      teams: teams as Scoreboard["cumulative"]["teams"],
    },
    meta: {
      gameId: "test",
      holesPlayed: Object.keys(holes),
      hasTeams: true,
      pointsPerHole: 5,
    },
  };
}

// Standard multiplier definitions
const DOUBLE: MultiplierOption = {
  $isLoaded: true,
  name: "double",
  disp: "2x",
  type: "multiplier",
  sub_type: "press",
  based_on: "user",
  scope: "hole",
  value: 2,
  availability:
    "{'team_down_the_most': [{'getPrevHole': []}, {'var': 'team'}]}",
} as MultiplierOption;

const DOUBLE_BACK: MultiplierOption = {
  $isLoaded: true,
  name: "double_back",
  disp: "2x back",
  type: "multiplier",
  sub_type: "press",
  based_on: "user",
  scope: "hole",
  value: 2,
  availability:
    "{'and': [{'team_second_to_last': [{'getPrevHole': []}, {'var': 'team'}]}, {'other_team_multiplied_with': [{'getCurrHole': []}, {'var': 'team'}, 'double']}]}",
} as MultiplierOption;

const PRE_DOUBLE: MultiplierOption = {
  $isLoaded: true,
  name: "pre_double",
  disp: "Pre 2x",
  type: "multiplier",
  sub_type: "press",
  based_on: "user",
  scope: "rest_of_nine",
  value: 2,
  availability:
    "{'team_down_the_most': [{'getPrevHole': []}, {'var': 'team'}]}",
} as MultiplierOption;

function createContext(
  gameHoles: ReturnType<typeof createMockGameHole>[],
  options: Record<string, MultiplierOption>,
  scoreboard?: Scoreboard,
): ScoringContext {
  return {
    game: { $isLoaded: true, $jazz: { id: "test-game" } },
    gameHoles,
    rounds: [],
    playerHandicaps: new Map(),
    holeInfoMap: new Map(),
    teamsPerHole: new Map(),
    playerTeamMap: new Map(),
    options,
    scoreboard: scoreboard ?? {
      holes: {},
      cumulative: { players: {}, teams: {} },
      meta: {
        gameId: "test",
        holesPlayed: [],
        hasTeams: true,
        pointsPerHole: 5,
      },
    },
  } as ScoringContext;
}

// =============================================================================
// Tests
// =============================================================================

describe("detectInvalidations", () => {
  describe("multiplier invalidation", () => {
    it("should detect invalidated double when team is no longer down the most", () => {
      // Scenario: Teams 1 and 2, holes 1-4
      // After editing hole 1, the scoreboard now shows Team 1 ahead on hole 3
      // but Team 2 had pressed double on hole 4 (when they were behind)
      // Now Team 1 is behind on hole 3 -> Team 2's double on 4 is invalid

      const hole3 = createHoleResult("3", {
        "1": { runningTotal: 8 },
        "2": { runningTotal: 12 },
      });
      const hole4 = createHoleResult("4", {
        "1": {
          runningTotal: 10,
          points: 4,
          multipliers: [{ name: "double", value: 2, earned: false }],
        },
        "2": { runningTotal: 14, points: 6, multipliers: [] },
      });

      const scoreboard = createScoreboard(
        {
          "1": createHoleResult("1", {}),
          "2": createHoleResult("2", {}),
          "3": hole3,
          "4": hole4,
        },
        { "1": 10, "2": 14 },
      );

      // Team 2 has double on hole 4, but Team 2 has runningTotal 12 on hole 3
      // (the prev hole) -- Team 2 is AHEAD, not down. So the double is invalid.
      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("3", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("4", [
          { teamId: "1" },
          {
            teamId: "2",
            options: [{ optionName: "double", value: "true", firstHole: "4" }],
          },
        ]),
      ];

      const ctx = createContext(gameHoles, { double: DOUBLE }, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1", // edited hole 1
        ["1", "2", "3", "4"],
        false,
      );

      expect(result.hasInvalidations).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].kind).toBe("multiplier");
      if (result.items[0].kind === "multiplier") {
        expect(result.items[0].teamId).toBe("2");
        expect(result.items[0].name).toBe("double");
        expect(result.items[0].holeNum).toBe("4");
      }
    });

    it("should NOT detect invalidation when team is still down the most", () => {
      // Team 1 is still down on hole 3 -> Team 1's double on hole 4 is still valid
      const hole3 = createHoleResult("3", {
        "1": { runningTotal: 6 },
        "2": { runningTotal: 12 },
      });
      const hole4 = createHoleResult("4", {
        "1": {
          runningTotal: 10,
          multipliers: [{ name: "double", value: 2, earned: false }],
        },
        "2": { runningTotal: 14, multipliers: [] },
      });

      const scoreboard = createScoreboard(
        {
          "1": createHoleResult("1", {}),
          "2": createHoleResult("2", {}),
          "3": hole3,
          "4": hole4,
        },
        { "1": 10, "2": 14 },
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("3", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("4", [
          {
            teamId: "1",
            options: [{ optionName: "double", value: "true", firstHole: "4" }],
          },
          { teamId: "2" },
        ]),
      ];

      const ctx = createContext(gameHoles, { double: DOUBLE }, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2", "3", "4"],
        false,
      );

      expect(result.hasInvalidations).toBe(false);
      expect(result.items).toHaveLength(0);
    });

    it("should NOT detect invalidation for holes before the edited hole", () => {
      // Team 2 has double on hole 2, but we edited hole 3
      // Holes before the edit should not be checked
      const hole2 = createHoleResult("2", {
        "1": { runningTotal: 15 },
        "2": {
          runningTotal: 10,
          multipliers: [{ name: "double", value: 2, earned: false }],
        },
      });

      // Team 2 has higher runningTotal on hole 1 (ahead, not down)
      // so their double on hole 2 would be invalid -- but hole 2 is before the edit
      const hole1v2 = createHoleResult("1", {
        "1": { runningTotal: 4 },
        "2": { runningTotal: 8 },
      });
      const scoreboard2 = createScoreboard(
        { "1": hole1v2, "2": hole2, "3": createHoleResult("3", {}) },
        { "1": 15, "2": 10 },
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [
          { teamId: "1" },
          {
            teamId: "2",
            options: [{ optionName: "double", value: "true", firstHole: "2" }],
          },
        ]),
        createMockGameHole("3", [{ teamId: "1" }, { teamId: "2" }]),
      ];

      const ctx = createContext(gameHoles, { double: DOUBLE }, scoreboard2);

      const result = detectInvalidations(
        scoreboard2,
        ctx,
        "3", // edited hole 3 -- only check holes AFTER 3
        ["1", "2", "3"],
        false,
      );

      // Hole 2 is before the edited hole 3, so should NOT be checked
      expect(result.hasInvalidations).toBe(false);
      expect(result.items).toHaveLength(0);
    });

    it("should detect cascade: double invalidated -> double_back also listed", () => {
      // Team 2 has double on hole 4, Team 1 has double_back on hole 4
      // After edit, Team 2 is no longer down -> double invalid -> double_back cascades
      const hole3 = createHoleResult("3", {
        "1": { runningTotal: 8 },
        "2": { runningTotal: 12 },
      });
      const hole4 = createHoleResult("4", {
        "1": {
          runningTotal: 10,
          points: 4,
          multipliers: [{ name: "double_back", value: 2, earned: false }],
        },
        "2": {
          runningTotal: 14,
          points: 6,
          multipliers: [{ name: "double", value: 2, earned: false }],
        },
      });

      const scoreboard = createScoreboard(
        {
          "1": createHoleResult("1", {}),
          "2": createHoleResult("2", {}),
          "3": hole3,
          "4": hole4,
        },
        { "1": 10, "2": 14 },
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("3", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("4", [
          {
            teamId: "1",
            options: [
              { optionName: "double_back", value: "true", firstHole: "4" },
            ],
          },
          {
            teamId: "2",
            options: [{ optionName: "double", value: "true", firstHole: "4" }],
          },
        ]),
      ];

      const ctx = createContext(
        gameHoles,
        { double: DOUBLE, double_back: DOUBLE_BACK },
        scoreboard,
      );

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2", "3", "4"],
        false,
      );

      expect(result.hasInvalidations).toBe(true);
      // Should have double (team 2) + double_back (team 1 cascade)
      expect(result.items.length).toBeGreaterThanOrEqual(2);

      const doubleItem = result.items.find(
        (i) => i.kind === "multiplier" && i.name === "double",
      );
      expect(doubleItem).toBeDefined();
      if (doubleItem?.kind === "multiplier") {
        expect(doubleItem.teamId).toBe("2");
      }

      const doubleBackItem = result.items.find(
        (i) => i.kind === "multiplier" && i.name === "double_back",
      );
      expect(doubleBackItem).toBeDefined();
      if (doubleBackItem?.kind === "multiplier") {
        expect(doubleBackItem.teamId).toBe("1");
        expect(doubleBackItem.reason).toContain("Depends on");
      }
    });

    it("should detect pre_double invalidation (rest_of_nine scope)", () => {
      // Team 2 activated pre_double on hole 2 (rest_of_nine scope)
      // After editing hole 1, Team 2 is no longer down on hole 1
      const hole1 = createHoleResult("1", {
        "1": { runningTotal: 3 },
        "2": { runningTotal: 7 },
      });
      const hole2 = createHoleResult("2", {
        "1": { runningTotal: 5 },
        "2": {
          runningTotal: 10,
          multipliers: [{ name: "pre_double", value: 2, earned: false }],
        },
      });

      const scoreboard = createScoreboard(
        { "1": hole1, "2": hole2 },
        { "1": 5, "2": 10 },
      );

      // Team 2 pre_double on hole 2 with firstHole=2
      // On hole 2, prev hole is hole 1: Team 2 has runningTotal 7, Team 1 has 3
      // Team 2 is AHEAD, not down -> invalid
      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [
          { teamId: "1" },
          {
            teamId: "2",
            options: [
              { optionName: "pre_double", value: "true", firstHole: "2" },
            ],
          },
        ]),
      ];

      const ctx = createContext(
        gameHoles,
        { pre_double: PRE_DOUBLE },
        scoreboard,
      );

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2"],
        false,
      );

      expect(result.hasInvalidations).toBe(true);
      expect(result.items).toHaveLength(1);
      if (result.items[0].kind === "multiplier") {
        expect(result.items[0].name).toBe("pre_double");
        expect(result.items[0].teamId).toBe("2");
        expect(result.items[0].holeNum).toBe("2");
      }
    });

    it("should NOT flag custom multiplier (no availability condition)", () => {
      const customMult: MultiplierOption = {
        $isLoaded: true,
        name: "custom",
        disp: "Custom",
        type: "multiplier",
        based_on: "user",
        scope: "hole",
        value: 2,
        input_value: true,
        override: true,
      } as MultiplierOption;

      const hole2 = createHoleResult("2", {
        "1": {
          runningTotal: 5,
          multipliers: [{ name: "custom", value: 5, earned: false }],
        },
        "2": { runningTotal: 10 },
      });

      const scoreboard = createScoreboard(
        { "1": createHoleResult("1", {}), "2": hole2 },
        { "1": 5, "2": 10 },
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [
          {
            teamId: "1",
            options: [{ optionName: "custom", value: "5", firstHole: "2" }],
          },
          { teamId: "2" },
        ]),
      ];

      const ctx = createContext(gameHoles, { custom: customMult }, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2"],
        false,
      );

      // Custom has no availability -> should never be flagged
      expect(result.hasInvalidations).toBe(false);
    });

    it("should NOT flag automatic birdie_bbq multiplier", () => {
      const bbqMult: MultiplierOption = {
        $isLoaded: true,
        name: "birdie_bbq",
        disp: "BBQ",
        type: "multiplier",
        based_on: "junk",
        scope: "hole",
        value: 2,
      } as MultiplierOption;

      const hole2 = createHoleResult("2", {
        "1": {
          runningTotal: 5,
          multipliers: [{ name: "birdie_bbq", value: 2, earned: true }],
        },
      });

      const scoreboard = createScoreboard(
        { "1": createHoleResult("1", {}), "2": hole2 },
        { "1": 5 },
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }]),
        createMockGameHole("2", [{ teamId: "1" }]),
      ];

      const ctx = createContext(gameHoles, { birdie_bbq: bbqMult }, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2"],
        false,
      );

      // based_on: "junk" -> not user-selected, should not be checked
      expect(result.hasInvalidations).toBe(false);
    });
  });

  describe("tee flip invalidation", () => {
    it("should detect stale tee flip when teams are no longer tied", () => {
      // Hole 2 has a tee flip result, but after editing hole 1,
      // teams are no longer tied on hole 1 (prev hole for hole 2)
      const hole1 = createHoleResult("1", {
        "1": { runningDiff: 2 },
        "2": { runningDiff: -2 },
      });
      const hole2 = createHoleResult("2", {
        "1": { runningTotal: 8 },
        "2": { runningTotal: 6 },
      });

      const scoreboard = createScoreboard(
        { "1": hole1, "2": hole2 },
        { "1": 8, "2": 6 },
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [
          {
            teamId: "1",
            options: [
              {
                optionName: "tee_flip_winner",
                value: "true",
                firstHole: "2",
              },
            ],
          },
          { teamId: "2" },
        ]),
      ];

      const ctx = createContext(gameHoles, {}, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2"],
        true, // tee flip enabled
      );

      expect(result.hasInvalidations).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].kind).toBe("tee_flip");
      expect(result.items[0].holeNum).toBe("2");
    });

    it("should NOT detect tee flip when teams are still tied", () => {
      const hole1 = createHoleResult("1", {
        "1": { runningDiff: 0 },
        "2": { runningDiff: 0 },
      });
      const hole2 = createHoleResult("2", {
        "1": { runningTotal: 8 },
        "2": { runningTotal: 8 },
      });

      const scoreboard = createScoreboard(
        { "1": hole1, "2": hole2 },
        { "1": 8, "2": 8 },
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [
          {
            teamId: "1",
            options: [
              {
                optionName: "tee_flip_winner",
                value: "true",
                firstHole: "2",
              },
            ],
          },
          { teamId: "2" },
        ]),
      ];

      const ctx = createContext(gameHoles, {}, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2"],
        true,
      );

      expect(result.hasInvalidations).toBe(false);
    });

    it("should NOT check tee flips when teeFlipEnabled is false", () => {
      const hole1 = createHoleResult("1", {
        "1": { runningDiff: 2 },
        "2": { runningDiff: -2 },
      });

      const scoreboard = createScoreboard(
        { "1": hole1, "2": createHoleResult("2", {}) },
        {},
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [
          {
            teamId: "1",
            options: [
              {
                optionName: "tee_flip_winner",
                value: "true",
                firstHole: "2",
              },
            ],
          },
          { teamId: "2" },
        ]),
      ];

      const ctx = createContext(gameHoles, {}, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2"],
        false, // tee flip disabled
      );

      expect(result.hasInvalidations).toBe(false);
    });

    it("should detect stale tee_flip_declined as well", () => {
      const hole1 = createHoleResult("1", {
        "1": { runningDiff: 3 },
        "2": { runningDiff: -3 },
      });

      const scoreboard = createScoreboard(
        { "1": hole1, "2": createHoleResult("2", {}) },
        {},
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [
          {
            teamId: "1",
            options: [
              {
                optionName: "tee_flip_declined",
                value: "true",
                firstHole: "2",
              },
            ],
          },
          { teamId: "2" },
        ]),
      ];

      const ctx = createContext(gameHoles, {}, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2"],
        true,
      );

      expect(result.hasInvalidations).toBe(true);
      expect(result.items[0].kind).toBe("tee_flip");
    });
  });

  describe("score impact", () => {
    it("should calculate projected totals after removing invalidated multiplier", () => {
      const hole3 = createHoleResult("3", {
        "1": { runningTotal: 8 },
        "2": { runningTotal: 12 },
      });
      const hole4 = createHoleResult("4", {
        "1": { runningTotal: 10, points: 4, multipliers: [] },
        "2": {
          runningTotal: 14,
          points: 6,
          multipliers: [{ name: "double", value: 2, earned: false }],
        },
      });

      const scoreboard = createScoreboard(
        {
          "1": createHoleResult("1", {}),
          "2": createHoleResult("2", {}),
          "3": hole3,
          "4": hole4,
        },
        { "1": 10, "2": 20 },
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("3", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("4", [
          { teamId: "1" },
          {
            teamId: "2",
            options: [{ optionName: "double", value: "true", firstHole: "4" }],
          },
        ]),
      ];

      const ctx = createContext(gameHoles, { double: DOUBLE }, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2", "3", "4"],
        false,
      );

      expect(result.hasInvalidations).toBe(true);

      // Team 2 had double on hole 4 with 6 points
      // Without double: 6 / 2 = 3 points, delta = 3
      // Current total: 20, projected: 20 - 3 = 17
      const team2Impact = result.scoreImpact.find((si) => si.teamId === "2");
      expect(team2Impact?.currentTotal).toBe(20);
      expect(team2Impact?.projectedTotal).toBe(17);

      // Team 1 should have no change
      const team1Impact = result.scoreImpact.find((si) => si.teamId === "1");
      expect(team1Impact?.currentTotal).toBe(10);
      expect(team1Impact?.projectedTotal).toBe(10);
    });

    it("should return equal totals when no invalidations exist", () => {
      // Team 1 is down the most (runningTotal 3 < 5) -> double is still valid
      const hole1 = createHoleResult("1", {
        "1": { runningTotal: 3 },
        "2": { runningTotal: 5 },
      });
      const hole2 = createHoleResult("2", {
        "1": {
          runningTotal: 10,
          multipliers: [{ name: "double", value: 2, earned: false }],
        },
        "2": { runningTotal: 6 },
      });

      const scoreboard = createScoreboard(
        { "1": hole1, "2": hole2 },
        { "1": 10, "2": 6 },
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [
          {
            teamId: "1",
            options: [{ optionName: "double", value: "true", firstHole: "2" }],
          },
          { teamId: "2" },
        ]),
      ];

      const ctx = createContext(gameHoles, { double: DOUBLE }, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2"],
        false,
      );

      expect(result.hasInvalidations).toBe(false);
      for (const si of result.scoreImpact) {
        expect(si.currentTotal).toBe(si.projectedTotal);
      }
    });
  });

  describe("edge cases", () => {
    it("should return empty result for invalid editedHoleNum", () => {
      const scoreboard = createScoreboard({}, {});
      const ctx = createContext([], {}, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "99",
        ["1", "2", "3"],
        false,
      );

      expect(result.hasInvalidations).toBe(false);
      expect(result.items).toHaveLength(0);
    });

    it("should skip player-scoped options (junk)", () => {
      // A player junk option should never be flagged as a multiplier invalidation
      const hole2 = createHoleResult("2", {
        "1": { runningTotal: 12 },
        "2": { runningTotal: 6 },
      });

      const scoreboard = createScoreboard(
        { "1": createHoleResult("1", {}), "2": hole2 },
        {},
      );

      const gameHoles = [
        createMockGameHole("1", [{ teamId: "1" }, { teamId: "2" }]),
        createMockGameHole("2", [
          {
            teamId: "1",
            options: [
              {
                optionName: "double",
                value: "true",
                firstHole: "2",
                playerId: "player-1", // player-scoped = junk, not multiplier
              },
            ],
          },
          { teamId: "2" },
        ]),
      ];

      const ctx = createContext(gameHoles, { double: DOUBLE }, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "1",
        ["1", "2"],
        false,
      );

      expect(result.hasInvalidations).toBe(false);
    });

    it("should handle editing the last hole (no holes after)", () => {
      const scoreboard = createScoreboard(
        { "1": createHoleResult("1", {}), "2": createHoleResult("2", {}) },
        {},
      );
      const ctx = createContext([], {}, scoreboard);

      const result = detectInvalidations(
        scoreboard,
        ctx,
        "2", // last hole
        ["1", "2"],
        false,
      );

      expect(result.hasInvalidations).toBe(false);
      expect(result.items).toHaveLength(0);
    });
  });
});
