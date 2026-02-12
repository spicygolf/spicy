import { describe, expect, it } from "bun:test";
import type { Team } from "spicylib/schema";
import type { Scoreboard, TeamHoleResult } from "spicylib/scoring";
import { getTeeFlipWinner, isTeeFlipRequired } from "../scoringUtils";

// =============================================================================
// Mock Helpers
// These mocks use Symbol.iterator to mimic Jazz CoList iteration behavior.
// If the CoList API changes, these mocks will need to be updated accordingly.
// =============================================================================

function makeScoreboard(
  holes: Record<
    string,
    {
      teams: Record<string, Partial<TeamHoleResult>>;
      scoresEntered?: number;
    }
  >,
): Scoreboard {
  const sb: Record<string, unknown> = {};
  for (const [holeNum, data] of Object.entries(holes)) {
    sb[holeNum] = {
      teams: data.teams,
      scoresEntered: data.scoresEntered ?? 0,
    };
  }
  return { holes: sb } as unknown as Scoreboard;
}

function makeTeam(
  teamId: string,
  options: Array<{
    optionName: string;
    value: string;
    firstHole?: string;
    playerId?: string;
  }>,
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

/** Empty teams for tests that don't care about current hole teams */
const noTeams: Team[] = [];

// =============================================================================
// isTeeFlipRequired
// =============================================================================

describe("isTeeFlipRequired", () => {
  it("returns false when scoreboard is null (progressive loading)", () => {
    const result = isTeeFlipRequired(null, 0, ["1"], 2, true, noTeams, "1");
    expect(result).toBe(false);
  });

  it("returns true when no previous hole exists (first hole of round)", () => {
    const scoreboard = makeScoreboard({
      "1": { teams: {}, scoresEntered: 0 },
    });
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const result = isTeeFlipRequired(scoreboard, 0, ["1"], 2, true, teams, "1");
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
      "4": { teams: {}, scoresEntered: 0 },
    });
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    // currentHoleIndex=1 means holesList[0] is the previous hole
    const result = isTeeFlipRequired(
      scoreboard,
      1,
      ["3", "4"],
      2,
      true,
      teams,
      "4",
    );
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
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const result = isTeeFlipRequired(
      scoreboard,
      1,
      ["1", "2"],
      2,
      true,
      teams,
      "2",
    );
    expect(result).toBe(false);
  });

  it("returns false when there are 3+ teams", () => {
    const scoreboard = makeScoreboard({});
    const result = isTeeFlipRequired(
      scoreboard,
      0,
      ["1"],
      3,
      true,
      noTeams,
      "1",
    );
    expect(result).toBe(false);
  });

  it("returns false when there is only 1 team", () => {
    const scoreboard = makeScoreboard({});
    const result = isTeeFlipRequired(
      scoreboard,
      0,
      ["1"],
      1,
      true,
      noTeams,
      "1",
    );
    expect(result).toBe(false);
  });

  it("returns false when there are no multiplier options", () => {
    const scoreboard = makeScoreboard({});
    const result = isTeeFlipRequired(
      scoreboard,
      0,
      ["1"],
      2,
      false,
      noTeams,
      "1",
    );
    expect(result).toBe(false);
  });

  it("returns true when previous hole result is missing from scoreboard", () => {
    const scoreboard = makeScoreboard({
      "2": { teams: {}, scoresEntered: 0 },
    });
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const result = isTeeFlipRequired(
      scoreboard,
      1,
      ["1", "2"],
      2,
      true,
      teams,
      "2",
    );
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
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const result = isTeeFlipRequired(
      scoreboard,
      1,
      ["7", "8", "9"],
      2,
      true,
      teams,
      "8",
    );
    expect(result).toBe(false);
  });

  it("returns true on first hole of shotgun start (no previous)", () => {
    const scoreboard = makeScoreboard({
      "7": { teams: {}, scoresEntered: 0 },
    });
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const result = isTeeFlipRequired(
      scoreboard,
      0,
      ["7", "8", "9"],
      2,
      true,
      teams,
      "7",
    );
    expect(result).toBe(true);
  });

  it("returns false when a team already has a multiplier on the current hole", () => {
    const scoreboard = makeScoreboard({
      "1": { teams: {}, scoresEntered: 0 },
    });
    // Team 1 has a "double" multiplier on hole 1 (no playerId = team-level)
    const teams = [
      makeTeam("1", [{ optionName: "double", value: "true", firstHole: "1" }]),
      makeTeamNoOptions("2"),
    ];
    const result = isTeeFlipRequired(scoreboard, 0, ["1"], 2, true, teams, "1");
    expect(result).toBe(false);
  });

  it("ignores tee_flip_winner options when checking for existing multipliers", () => {
    const scoreboard = makeScoreboard({
      "1": { teams: {}, scoresEntered: 0 },
    });
    // Only a tee_flip_winner option — should NOT suppress the flip
    const teams = [
      makeTeam("1", [
        { optionName: "tee_flip_winner", value: "true", firstHole: "1" },
      ]),
      makeTeamNoOptions("2"),
    ];
    const result = isTeeFlipRequired(scoreboard, 0, ["1"], 2, true, teams, "1");
    expect(result).toBe(true);
  });

  it("ignores player-level options when checking for existing multipliers", () => {
    const scoreboard = makeScoreboard({
      "1": { teams: {}, scoresEntered: 0 },
    });
    // Player-level junk option (has playerId) — should NOT suppress the flip
    const teams = [
      makeTeam("1", [
        {
          optionName: "prox",
          value: "true",
          firstHole: "1",
          playerId: "player1",
        },
      ]),
      makeTeamNoOptions("2"),
    ];
    const result = isTeeFlipRequired(scoreboard, 0, ["1"], 2, true, teams, "1");
    expect(result).toBe(true);
  });

  it("returns false when current hole already has scores entered", () => {
    const scoreboard = makeScoreboard({
      "1": { teams: {}, scoresEntered: 2 },
    });
    const teams = [makeTeamNoOptions("1"), makeTeamNoOptions("2")];
    const result = isTeeFlipRequired(scoreboard, 0, ["1"], 2, true, teams, "1");
    expect(result).toBe(false);
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
