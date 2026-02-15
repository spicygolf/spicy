import { describe, expect, it } from "bun:test";
import type { GameHole, Team } from "spicylib/schema";
import type { Scoreboard, TeamHoleResult } from "spicylib/scoring";
import {
  getTeeFlipDeclined,
  getTeeFlipWinner,
  isEarliestUnflippedHole,
  isTeeFlipRequired,
} from "../scoringUtils";

// =============================================================================
// Mock Helpers
// These mocks use Symbol.iterator to mimic Jazz CoList iteration behavior.
// If the CoList API changes, these mocks will need to be updated accordingly.
// =============================================================================

function makeScoreboard(
  holes: Record<string, { teams: Record<string, Partial<TeamHoleResult>> }>,
): Scoreboard {
  const sb: Record<string, unknown> = {};
  for (const [holeNum, data] of Object.entries(holes)) {
    sb[holeNum] = { teams: data.teams };
  }
  return { holes: sb } as unknown as Scoreboard;
}

function makeTeam(
  teamId: string,
  options: Array<{ optionName: string; value: string; firstHole?: string }>,
): Team {
  return {
    $isLoaded: true,
    team: teamId,
    options: {
      $isLoaded: true,
      length: options.length,
      [Symbol.iterator]: function* () {
        for (const opt of options) {
          yield { $isLoaded: true, ...opt };
        }
      },
    },
  } as unknown as Team;
}

function makeTeamNoOptions(teamId: string): Team {
  return {
    $isLoaded: true,
    team: teamId,
    options: { $isLoaded: true, length: 0, [Symbol.iterator]: function* () {} },
  } as unknown as Team;
}

// =============================================================================
// isTeeFlipRequired
// =============================================================================

describe("isTeeFlipRequired", () => {
  it("returns false when scoreboard is null (progressive loading)", () => {
    const result = isTeeFlipRequired(null, 0, ["1"], 2, true);
    expect(result).toBe(false);
  });

  it("returns true when no previous hole exists (first hole of round)", () => {
    const scoreboard = makeScoreboard({
      "1": { teams: {} },
    });
    const result = isTeeFlipRequired(scoreboard, 0, ["1"], 2, true);
    expect(result).toBe(true);
  });

  it("returns true when previous hole has tied runningDiff", () => {
    const scoreboard = makeScoreboard({
      "3": {
        teams: {
          "1": { runningDiff: 0 },
          "2": { runningDiff: 0 },
        },
      },
    });
    // currentHoleIndex=1 means holesList[0] is the previous hole
    const result = isTeeFlipRequired(scoreboard, 1, ["3", "4"], 2, true);
    expect(result).toBe(true);
  });

  it("returns false when previous hole has non-tied runningDiff", () => {
    const scoreboard = makeScoreboard({
      "1": {
        teams: {
          "1": { runningDiff: 3 },
          "2": { runningDiff: -3 },
        },
      },
    });
    const result = isTeeFlipRequired(scoreboard, 1, ["1", "2"], 2, true);
    expect(result).toBe(false);
  });

  it("returns false when there are 3+ teams", () => {
    const scoreboard = makeScoreboard({});
    const result = isTeeFlipRequired(scoreboard, 0, ["1"], 3, true);
    expect(result).toBe(false);
  });

  it("returns false when there is only 1 team", () => {
    const scoreboard = makeScoreboard({});
    const result = isTeeFlipRequired(scoreboard, 0, ["1"], 1, true);
    expect(result).toBe(false);
  });

  it("returns false when there are no multiplier options", () => {
    const scoreboard = makeScoreboard({});
    const result = isTeeFlipRequired(scoreboard, 0, ["1"], 2, false);
    expect(result).toBe(false);
  });

  it("returns true when previous hole result is missing from scoreboard", () => {
    const scoreboard = makeScoreboard({});
    const result = isTeeFlipRequired(scoreboard, 1, ["1", "2"], 2, true);
    expect(result).toBe(true);
  });

  it("handles shotgun start: previous hole by list position, not number", () => {
    // Shotgun start on hole 7, so holesList = ["7", "8", ...]
    // Previous hole for index 1 is holesList[0] = "7"
    const scoreboard = makeScoreboard({
      "7": {
        teams: {
          "1": { runningDiff: 2 },
          "2": { runningDiff: -2 },
        },
      },
    });
    const result = isTeeFlipRequired(scoreboard, 1, ["7", "8", "9"], 2, true);
    expect(result).toBe(false);
  });

  it("returns true on first hole of shotgun start (no previous)", () => {
    const scoreboard = makeScoreboard({
      "7": { teams: {} },
    });
    const result = isTeeFlipRequired(scoreboard, 0, ["7", "8", "9"], 2, true);
    expect(result).toBe(true);
  });
});

// =============================================================================
// getTeeFlipWinner
// =============================================================================

