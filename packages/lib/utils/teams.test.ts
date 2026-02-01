import { describe, expect, test } from "bun:test";
import { calculateTeamCount } from "./teams";

describe("calculateTeamCount", () => {
  describe("priority 1: num_teams takes precedence", () => {
    test("uses num_teams when set, ignoring team_size", () => {
      expect(
        calculateTeamCount({
          numTeams: 2,
          teamSize: 2,
          minPlayers: 4,
          fallback: 4,
        }),
      ).toBe(2);
    });

    test("Five Points: always 2 teams regardless of fallback", () => {
      // 4 players
      expect(calculateTeamCount({ numTeams: 2, fallback: 4 })).toBe(2);
      // 5 players (3v2)
      expect(calculateTeamCount({ numTeams: 2, fallback: 5 })).toBe(2);
      // 6 players (3v3)
      expect(calculateTeamCount({ numTeams: 2, fallback: 6 })).toBe(2);
    });

    test("ignores num_teams when 0 or negative", () => {
      expect(calculateTeamCount({ numTeams: 0, fallback: 4 })).toBe(4);
      expect(calculateTeamCount({ numTeams: -1, fallback: 4 })).toBe(4);
    });
  });

  describe("priority 2: team_size calculation", () => {
    test("calculates teams from min_players / team_size", () => {
      // 4 players, teams of 2 => 2 teams
      expect(
        calculateTeamCount({ teamSize: 2, minPlayers: 4, fallback: 4 }),
      ).toBe(2);
      // 6 players, teams of 2 => 3 teams
      expect(
        calculateTeamCount({ teamSize: 2, minPlayers: 6, fallback: 6 }),
      ).toBe(3);
      // 6 players, teams of 3 => 2 teams
      expect(
        calculateTeamCount({ teamSize: 3, minPlayers: 6, fallback: 6 }),
      ).toBe(2);
    });

    test("rounds up for uneven division", () => {
      // 5 players, teams of 2 => 3 teams (ceil(5/2) = 3)
      expect(
        calculateTeamCount({ teamSize: 2, minPlayers: 5, fallback: 5 }),
      ).toBe(3);
      // 7 players, teams of 3 => 3 teams (ceil(7/3) = 3)
      expect(
        calculateTeamCount({ teamSize: 3, minPlayers: 7, fallback: 7 }),
      ).toBe(3);
    });

    test("requires both team_size and min_players", () => {
      // Only team_size, no min_players => fallback
      expect(calculateTeamCount({ teamSize: 2, fallback: 4 })).toBe(4);
      // Only min_players, no team_size => fallback
      expect(calculateTeamCount({ minPlayers: 4, fallback: 4 })).toBe(4);
    });

    test("ignores team_size when 0 or negative", () => {
      expect(
        calculateTeamCount({ teamSize: 0, minPlayers: 4, fallback: 4 }),
      ).toBe(4);
      expect(
        calculateTeamCount({ teamSize: -1, minPlayers: 4, fallback: 4 }),
      ).toBe(4);
    });
  });

  describe("priority 3: fallback", () => {
    test("uses fallback when no team config", () => {
      expect(calculateTeamCount({ fallback: 3 })).toBe(3);
      expect(calculateTeamCount({ fallback: 5 })).toBe(5);
    });

    test("uses fallback with undefined values", () => {
      expect(
        calculateTeamCount({
          numTeams: undefined,
          teamSize: undefined,
          minPlayers: undefined,
          fallback: 4,
        }),
      ).toBe(4);
    });
  });

  describe("real game scenarios", () => {
    test("Five Points with various player counts", () => {
      // Five Points: num_teams=2, no team_size constraint
      const fivePointsConfig = { numTeams: 2 };

      // Standard 4 players (2v2)
      expect(calculateTeamCount({ ...fivePointsConfig, fallback: 4 })).toBe(2);
      // 5 players (3v2)
      expect(calculateTeamCount({ ...fivePointsConfig, fallback: 5 })).toBe(2);
      // 6 players (3v3)
      expect(calculateTeamCount({ ...fivePointsConfig, fallback: 6 })).toBe(2);
    });

    test("Vegas with team_size constraint", () => {
      // Vegas: team_size=2, min_players=4
      const vegasConfig = { teamSize: 2, minPlayers: 4 };

      expect(calculateTeamCount({ ...vegasConfig, fallback: 4 })).toBe(2);
    });

    test("Wolf rotating teams (no fixed team count)", () => {
      // Wolf: team_change_every > 0, but no num_teams or team_size
      // Teams are determined dynamically per hole
      expect(calculateTeamCount({ fallback: 4 })).toBe(4);
    });
  });
});
