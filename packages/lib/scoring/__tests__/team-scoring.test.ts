import { describe, expect, it } from "bun:test";
import {
  calculateAggregate,
  calculateAverage,
  calculateBestBall,
  calculateTeamScore,
  calculateWorstBall,
} from "../team-scoring";
import type { PlayerHoleResult } from "../types";

// Helper to create mock player results
function createPlayerResult(playerId: string, net: number): PlayerHoleResult {
  return {
    playerId,
    hasScore: true,
    gross: net + 1, // Assume 1 pop
    pops: 1,
    net,
    scoreToPar: 0,
    netToPar: 0,
    rank: 0,
    tieCount: 0,
    junk: [],
    multipliers: [],
    points: 0,
  };
}

describe("calculateBestBall", () => {
  it("returns the lowest net score on the team", () => {
    const playerResults: Record<string, PlayerHoleResult> = {
      p1: createPlayerResult("p1", 4),
      p2: createPlayerResult("p2", 3),
      p3: createPlayerResult("p3", 5),
    };

    const result = calculateBestBall(["p1", "p2"], playerResults);
    expect(result).toBe(3);
  });

  it("returns 0 for empty player list", () => {
    const playerResults: Record<string, PlayerHoleResult> = {
      p1: createPlayerResult("p1", 4),
    };

    const result = calculateBestBall([], playerResults);
    expect(result).toBe(0);
  });

  it("returns 0 when no players have valid scores", () => {
    const playerResults: Record<string, PlayerHoleResult> = {
      p1: { ...createPlayerResult("p1", 0), net: 0 },
      p2: { ...createPlayerResult("p2", 0), net: 0 },
    };

    const result = calculateBestBall(["p1", "p2"], playerResults);
    expect(result).toBe(0);
  });

  it("handles single player on team", () => {
    const playerResults: Record<string, PlayerHoleResult> = {
      p1: createPlayerResult("p1", 4),
    };

    const result = calculateBestBall(["p1"], playerResults);
    expect(result).toBe(4);
  });
});

describe("calculateAggregate", () => {
  it("returns the sum of all net scores on the team", () => {
    const playerResults: Record<string, PlayerHoleResult> = {
      p1: createPlayerResult("p1", 4),
      p2: createPlayerResult("p2", 3),
      p3: createPlayerResult("p3", 5),
    };

    const result = calculateAggregate(["p1", "p2"], playerResults);
    expect(result).toBe(7); // 4 + 3
  });

  it("returns 0 for empty player list", () => {
    const playerResults: Record<string, PlayerHoleResult> = {
      p1: createPlayerResult("p1", 4),
    };

    const result = calculateAggregate([], playerResults);
    expect(result).toBe(0);
  });

  it("handles all players on team", () => {
    const playerResults: Record<string, PlayerHoleResult> = {
      p1: createPlayerResult("p1", 4),
      p2: createPlayerResult("p2", 3),
      p3: createPlayerResult("p3", 5),
    };

    const result = calculateAggregate(["p1", "p2", "p3"], playerResults);
    expect(result).toBe(12); // 4 + 3 + 5
  });
});

describe("calculateWorstBall", () => {
  it("returns the highest net score on the team", () => {
    const playerResults: Record<string, PlayerHoleResult> = {
      p1: createPlayerResult("p1", 4),
      p2: createPlayerResult("p2", 3),
      p3: createPlayerResult("p3", 5),
    };

    const result = calculateWorstBall(["p1", "p2"], playerResults);
    expect(result).toBe(4);
  });

  it("returns 0 for empty player list", () => {
    const result = calculateWorstBall([], {});
    expect(result).toBe(0);
  });
});

describe("calculateAverage", () => {
  it("returns the average of all net scores on the team", () => {
    const playerResults: Record<string, PlayerHoleResult> = {
      p1: createPlayerResult("p1", 4),
      p2: createPlayerResult("p2", 6),
    };

    const result = calculateAverage(["p1", "p2"], playerResults);
    expect(result).toBe(5); // (4 + 6) / 2
  });

  it("returns 0 for empty player list", () => {
    const result = calculateAverage([], {});
    expect(result).toBe(0);
  });
});

describe("calculateTeamScore", () => {
  const playerResults: Record<string, PlayerHoleResult> = {
    p1: createPlayerResult("p1", 4),
    p2: createPlayerResult("p2", 3),
  };
  const playerIds = ["p1", "p2"];

  it("calculates best_ball correctly", () => {
    const result = calculateTeamScore("best_ball", playerIds, playerResults);
    expect(result.score).toBe(3);
    expect(result.lowBall).toBe(3);
    expect(result.total).toBe(7);
  });

  it("calculates sum correctly", () => {
    const result = calculateTeamScore("sum", playerIds, playerResults);
    expect(result.score).toBe(7);
    expect(result.lowBall).toBe(3);
    expect(result.total).toBe(7);
  });

  it("calculates worst_ball correctly", () => {
    const result = calculateTeamScore("worst_ball", playerIds, playerResults);
    expect(result.score).toBe(4);
    expect(result.lowBall).toBe(3);
    expect(result.total).toBe(7);
  });

  it("calculates average correctly", () => {
    const result = calculateTeamScore("average", playerIds, playerResults);
    expect(result.score).toBe(3.5);
    expect(result.average).toBe(3.5);
  });

  it("returns all zeros for empty player list", () => {
    const result = calculateTeamScore("best_ball", [], playerResults);
    expect(result.score).toBe(0);
    expect(result.lowBall).toBe(0);
    expect(result.total).toBe(0);
    expect(result.average).toBe(0);
  });
});