describe("getTeeFlipWinner", () => {
  it("returns null when no winner is stored", () => {
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    expect(getTeeFlipWinner(teams, "1")).toBeNull();
  });

  it("returns the winning team ID when stored on current hole", () => {
    const teams = [
      makeTeam("1", [
        { optionName: "tee_flip_winner", value: "true", firstHole: "1" },
      ]),
      makeTeamNoOptions("2"),
    ];
    expect(getTeeFlipWinner(teams, "1")).toBe("1");
  });

  it("returns null when winner is stored on a different hole", () => {
    const teams = [
      makeTeam("1", [
        { optionName: "tee_flip_winner", value: "true", firstHole: "3" },
      ]),
      makeTeamNoOptions("2"),
    ];
    expect(getTeeFlipWinner(teams, "1")).toBeNull();
  });

  it("returns the correct team when team 2 won", () => {
    const teams = [
      makeTeamNoOptions("1"),
      makeTeam("2", [
        { optionName: "tee_flip_winner", value: "true", firstHole: "5" },
      ]),
    ];
    expect(getTeeFlipWinner(teams, "5")).toBe("2");
  });

  it("ignores non-tee-flip options", () => {
    const teams = [
      makeTeam("1", [
        { optionName: "double", value: "true", firstHole: "1" },
        { optionName: "prox", value: "true" },
      ]),
      makeTeamNoOptions("2"),
    ];
    expect(getTeeFlipWinner(teams, "1")).toBeNull();
  });
});

// =============================================================================
// getTeeFlipDeclined
// =============================================================================

describe("getTeeFlipDeclined", () => {
  it("returns false when no declined option exists", () => {
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    expect(getTeeFlipDeclined(teams, "1")).toBe(false);
  });

  it("returns true when declined on current hole", () => {
    const teams = [
      makeTeam("1", [
        { optionName: "tee_flip_declined", value: "true", firstHole: "1" },
      ]),
      makeTeamNoOptions("2"),
    ];
    expect(getTeeFlipDeclined(teams, "1")).toBe(true);
  });

  it("returns false when declined on a different hole", () => {
    const teams = [
      makeTeam("1", [
        { optionName: "tee_flip_declined", value: "true", firstHole: "3" },
      ]),
      makeTeamNoOptions("2"),
    ];
    expect(getTeeFlipDeclined(teams, "1")).toBe(false);
  });

  it("ignores non-declined options", () => {
    const teams = [
      makeTeam("1", [
        { optionName: "tee_flip_winner", value: "true", firstHole: "1" },
      ]),
      makeTeamNoOptions("2"),
    ];
    expect(getTeeFlipDeclined(teams, "1")).toBe(false);
  });
});

// =============================================================================
// isEarliestUnflippedHole
// =============================================================================

/**
 * Create a mock GameHole with teams that have the given options.
 * Mimics the Jazz CoList iteration pattern used in real GameHole.teams.
 */
function makeGameHole(holeNum: string, teams: Team[]): GameHole {
  return {
    $isLoaded: true,
    hole: holeNum,
    teams: {
      $isLoaded: true,
      length: teams.length,
      [Symbol.iterator]: function* () {
        for (const t of teams) yield t;
      },
    },
  } as unknown as GameHole;
}

describe("isEarliestUnflippedHole", () => {
  it("returns false when scoreboard is null", () => {
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const result = isEarliestUnflippedHole(
      null,
      ["1", "2"],
      0,
      teams,
      2,
      true,
      [],
    );
    expect(result).toBe(false);
  });

  it("returns true when current hole is the first tied hole with no result", () => {
    // Hole 1 is first hole → tied → no winner/declined
    const scoreboard = makeScoreboard({ "1": { teams: {} } });
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const gameHoles = [makeGameHole("1", teams)];

    const result = isEarliestUnflippedHole(
      scoreboard,
      ["1", "2"],
      0,
      teams,
      2,
      true,
      gameHoles,
    );
    expect(result).toBe(true);
  });

  it("returns false when current hole is NOT the earliest unresolved", () => {
    // Holes 1 and 2 are both tied. Hole 1 has no winner → it's earliest.
    // So hole 2 (index 1) should return false.
    const scoreboard = makeScoreboard({
      "1": { teams: { "1": { runningDiff: 0 }, "2": { runningDiff: 0 } } },
      "2": { teams: {} },
    });
    const teamsHole1 = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const teamsHole2 = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const gameHoles = [
      makeGameHole("1", teamsHole1),
      makeGameHole("2", teamsHole2),
    ];

    // Checking hole 2 (index 1) — hole 1 (index 0) is earlier and unresolved
    const result = isEarliestUnflippedHole(
      scoreboard,
      ["1", "2", "3"],
      1,
      teamsHole2,
      2,
      true,
      gameHoles,
    );
    expect(result).toBe(false);
  });

  it("returns true when earlier holes have been resolved (winner)", () => {
    // Hole 1 tied but has winner, hole 2 tied with no result
    const scoreboard = makeScoreboard({
      "1": { teams: { "1": { runningDiff: 0 }, "2": { runningDiff: 0 } } },
      "2": { teams: {} },
    });
    const teamsHole1 = [
      makeTeam("1", [
        { optionName: "tee_flip_winner", value: "true", firstHole: "1" },
      ]),
      makeTeamNoOptions("2"),
    ];
    const teamsHole2 = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const gameHoles = [
      makeGameHole("1", teamsHole1),
      makeGameHole("2", teamsHole2),
    ];

    const result = isEarliestUnflippedHole(
      scoreboard,
      ["1", "2", "3"],
      1,
      teamsHole2,
      2,
      true,
      gameHoles,
    );
    expect(result).toBe(true);
  });

  it("returns true when earlier holes have been resolved (declined)", () => {
    // Hole 1 tied but declined, hole 2 tied with no result
    const scoreboard = makeScoreboard({
      "1": { teams: { "1": { runningDiff: 0 }, "2": { runningDiff: 0 } } },
      "2": { teams: {} },
    });
    const teamsHole1 = [
      makeTeam("1", [
        { optionName: "tee_flip_declined", value: "true", firstHole: "1" },
      ]),
      makeTeamNoOptions("2"),
    ];
    const teamsHole2 = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const gameHoles = [
      makeGameHole("1", teamsHole1),
      makeGameHole("2", teamsHole2),
    ];

    const result = isEarliestUnflippedHole(
      scoreboard,
      ["1", "2", "3"],
      1,
      teamsHole2,
      2,
      true,
      gameHoles,
    );
    expect(result).toBe(true);
  });

  it("returns false when an earlier hole is not tied (gameHoles irrelevant)", () => {
    // Hole 1 has non-tied scores, so isTeeFlipRequired is false for hole 2.
    // gameHoles is empty but never consulted since no hole reaches the lookup.
    const scoreboard = makeScoreboard({
      "1": { teams: { "1": { runningDiff: 3 }, "2": { runningDiff: -3 } } },
    });
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];

    const result = isEarliestUnflippedHole(
      scoreboard,
      ["1", "2"],
      1,
      teams,
      2,
      true,
      [],
    );
    expect(result).toBe(false);
  });

  it("skips earlier holes with unloaded teams during progressive loading", () => {
    // Hole 1 is tied (first hole) but teams are not loaded yet (progressive loading).
    // Hole 2 is tied (previous tied) and is the current hole with loaded teams.
    // The unloadable earlier hole should be skipped, allowing hole 2 to show the modal.
    const scoreboard = makeScoreboard({
      "1": { teams: { "1": { runningDiff: 0 }, "2": { runningDiff: 0 } } },
      "2": { teams: {} },
    });
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];

    // gameHole for hole 1 has teams NOT loaded (simulating progressive loading)
    const gameHoleNotLoaded = {
      $isLoaded: true,
      hole: "1",
      teams: { $isLoaded: false },
    } as unknown as GameHole;
    const gameHoles = [gameHoleNotLoaded, makeGameHole("2", teams)];

    const result = isEarliestUnflippedHole(
      scoreboard,
      ["1", "2", "3"],
      1,
      teams,
      2,
      true,
      gameHoles,
    );
    expect(result).toBe(true);
  });

  it("skips earlier holes missing from gameHoles during progressive loading", () => {
    // Hole 1 is tied (first hole) but not found in gameHoles at all.
    // Hole 2 is the current hole and should still get the modal.
    const scoreboard = makeScoreboard({
      "1": { teams: { "1": { runningDiff: 0 }, "2": { runningDiff: 0 } } },
      "2": { teams: {} },
    });
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];

    const result = isEarliestUnflippedHole(
      scoreboard,
      ["1", "2", "3"],
      1,
      teams,
      2,
      true,
      [], // empty gameHoles — hole 1 can't be looked up
    );
    expect(result).toBe(true);
  });

  it("skips non-tied holes when scanning for earliest", () => {
    // Hole 1: first hole → tied (no previous), but resolved (winner).
    // Hole 2: previous (hole 1) has runningDiff 2/-2 → NOT tied → skip.
    // Hole 3: previous (hole 2) has runningDiff 0/0 → tied → no result → earliest.
    // Current is hole 3 (index 2), should be the earliest unflipped.
    const scoreboard = makeScoreboard({
      "1": { teams: { "1": { runningDiff: 2 }, "2": { runningDiff: -2 } } },
      "2": { teams: { "1": { runningDiff: 0 }, "2": { runningDiff: 0 } } },
    });
    const teamsHole1 = [
      makeTeam("1", [
        { optionName: "tee_flip_winner", value: "true", firstHole: "1" },
      ]),
      makeTeamNoOptions("2"),
    ];
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const gameHoles = [
      makeGameHole("1", teamsHole1),
      makeGameHole("2", teams),
      makeGameHole("3", teams),
    ];

    const result = isEarliestUnflippedHole(
      scoreboard,
      ["1", "2", "3"],
      2,
      teams,
      2,
      true,
      gameHoles,
    );
    expect(result).toBe(true);
  });
});
